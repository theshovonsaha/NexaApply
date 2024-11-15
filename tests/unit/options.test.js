import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Add chrome API mock
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
  },
};

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
    // Setup mock implementation before requiring options.js
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'saved-key',
        settings: {
          debugMode: true,
          autoFill: true,
          delay: 500,
        },
      });
    });

    require('../../src/options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for storage operations to complete
    await new Promise(process.nextTick);

    expect(document.getElementById('apiKey').value).toBe('saved-key');
    expect(document.getElementById('debugMode').checked).toBe(true);
  });

  // test('should save settings', async () => {
  //   // Reset modules and setup
  //   jest.resetModules();

  //   // Mock the storage.local.set implementation
  //   chrome.storage.local.set = jest.fn((data, callback) => {
  //     if (callback) callback();
  //   });

  //   // Load options.js and wait for DOMContentLoaded
  //   require('../../src/options/options.js');
  //   document.dispatchEvent(new Event('DOMContentLoaded'));
  //   await new Promise(process.nextTick);

  //   // Setup form values
  //   const form = document.getElementById('optionsForm');
  //   const apiKeyInput = document.getElementById('apiKey');
  //   const debugModeInput = document.getElementById('debugMode');

  //   apiKeyInput.value = 'new-key';
  //   debugModeInput.checked = true;

  //   // Trigger form submit
  //   form.dispatchEvent(
  //     new Event('submit', { cancelable: true, bubbles: true })
  //   );
  //   await new Promise(process.nextTick);

  //   // Verify storage was called
  //   expect(chrome.storage.local.set).toHaveBeenCalledWith(
  //     {
  //       apiKey: 'new-key',
  //       settings: {
  //         debugMode: true,
  //         autoFill: true,
  //         delay: 500,
  //       },
  //     },
  //     expect.any(Function)
  //   );
  // });

  // test('should show save confirmation', async () => {
  //   jest.resetModules();
  //   jest.useFakeTimers();

  //   require('../../src/options/options.js');
  //   document.dispatchEvent(new Event('DOMContentLoaded'));
  //   await new Promise(process.nextTick);

  //   const form = document.getElementById('optionsForm');
  //   form.dispatchEvent(
  //     new Event('submit', { cancelable: true, bubbles: true })
  //   );

  //   // Run all pending timers
  //   jest.runAllTimers();

  //   expect(document.getElementById('status').textContent).toBe(
  //     'Settings saved!'
  //   );
  //   jest.advanceTimersByTime(2000);
  //   expect(document.getElementById('status').textContent).toBe('');

  //   jest.useRealTimers();
  // }, 1000); // Shorter timeout

  // test('should navigate to profile page', async () => {
  //   jest.resetModules();

  //   require('../../src/options/options.js');
  //   document.dispatchEvent(new Event('DOMContentLoaded'));
  //   await new Promise(process.nextTick);

  //   const configureButton = document.getElementById('configureProfile');
  //   configureButton.click();

  //   expect(chrome.tabs.create).toHaveBeenCalledWith({
  //     url: expect.stringContaining('profile.html'),
  //   });
  // }, 1000); // Shorter timeout
});
