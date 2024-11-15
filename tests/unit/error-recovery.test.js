import { ErrorTypes, ErrorRecovery } from '../../src/utils/error-recovery';

describe('ErrorRecovery', () => {
  let recovery;

  beforeEach(() => {
    recovery = new ErrorRecovery();
    jest.useFakeTimers();

    // Mock chrome storage
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          remove: jest.fn((key, callback) => callback()),
        },
      },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('should determine error types correctly', () => {
    expect(recovery.determineErrorType(new TypeError('network error'))).toBe(
      ErrorTypes.NETWORK
    );
    expect(recovery.determineErrorType({ name: 'ValidationError' })).toBe(
      ErrorTypes.VALIDATION
    );
    expect(recovery.determineErrorType({ status: 404 })).toBe(ErrorTypes.API);
    expect(
      recovery.determineErrorType({ message: 'storage quota exceeded' })
    ).toBe(ErrorTypes.STORAGE);
    expect(
      recovery.determineErrorType({ message: 'form selector failed' })
    ).toBe(ErrorTypes.FORM);
    expect(recovery.determineErrorType({ message: 'unknown error' })).toBe(
      ErrorTypes.UNKNOWN
    );
  });

  test('should handle network errors with retry', async () => {
    const error = new TypeError('network error');
    const promise = recovery.handleError(error, { maxRetries: 2 });

    jest.advanceTimersByTime(1000);
    const result = await promise;

    expect(result.action).toBe('retry');
    expect(result.context.retryCount).toBe(1);
  }, 10000);

  test('should handle form errors with alternative selectors', async () => {
    const error = new Error('selector failed');
    const field = { name: 'email', type: 'email' };
    const result = await recovery.handleError(error, { field });

    expect(result.action).toBe('retry');
    expect(result.context.selectors).toBeDefined();
    expect(result.context.selectors).toContain('[name="email"]');
  });

  test('should handle API rate limiting', async () => {
    const error = { status: 429, headers: { 'retry-after': '30' } };
    const promise = recovery.handleError(error);

    jest.advanceTimersByTime(30000);
    const result = await promise;

    expect(result.action).toBe('retry');
  }, 10000);

  test('should handle storage quota errors', async () => {
    const error = { name: 'QuotaExceededError' };
    const context = { key: 'testKey', value: 'testValue' };

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ item1: { timestamp: 1000 }, item2: { timestamp: 2000 } });
    });

    const result = await recovery.handleError(error, context);

    expect(result.action).toBe('retry');
    expect(chrome.storage.local.remove).toHaveBeenCalled();
  });

  test('should sanitize values based on type', () => {
    expect(recovery.sanitizeValue(' test@email.com ', 'email')).toBe(
      'test@email.com'
    );
    expect(recovery.sanitizeValue('(123) 456-7890', 'tel')).toBe('+1234567890');
    expect(recovery.sanitizeValue(' John Doe ', 'text')).toBe('John Doe');
    expect(recovery.sanitizeValue('test', 'unknown')).toBe('test');
  });

  test('should generate alternative selectors', () => {
    const field = {
      name: 'email',
      id: 'email-input',
      placeholder: 'Enter email',
      ariaLabel: 'Email address',
      type: 'email',
      labelText: 'Email',
    };

    const selectors = recovery.generateAlternativeSelectors(field);

    expect(selectors).toContain('[name="email"]');
    expect(selectors).toContain('#email-input');
    expect(selectors).toContain('[placeholder="Enter email"]');
    expect(selectors).toContain('[aria-label="Email address"]');
  });

  test('should handle server errors with backoff', async () => {
    const error = { status: 500 };
    const promise = recovery.handleError(error);

    jest.advanceTimersByTime(2000);
    const result = await promise;

    expect(result.action).toBe('retry');
  }, 10000);

  test('should fail after max retries', async () => {
    const error = new TypeError('network error');
    const promise = recovery.handleError(error, {
      maxRetries: 0,
      retryCount: 1,
    });

    jest.runAllTimers();
    const result = await promise;

    expect(result.action).toBe('fail');
    expect(result.error).toBe(error);
  }, 10000);
});
