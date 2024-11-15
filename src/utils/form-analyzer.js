export class FormAnalyzer {
  constructor() {
    this.formFields = new Map();
    this.fieldPatterns = this.getFieldPatterns();
  }

  getFieldPatterns() {
    return {
      name: {
        labels: ['name', 'full name', 'first name', 'last name'],
        types: ['text'],
        attributes: ['name', 'firstname', 'lastname', 'fullname'],
      },
      email: {
        labels: ['email', 'e-mail', 'email address'],
        types: ['email', 'text'],
        attributes: ['email'],
      },
      phone: {
        labels: ['phone', 'telephone', 'mobile', 'cell'],
        types: ['tel', 'text'],
        attributes: ['phone', 'tel', 'mobile'],
      },
      // Add more field patterns
    };
  }

  async detectFields() {
    // Handle iframes
    const frames = Array.from(document.querySelectorAll('iframe'));
    let allFields = [];

    // Main document fields
    const mainFields = await this.detectFieldsInContext(document);
    allFields.push(...mainFields);

    // Iframe fields
    for (const frame of frames) {
      try {
        const frameFields = await this.detectFieldsInContext(
          frame.contentDocument
        );
        allFields.push(...frameFields);
      } catch (error) {
        console.warn('Could not access iframe content:', error);
      }
    }

    return {
      url: window.location.href,
      fields: allFields,
      timestamp: Date.now(),
      formCount: document.forms.length,
    };
  }

  async detectFieldsInContext(context) {
    const forms = Array.from(context.querySelectorAll('form'));
    const formlessInputs = context.querySelectorAll(
      'input:not(form input), select:not(form select), textarea:not(form textarea)'
    );

    const fields = [];

    // Process forms
    for (const form of forms) {
      const inputs = form.querySelectorAll('input, select, textarea');
      for (const input of inputs) {
        const field = this.analyzeField(input);
        if (field) fields.push(field);
      }
    }

    // Process formless inputs
    for (const input of formlessInputs) {
      const field = this.analyzeField(input);
      if (field) fields.push(field);
    }

    return fields;
  }

  analyzeField(element) {
    const field = {
      type: element.type || element.tagName.toLowerCase(),
      name: element.name || '',
      id: element.id || '',
      required: element.required || false,
      selector: this.generateSelector(element),
    };

    // Get associated label
    const label = this.findFieldLabel(element);
    if (label) {
      field.label = label.textContent.trim();
    }

    // Determine field purpose
    field.purpose = this.determineFieldPurpose(field);

    return field;
  }

  findFieldLabel(element) {
    // Check for explicit label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label;
    }

    // Check for wrapping label
    const parent = element.parentElement;
    if (parent.tagName === 'LABEL') {
      return parent;
    }

    // Check nearby text
    const previous = element.previousElementSibling;
    if (previous && previous.tagName === 'LABEL') {
      return previous;
    }

    return null;
  }

  determineFieldPurpose(field) {
    for (const [purpose, patterns] of Object.entries(this.fieldPatterns)) {
      if (this.matchesPattern(field, patterns)) {
        return purpose;
      }
    }
    return 'unknown';
  }

  matchesPattern(field, patterns) {
    const text = [
      field.name.toLowerCase(),
      field.id.toLowerCase(),
      field.label ? field.label.toLowerCase() : '',
    ].join(' ');

    return (
      patterns.labels.some((label) => text.includes(label)) ||
      patterns.types.includes(field.type) ||
      patterns.attributes.some((attr) => text.includes(attr))
    );
  }

  generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    const attributes = [];
    if (element.className) {
      attributes.push(`.${element.className.split(' ').join('.')}`);
    }

    if (element.name) {
      attributes.push(`[name="${element.name}"]`);
    }

    if (element.type) {
      attributes.push(`[type="${element.type}"]`);
    }

    return `${element.tagName.toLowerCase()}${attributes.join('')}`;
  }
}
