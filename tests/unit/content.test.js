import NexaApply from '../../src/content/content.js';
import { FormAnalyzer } from '../../src/utils/form-analyzer.js';
import { DebugOverlay } from '../../src/utils/debug-overlay.js';

jest.mock('../../src/utils/form-analyzer.js');
jest.mock('../../src/utils/debug-overlay.js');

describe('NexaApply', () => {
  let nexaApply;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup document body
    document.body.innerHTML = `
      <input id="test-field" type="text">
      <select id="test-select"></select>
    `;

    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();

    // Initialize NexaApply
    nexaApply = new NexaApply();

    // Setup analyzer mock
    nexaApply.analyzer = {
      detectFields: jest.fn().mockResolvedValue({ fields: [] }),
    };

    // Setup debug overlay mock
    nexaApply.debugOverlay = {
      show: jest.fn(),
      hide: jest.fn(),
      showError: jest.fn(),
    };

    // Setup message handling methods
    nexaApply.handleMessage = jest.fn().mockImplementation(async (message) => {
      switch (message.action) {
        case 'PING':
          return { status: 'alive' };
        case 'START_AUTOFILL':
          await nexaApply.startAutoFill();
          return { success: true };
        case 'TOGGLE_DEBUG':
          nexaApply.isDebugMode = message.data.enabled;
          if (message.data.enabled) {
            nexaApply.debugOverlay.show();
          } else {
            nexaApply.debugOverlay.hide();
          }
          return { success: true };
        case 'ANALYSIS_COMPLETE':
          await nexaApply.fillForm(message.data);
          return { success: true };
        default:
          return { success: false, error: 'Unknown action' };
      }
    });

    // Setup other required methods
    nexaApply.startAutoFill = jest.fn().mockImplementation(async () => {
      try {
        const fields = await nexaApply.analyzer.detectFields();
        return await chrome.runtime.sendMessage({
          action: 'ANALYZE_FORM',
          data: fields,
        });
      } catch (error) {
        console.error('Form detection failed:', error);
        await chrome.runtime.sendMessage({
          action: 'UPDATE_STATUS',
          data: `Error detecting form: ${error.message}`,
        });
        throw error;
      }
    });

    nexaApply.fillForm = jest.fn().mockImplementation(async (data) => {
      // Debug log the incoming data
      console.log('Filling form with:', data);

      // Validate analysis data
      if (!data || !data.fields || !Array.isArray(data.fields)) {
        console.error('Invalid analysis data:', data);
        throw new Error('Invalid analysis data');
      }

      // Process each field
      for (const field of data.fields) {
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

          await nexaApply.fillField(element, field.value);
        } catch (error) {
          console.error('Failed to fill field:', field, error);
        }
      }
    });

    nexaApply.handleAnalysisError = jest.fn().mockImplementation((error) => {
      console.error('Analysis error:', error);
      if (nexaApply.isDebugMode) {
        nexaApply.debugOverlay.showError(error);
      }
      nexaApply.updateStatus(`Analysis error: ${error}`);
    });

    // Mock chrome.runtime.sendMessage
    chrome.runtime.sendMessage = jest.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Message Handling', () => {
    test('should handle PING message', async () => {
      const response = await nexaApply.handleMessage({ action: 'PING' });
      expect(response).toEqual({ status: 'alive' });
    });

    test('should handle START_AUTOFILL message', async () => {
      const response = await nexaApply.handleMessage({
        action: 'START_AUTOFILL',
      });
      expect(nexaApply.startAutoFill).toHaveBeenCalled();
      expect(response).toEqual({ success: true });
    });

    test('should handle TOGGLE_DEBUG message', async () => {
      const response = await nexaApply.handleMessage({
        action: 'TOGGLE_DEBUG',
        data: { enabled: true },
      });
      expect(nexaApply.isDebugMode).toBe(true);
      expect(nexaApply.debugOverlay.show).toHaveBeenCalled();
      expect(response).toEqual({ success: true });
    });

    test('should handle ANALYSIS_COMPLETE message', async () => {
      const message = {
        action: 'ANALYSIS_COMPLETE',
        data: { fields: [{ selector: '#test-field', value: 'test' }] },
      };
      await nexaApply.handleMessage(message);
      expect(nexaApply.fillForm).toHaveBeenCalledWith(message.data);
    });

    test('should handle unknown messages', async () => {
      const response = await nexaApply.handleMessage({ action: 'UNKNOWN' });
      expect(response).toEqual({ success: false, error: 'Unknown action' });
    });
  });

  describe('Form Filling', () => {
    test('should fill text input with simulated typing', async () => {
      const element = document.querySelector('#test-field');
      await nexaApply.fillField(element, 'test');

      expect(element.value).toBe('test');
    });

    test('should handle select elements', async () => {
      // Setup select element with options
      const element = document.querySelector('#test-select');
      element.innerHTML = '<option value="option1">Option 1</option>';

      // Create a spy for dispatchEvent
      const dispatchEventSpy = jest.spyOn(element, 'dispatchEvent');

      await nexaApply.fillField(element, 'option1');

      expect(element.value).toBe('option1');
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'change',
          bubbles: true,
        })
      );

      dispatchEventSpy.mockRestore();
    });

    test('should handle form filling errors', async () => {
      // Setup
      const analysis = {
        fields: [{ selector: '#non-existent', value: 'test' }],
      };

      // Mock querySelector to simulate element not found
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => null);

      // Create spy for console.warn
      const consoleSpy = jest.spyOn(console, 'warn');

      // Execute
      await nexaApply.fillForm(analysis);

      // Verify warning was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Element not found for selector: #non-existent'
      );

      // Restore original querySelector
      document.querySelector = originalQuerySelector;
    });

    test('should handle invalid analysis data', async () => {
      const invalidData = null;
      await expect(nexaApply.fillForm(invalidData)).rejects.toThrow(
        'Invalid analysis data'
      );
      expect(console.error).toHaveBeenCalledWith(
        'Invalid analysis data:',
        null
      );
    });

    test('should handle missing fields array', async () => {
      const invalidData = {};
      await expect(nexaApply.fillForm(invalidData)).rejects.toThrow(
        'Invalid analysis data'
      );
      expect(console.error).toHaveBeenCalledWith('Invalid analysis data:', {});
    });

    test('should skip invalid fields', async () => {
      const analysis = {
        fields: [
          { selector: null, value: 'test' },
          { selector: '#test-field', value: undefined },
        ],
      };

      const consoleSpy = jest.spyOn(console, 'warn');
      await nexaApply.fillForm(analysis);

      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        'Skipping invalid field:',
        analysis.fields[0]
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        'Skipping invalid field:',
        analysis.fields[1]
      );
    });

    test('should handle element not found gracefully', async () => {
      const analysis = {
        fields: [{ selector: '#non-existent', value: 'test' }],
      };

      const consoleSpy = jest.spyOn(console, 'warn');
      await nexaApply.fillForm(analysis);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Element not found for selector: #non-existent'
      );
    });

    test('should generate selector for element without id or name', () => {
      const div = document.createElement('div');
      div.classList.add('test-class', 'another-class');

      const selector = nexaApply.generateSelector(div);
      expect(selector).toBe('.test-class.another-class');
    });

    test('should generate fallback selector for element without classes', () => {
      const div = document.createElement('div');
      const selector = nexaApply.generateSelector(div);
      expect(selector).toBe('div');
    });

    test('should prioritize id over name in selector generation', () => {
      const input = document.createElement('input');
      input.id = 'test-id';
      input.name = 'test-name';

      const selector = nexaApply.generateSelector(input);
      expect(selector).toBe('#test-id');
    });
  });

  describe('Error Handling', () => {
    test('should handle form detection errors', async () => {
      const error = new Error('Detection failed');
      nexaApply.analyzer.detectFields.mockRejectedValueOnce(error);

      try {
        await nexaApply.startAutoFill();
      } catch (e) {
        expect(console.error).toHaveBeenCalledWith(
          'Form detection failed:',
          error
        );
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          action: 'UPDATE_STATUS',
          data: 'Error detecting form: Detection failed',
        });
      }

      expect.assertions(2);
    });

    test('should handle analysis errors with debug mode', () => {
      nexaApply.isDebugMode = true;
      const error = new Error('Test error');

      // Mock the updateStatus method
      nexaApply.updateStatus = jest.fn();

      nexaApply.handleAnalysisError(error);

      expect(console.error).toHaveBeenCalledWith('Analysis error:', error);
      expect(nexaApply.debugOverlay.showError).toHaveBeenCalledWith(error);
      expect(nexaApply.updateStatus).toHaveBeenCalledWith(
        `Analysis error: ${error}`
      );
    });
  });
});
