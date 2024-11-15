import { FormAnalyzer } from '../utils/form-analyzer.js';
import { DebugOverlay } from '../utils/debug-overlay.js';

export default class JobBlitzContent {
  constructor() {
    this.setupMessageListeners();
    console.log('JobBlitz Content Script Initialized');
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message);

      switch (message.action) {
        case 'START_AUTOFILL':
          this.handleAutoFill()
            .then(() => sendResponse({ success: true }))
            .catch((error) =>
              sendResponse({ success: false, error: error.message })
            );
          return true; // Keep message channel open for async response

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    });
  }

  async handleAutoFill() {
    try {
      // Detect form fields
      const fields = await this.detectFields();
      console.log('Detected fields:', fields); // Debug log

      // Send to background for analysis
      const response = await chrome.runtime.sendMessage({
        action: 'ANALYZE_FORM',
        data: { fields },
      });
      console.log('Analysis response:', response); // Debug log

      // Check if response contains error
      if (response.error) {
        throw new Error(response.error);
      }

      // Fill the form with analyzed data
      await this.fillForm(response);
      return { success: true };
    } catch (error) {
      console.error('Auto-fill error:', error);
      throw error;
    }
  }

  async detectFields() {
    const inputs = document.querySelectorAll('input, select, textarea');
    const fields = [];

    for (const input of inputs) {
      const label = this.findLabel(input);
      fields.push({
        type: input.type || input.tagName.toLowerCase(),
        name: input.name,
        id: input.id,
        label: label,
        selector: this.generateSelector(input),
        value: input.value,
        purpose: this.determinePurpose(label, input),
      });
    }

    return fields;
  }

  determinePurpose(label, input) {
    const text = (label + ' ' + input.name + ' ' + input.id).toLowerCase();

    if (/first.*name/i.test(text)) return 'firstName';
    if (/last.*name/i.test(text)) return 'lastName';
    if (/phone|tel|extension|country.*code/i.test(text)) return 'phone';
    if (/email/i.test(text)) return 'email';
    if (/address|city|postal|zip/i.test(text)) return 'address';

    return 'unknown';
  }

  findLabel(input) {
    // Try finding an explicit label
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent.trim();
    }

    // Try finding a parent label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();

    // Try finding nearby text that might be a label
    const parent = input.parentElement;
    if (parent) {
      const text = Array.from(parent.childNodes)
        .filter((node) => node.nodeType === 3) // Text nodes only
        .map((node) => node.textContent.trim())
        .filter((text) => text.length > 0)
        .join(' ');
      if (text) return text;
    }

    return '';
  }

  generateSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;

    // Generate a unique selector using classes and attributes
    const classes = Array.from(element.classList).join('.');
    return classes ? `.${classes}` : element.tagName.toLowerCase();
  }

  async fillForm(analysis) {
    // Debug log the incoming data
    console.log('Filling form with:', analysis);

    // Validate analysis data
    if (!analysis || !analysis.fields || !Array.isArray(analysis.fields)) {
      console.error('Invalid analysis data:', analysis);
      throw new Error('Invalid analysis data');
    }

    // Process each field
    for (const field of analysis.fields) {
      try {
        if (!field.selector || field.value === undefined) {
          console.warn('Skipping invalid field:', field);
          continue;
        }

        const element = document.querySelector(field.selector);
        if (!element) {
          console.warn(`Element not found for selector: ${field.selector}`);
          continue;
        }

        await this.fillField(element, field.value);
      } catch (error) {
        console.error(`Failed to fill field:`, field, error);
      }
    }
  }

  async fillField(element, value) {
    if (!value) return;

    element.focus();

    if (element.tagName === 'SELECT') {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Clear existing value
    element.value = '';

    // Type with small random delays
    for (const char of value) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 30 + Math.random() * 50));
    }

    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Initialize content script
const jobBlitz = new JobBlitzContent();
