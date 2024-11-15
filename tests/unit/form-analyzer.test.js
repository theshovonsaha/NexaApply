// tests/unit/form-analyzer.test.js
import { FormAnalyzer } from '../../src/utils/form-analyzer';

describe('FormAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new FormAnalyzer();
    document.body.innerHTML = `
            <form id="testForm">
                <label for="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" required />
                
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required />
                
                <div class="phone-wrapper">
                    <label>Phone Number</label>
                    <input type="tel" class="phone-input" name="phone" />
                </div>
                
                <select id="country" name="country">
                    <option value="US">United States</option>
                </select>
            </form>
            <iframe id="testFrame"></iframe>
        `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should detect all form fields', async () => {
    const result = await analyzer.detectFields();

    expect(result.fields).toHaveLength(4);
    expect(result.formCount).toBe(1);
    expect(result.url).toBe(window.location.href);
  });

  test('should analyze field with explicit label', () => {
    const input = document.getElementById('firstName');
    const field = analyzer.analyzeField(input);

    expect(field.type).toBe('text');
    expect(field.name).toBe('firstName');
    expect(field.required).toBe(true);
    expect(field.label).toBe('First Name');
    expect(field.purpose).toBe('name');
  });

  test('should generate unique selectors', () => {
    const input = document.querySelector('.phone-input');
    const selector = analyzer.generateSelector(input);

    expect(selector).toContain('phone-input');
    expect(selector).toContain('[type="tel"]');
  });

  test('should determine field purpose', () => {
    const emailInput = document.getElementById('email');
    const field = analyzer.analyzeField(emailInput);

    expect(field.purpose).toBe('email');
  });

  test('should handle iframes', async () => {
    const frame = document.getElementById('testFrame');
    const mockFrameDocument = {
      querySelectorAll: jest.fn().mockReturnValue([]),
      forms: [],
    };

    Object.defineProperty(frame, 'contentDocument', {
      get: () => mockFrameDocument,
    });

    const result = await analyzer.detectFields();
    expect(result.fields).toBeDefined();
  });

  test('should handle iframe access errors', async () => {
    const frame = document.getElementById('testFrame');
    Object.defineProperty(frame, 'contentDocument', {
      get: () => {
        throw new Error('Access denied');
      },
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    await analyzer.detectFields();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
