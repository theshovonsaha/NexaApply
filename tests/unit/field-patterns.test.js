import { FieldPatterns } from '../../src/utils/field-patterns';

describe('Field Patterns', () => {
  let patterns;

  beforeEach(() => {
    patterns = new FieldPatterns();
  });

  test('should match name fields', () => {
    const nameField = { id: 'firstName', name: 'firstName', type: 'text' };
    expect(patterns.isNameField(nameField)).toBe(true);
  });

  test('should match email fields', () => {
    const emailField = { type: 'email', name: 'emailAddress' };
    expect(patterns.isEmailField(emailField)).toBe(true);
  });

  test('should generate field selectors', () => {
    const field = {
      id: 'test-id',
      name: 'test-name',
      type: 'text',
    };
    const selectors = patterns.generateSelectors(field);
    expect(selectors).toContain('#test-id');
    expect(selectors).toContain('[name="test-name"]');
  });
});
