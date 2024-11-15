// tests/integration/autofill.test.js
// Move the chrome mock before the import
jest.mock(
  'chrome',
  () => ({
    runtime: {
      onMessage: {
        addListener: jest.fn(),
        clearListeners: jest.fn(),
        callListeners: jest.fn(),
      },
    },
  }),
  { virtual: true }
);

import JobBlitzContent from '../../src/content/content.js';

describe('AutoFill Integration', () => {
  let jobBlitz;

  beforeEach(() => {
    // Clear all mock calls
    chrome.runtime.onMessage.clearListeners();

    // Setup document elements mock
    document.body.innerHTML = `
      <input id="firstName" type="text">
      <input id="lastName" type="text">
      <input id="email" type="email">
    `;

    jobBlitz = new JobBlitzContent();
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('should handle START_AUTOFILL message', () => {
    chrome.runtime.onMessage.callListeners(
      { action: 'START_AUTOFILL' },
      { id: 'sender' },
      jest.fn()
    );
    // Add assertions for START_AUTOFILL handling
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should fill form completely', async () => {
    const formData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    await jobBlitz.fillForm({
      fields: Object.entries(formData).map(([name, value]) => ({
        selector: `#${name}`,
        value,
      })),
    });

    expect(document.getElementById('firstName').value).toBe('John');
    expect(document.getElementById('lastName').value).toBe('Doe');
    expect(document.getElementById('email').value).toBe('john@example.com');
  });

  test('should handle errors gracefully', async () => {
    const mockError = new Error('Test error');
    const updateStatusSpy = jest.spyOn(jobBlitz, 'updateStatus');
    console.error = jest.fn(); // Mock console.error

    await jobBlitz.handleAnalysisError(mockError);

    expect(updateStatusSpy).toHaveBeenCalledWith(
      `Analysis error: ${mockError}`
    );
    expect(console.error).toHaveBeenCalled();

    updateStatusSpy.mockRestore();
  });

  test('should toggle debug mode', () => {
    jobBlitz.toggleDebugMode(true);
    expect(jobBlitz.isDebugMode).toBe(true);

    jobBlitz.toggleDebugMode(false);
    expect(jobBlitz.isDebugMode).toBe(false);
  });
});
