import {
  validateProfile,
  validateFormField,
  sanitizeFormData,
} from '../../src/utils/validation';

describe('Validation Utils', () => {
  test('should validate profile correctly', () => {
    const validProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mistralKey: 'test-key',
    };

    expect(validateProfile(validProfile).isValid).toBe(true);

    const invalidProfile = {
      firstName: 'John',
    };

    const result = validateProfile(invalidProfile);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('lastName is required');
  });

  test('should validate form fields', () => {
    const emailField = { type: 'email', required: true };

    // Test invalid email
    expect(validateFormField(emailField, 'invalid')).toEqual({
      isValid: false,
      error: 'Invalid email format',
    });

    // Test valid email - update expectation to match implementation
    expect(validateFormField(emailField, 'test@example.com')).toEqual({
      isValid: true,
      error: null,
    });
  });

  test('should sanitize form data', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
    };

    const sanitizedData = sanitizeFormData(data);
    expect(sanitizedData).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
    });
  });
});
