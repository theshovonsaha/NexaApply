import { jest } from '@jest/globals';
import '../setup/chrome-mock';

describe('Options Page', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <form id="optionsForm">
          <input type="text" id="apiKey" value="test-key">
          <input type="checkbox" id="debugMode">
          <button id="save" type="submit">Save</button>
          <div id="status"></div>
        </form>
        <button id="configureProfile">Configure Profile</button>
      </div>
    `;

    // Reset chrome storage mock
    chrome.storage.local.get.mockReset();
    chrome.storage.local.set.mockReset();

    // Setup default mock implementations
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'saved-key',
        settings: { debugMode: true },
      });
    });

    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });

    chrome.tabs = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should load saved settings', async () => {
    const options = require('../../src/options/options.js');

    // Trigger DOMContentLoaded
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(document.getElementById('apiKey').value).toBe('saved-key');
    expect(document.getElementById('debugMode').checked).toBe(true);
  });

  test('should save settings', async () => {
    const options = require('../../src/options/options.js');
    await new Promise((resolve) => setTimeout(resolve, 100));

    const form = document.getElementById('optionsForm');
    document.getElementById('apiKey').value = 'new-key';
    document.getElementById('debugMode').checked = true;

    // Dispatch submit event
    const submitEvent = new Event('submit');
    submitEvent.preventDefault = jest.fn();
    form.dispatchEvent(submitEvent);

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      {
        apiKey: 'new-key',
        settings: {
          debugMode: true,
          autoFill: true,
          delay: 500,
        },
      },
      expect.any(Function)
    );
  });

  test('should show save confirmation', async () => {
    jest.useFakeTimers();
    const options = require('../../src/options/options.js');
    await new Promise((resolve) => setTimeout(resolve, 100));

    const form = document.getElementById('optionsForm');
    const submitEvent = new Event('submit');
    submitEvent.preventDefault = jest.fn();
    form.dispatchEvent(submitEvent);

    expect(document.getElementById('status').textContent).toBe(
      'Settings saved!'
    );

    jest.advanceTimersByTime(2000);
    expect(document.getElementById('status').textContent).toBe('');
    jest.useRealTimers();
  }, 15000); // Increased timeout

  test('should navigate to profile page', async () => {
    const options = require('../../src/options/options.js');
    await new Promise((resolve) => setTimeout(resolve, 100));

    document.getElementById('configureProfile').click();
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: expect.stringContaining('profile.html'),
    });
  }, 15000); // Increased timeout
});
