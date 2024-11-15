// Error types
export const ErrorTypes = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  API: 'api',
  FORM: 'form',
  STORAGE: 'storage',
  UNKNOWN: 'unknown',
};

// Error recovery strategies
export class ErrorRecovery {
  constructor() {
    this.maxRetries = 3;
  }

  determineErrorType(error) {
    if (error.name === 'ValidationError') {
      return ErrorTypes.VALIDATION;
    }
    if (error instanceof TypeError && error.message.includes('network')) {
      return ErrorTypes.NETWORK;
    }
    if (error.status === 429 || error.status >= 500 || error.status === 404) {
      return ErrorTypes.API;
    }
    if (
      error.name === 'QuotaExceededError' ||
      error.message?.includes('storage')
    ) {
      return ErrorTypes.STORAGE;
    }
    if (error.message?.includes('selector failed')) {
      return ErrorTypes.FORM;
    }
    return ErrorTypes.UNKNOWN;
  }

  async handleNetworkError(error, context) {
    const delay = Math.pow(2, context.retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return {
      action: 'retry',
      context: { ...context, retryCount: context.retryCount + 1 },
    };
  }

  async handleApiError(error, context) {
    const retryAfter = error.headers?.['retry-after'];
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return {
      action: 'retry',
      context: { ...context, retryCount: context.retryCount + 1 },
    };
  }

  async handleFormError(error, context) {
    const { field } = context;
    const selectors = [
      `[name="${field.name}"]`,
      `#${field.name}`,
      `[type="${field.type}"]`,
    ];
    return {
      action: 'retry',
      context: { ...context, selectors },
    };
  }

  async handleError(error, context = {}) {
    const errorType = this.determineErrorType(error);
    const retryCount = context.retryCount || 0;
    const maxRetries = context.maxRetries ?? this.maxRetries;

    if (retryCount >= maxRetries) {
      return {
        action: 'fail',
        error,
      };
    }

    switch (errorType) {
      case ErrorTypes.NETWORK:
        return this.handleNetworkError(error, { ...context, retryCount });
      case ErrorTypes.API:
        return this.handleApiError(error, { ...context, retryCount });
      case ErrorTypes.FORM:
        return this.handleFormError(error, context);
      case ErrorTypes.STORAGE:
        return this.handleStorageError(error, context);
      default:
        return { action: 'fail', error };
    }
  }

  sanitizeValue(value, type) {
    switch (type) {
      case 'email':
        return value.trim().toLowerCase();
      case 'tel':
        return '+' + value.replace(/[^0-9]/g, '');
      case 'text':
        return value.trim();
      default:
        return value;
    }
  }

  generateAlternativeSelectors(field) {
    const selectors = [];

    if (field.name) {
      selectors.push(`[name="${field.name}"]`);
    }
    if (field.id) {
      selectors.push(`#${field.id}`);
    }
    if (field.placeholder) {
      selectors.push(`[placeholder="${field.placeholder}"]`);
    }
    if (field.ariaLabel) {
      selectors.push(`[aria-label="${field.ariaLabel}"]`);
    }
    if (field.type) {
      selectors.push(`[type="${field.type}"]`);
    }

    return selectors;
  }

  async handleStorageError(error, context) {
    const { key, value } = context;

    // Get all items and sort by timestamp
    const items = await new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });

    const sortedItems = Object.entries(items).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    // Remove oldest items
    while (sortedItems.length > 0) {
      const [oldKey] = sortedItems.shift();
      await new Promise((resolve) => {
        chrome.storage.local.remove(oldKey, resolve);
      });
      if (sortedItems.length <= 5) break;
    }

    return {
      action: 'retry',
      context: { key, value },
    };
  }
}

// Error handler instance
export const errorHandler = new ErrorRecovery();

export class FormRecovery {
  static async attemptRecovery(error, field, formData) {
    switch (error.type) {
      case ErrorTypes.VALIDATION:
        return this.handleValidationError(field);
      case ErrorTypes.FORM:
        return this.handleFormError(field, formData);
      default:
        throw error;
    }
  }

  static async handleValidationError(field) {
    const sanitizedValue = this.sanitizeValue(field.value, field.type);
    return { ...field, value: sanitizedValue };
  }

  static async handleFormError(field, formData) {
    const alternativeSelectors = this.generateAlternativeSelectors(field);
    for (const selector of alternativeSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return { ...field, selector };
      }
    }
    throw new Error('No recovery possible');
  }
}
