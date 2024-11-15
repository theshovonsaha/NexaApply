import JobBlitzContent from '../../src/content/content.js';
import { FormAnalyzer } from '../../src/utils/form-analyzer.js';
import { DebugOverlay } from '../../src/utils/debug-overlay.js';

jest.mock('../../src/utils/form-analyzer.js');
jest.mock('../../src/utils/debug-overlay.js');

describe('JobBlitzContent', () => {
  let jobBlitz;
  let mockSendResponse;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup document body
    document.body.innerHTML = `
      <input id="test-field" type="text">
      <select id="test-select"></select>
    `;

    // Mock console.error
    console.error = jest.fn();

    // Initialize mocks
    mockSendResponse = jest.fn();

    // Mock FormAnalyzer
    FormAnalyzer.mockImplementation(() => ({
      detectFields: jest.fn().mockResolvedValue({ fields: [] }),
    }));

    // Mock DebugOverlay
    DebugOverlay.mockImplementation(() => ({
      show: jest.fn(),
      hide: jest.fn(),
      showError: jest.fn(),
    }));

    // Initialize JobBlitzContent
    jobBlitz = new JobBlitzContent();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('Message Handling', () => {
    test('should handle PING message', () => {
      const message = { action: 'PING' };
      const sender = {};

      jobBlitz.setupMessageListeners();
      const listener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      listener(message, sender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({ status: 'alive' });
    });

    test('should handle START_AUTOFILL message', async () => {
      const message = { action: 'START_AUTOFILL' };
      const sender = {};

      jobBlitz.setupMessageListeners();
      const listener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      await listener(message, sender, mockSendResponse);

      expect(jobBlitz.analyzer.detectFields).toHaveBeenCalled();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'ANALYZE_FORM',
        data: { fields: [] },
      });
    });

    test('should handle TOGGLE_DEBUG message', () => {
      const message = {
        action: 'TOGGLE_DEBUG',
        data: { enabled: true },
      };
      const sender = {};

      jobBlitz.setupMessageListeners();
      const listener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      listener(message, sender, mockSendResponse);

      expect(jobBlitz.isDebugMode).toBe(true);
      expect(jobBlitz.debugOverlay.show).toHaveBeenCalled();
    });

    test('should handle ANALYSIS_COMPLETE message', async () => {
      const message = {
        action: 'ANALYSIS_COMPLETE',
        data: {
          fields: [{ selector: '#test-field', value: 'test' }],
        },
      };
      const sender = {};

      // Mock fillForm
      jobBlitz.fillForm = jest.fn().mockResolvedValue(undefined);

      jobBlitz.setupMessageListeners();
      const listener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      await listener(message, sender, mockSendResponse);

      expect(jobBlitz.fillForm).toHaveBeenCalledWith(message.data);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'UPDATE_STATUS',
        data: 'Form filled successfully',
      });
    });

    test('should handle ANALYSIS_ERROR message', () => {
      const message = {
        action: 'ANALYSIS_ERROR',
        error: 'Test error',
      };
      const sender = {};

      jobBlitz.setupMessageListeners();
      const listener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      listener(message, sender, mockSendResponse);

      expect(console.error).toHaveBeenCalledWith(
        'Analysis error:',
        'Test error'
      );
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'UPDATE_STATUS',
        data: 'Analysis error: Test error',
      });
    });
  });

  describe('Form Filling', () => {
    test('should fill text input with simulated typing', async () => {
      const element = document.querySelector('#test-field');
      await jobBlitz.fillField(element, 'test');

      expect(element.value).toBe('test');
    });

    test('should handle select elements', async () => {
      // Setup select element with options
      const element = document.querySelector('#test-select');
      element.innerHTML = '<option value="option1">Option 1</option>';

      // Create a spy for dispatchEvent
      const dispatchEventSpy = jest.spyOn(element, 'dispatchEvent');

      await jobBlitz.fillField(element, 'option1');

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
      document.querySelector = jest.fn(() => {
        throw new Error('Element not found');
      });

      // Execute
      await jobBlitz.fillForm(analysis);

      // Verify
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fill field: #non-existent',
        expect.any(Error)
      );

      // Restore original querySelector
      document.querySelector = originalQuerySelector;
    });
  });

  describe('Error Handling', () => {
    test('should handle form detection errors', async () => {
      const error = new Error('Detection failed');
      jobBlitz.analyzer.detectFields.mockRejectedValueOnce(error);

      await jobBlitz.startAutoFill();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'UPDATE_STATUS',
        data: 'Error detecting form: Detection failed',
      });
      expect(console.error).toHaveBeenCalledWith(
        'Form detection failed:',
        error
      );
    });

    test('should handle analysis errors with debug mode', () => {
      jobBlitz.isDebugMode = true;
      const error = new Error('Test error');

      jobBlitz.handleAnalysisError(error);

      expect(console.error).toHaveBeenCalledWith('Analysis error:', error);
      expect(jobBlitz.debugOverlay.showError).toHaveBeenCalledWith(error);
    });
  });
});
