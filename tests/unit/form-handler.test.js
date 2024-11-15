import { FormHandler } from '../../src/utils/form-handler';

describe('FormHandler', () => {
  let handler;
  let mockProfile;

  beforeEach(() => {
    handler = new FormHandler();
    mockProfile = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      address: {
        line1: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 2T6',
      },
    };

    document.body.innerHTML = `
      <div>
        <input data-automation-id="sourcePrompt" />
        <input data-automation-id="previousWorker" type="radio" value="No" />
        <select data-automation-id="countryDropdown"></select>
        <input data-automation-id="legalNameSection_firstName" />
        <input data-automation-id="legalNameSection_lastName" />
        <input data-automation-id="addressSection_addressLine1" />
        <input data-automation-id="addressSection_city" />
        <select data-automation-id="addressSection_countryRegion"></select>
        <input data-automation-id="addressSection_postalCode" />
        <select data-automation-id="phone-device-type"></select>
        <select data-automation-id="country-phone-code"></select>
        <input data-automation-id="phone-number" />
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should fill form successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await handler.fillForm(mockProfile);

    expect(result.success).toBe(true);
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('should handle missing fields gracefully', async () => {
    document.body.innerHTML = '<div></div>';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await handler.fillForm(mockProfile);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('should fill address fields when provided', async () => {
    const result = await handler.fillForm(mockProfile);

    const addressLine1 = document.querySelector(
      '[data-automation-id="addressSection_addressLine1"]'
    );
    expect(addressLine1.value).toBe(mockProfile.address.line1);
  });

  test('should set default values for standard fields', async () => {
    await handler.fillForm(mockProfile);

    const sourcePrompt = document.querySelector(
      '[data-automation-id="sourcePrompt"]'
    );
    expect(sourcePrompt.value).toBe('LinkedIn');
  });
});
