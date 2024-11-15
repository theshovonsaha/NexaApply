export class FormHandler {
  constructor() {
    this.fieldPatterns = {
      sourcePrompt: {
        selectors: [
          '[data-automation-id="sourcePrompt"]',
          '[data-automation-id="formField-sourcePrompt"]',
        ],
        defaultValue: 'LinkedIn',
      },
      previousWorker: {
        selectors: [
          '[data-automation-id="previousWorker"]',
          'input[type="radio"][value="No"]',
        ],
        defaultValue: 'No',
      },
      country: {
        selectors: ['[data-automation-id="countryDropdown"]'],
        defaultValue: 'Canada',
      },
      name: {
        firstName: '[data-automation-id="legalNameSection_firstName"]',
        lastName: '[data-automation-id="legalNameSection_lastName"]',
      },
      address: {
        line1: '[data-automation-id="addressSection_addressLine1"]',
        city: '[data-automation-id="addressSection_city"]',
        province: '[data-automation-id="addressSection_countryRegion"]',
        postalCode: '[data-automation-id="addressSection_postalCode"]',
      },
      phone: {
        deviceType: '[data-automation-id="phone-device-type"]',
        countryCode: '[data-automation-id="country-phone-code"]',
        number: '[data-automation-id="phone-number"]',
        extension: '[data-automation-id="phone-extension"]',
      },
    };
  }

  async fillForm(profile) {
    try {
      // Fill source prompt
      await this.fillField('sourcePrompt', 'LinkedIn');

      // Set previous worker to No
      await this.setRadioButton('previousWorker', 'No');

      // Set country
      await this.selectDropdownOption('country', 'Canada');

      // Fill name fields
      await this.fillField(
        this.fieldPatterns.name.firstName,
        profile.firstName
      );
      await this.fillField(this.fieldPatterns.name.lastName, profile.lastName);

      // Fill address if provided
      if (profile.address) {
        await this.fillAddress(profile.address);
      }

      // Fill phone fields
      await this.selectDropdownOption(
        this.fieldPatterns.phone.deviceType,
        'Mobile'
      );
      await this.selectDropdownOption(
        this.fieldPatterns.phone.countryCode,
        'Canada (+1)'
      );
      await this.fillField(this.fieldPatterns.phone.number, profile.phone);

      return { success: true };
    } catch (error) {
      console.error('Form fill error:', error);
      return { success: false, error: error.message };
    }
  }

  async fillField(selector, value) {
    let element;
    if (typeof selector === 'string' && this.fieldPatterns[selector]) {
      for (const sel of this.fieldPatterns[selector].selectors) {
        element = document.querySelector(sel);
        if (element) break;
      }
      value = value || this.fieldPatterns[selector].defaultValue;
    } else {
      element = document.querySelector(selector);
    }

    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async setRadioButton(selector, value) {
    let element;
    if (this.fieldPatterns[selector]) {
      for (const sel of this.fieldPatterns[selector].selectors) {
        element = document.querySelector(sel);
        if (element) break;
      }
    } else {
      element = document.querySelector(selector);
    }

    if (!element) {
      throw new Error(`Radio button not found: ${selector}`);
    }

    element.checked = true;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async selectDropdownOption(selector, value) {
    let element;
    if (this.fieldPatterns[selector]) {
      for (const sel of this.fieldPatterns[selector].selectors) {
        element = document.querySelector(sel);
        if (element) break;
      }
      value = value || this.fieldPatterns[selector].defaultValue;
    } else {
      element = document.querySelector(selector);
    }

    if (!element) {
      throw new Error(`Dropdown not found: ${selector}`);
    }

    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async fillAddress(address) {
    await this.fillField(this.fieldPatterns.address.line1, address.line1);
    await this.fillField(this.fieldPatterns.address.city, address.city);
    await this.fillField(this.fieldPatterns.address.province, address.province);
    await this.fillField(
      this.fieldPatterns.address.postalCode,
      address.postalCode
    );
  }
}
