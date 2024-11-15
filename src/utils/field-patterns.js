export class FieldPatterns {
  constructor() {
    this.patterns = {
      name: {
        selectors: ['name', 'fullname', 'full_name'],
        types: ['text'],
      },
      email: {
        selectors: ['email', 'e-mail', 'emailaddress'],
        types: ['email'],
      },
      phone: {
        selectors: ['phone', 'telephone', 'mobile', 'cell'],
        types: ['tel', 'text'],
      },
    };
  }

  isNameField(field) {
    return this.matchesPattern(field, this.patterns.name);
  }

  isEmailField(field) {
    return this.matchesPattern(field, this.patterns.email);
  }

  generateSelectors(field) {
    const selectors = [];
    if (field.id) selectors.push(`#${field.id}`);
    if (field.name) selectors.push(`[name="${field.name}"]`);
    if (field.type) selectors.push(`[type="${field.type}"]`);
    return selectors;
  }

  matchesPattern(field, pattern) {
    const nameMatch = pattern.selectors.some(
      (selector) =>
        field.id?.toLowerCase().includes(selector) ||
        field.name?.toLowerCase().includes(selector)
    );
    const typeMatch = pattern.types.includes(field.type);
    return nameMatch || typeMatch;
  }
}
