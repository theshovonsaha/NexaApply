import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

describe('Popup', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <button id="startFilling" class="primary">Auto-Fill Form</button>
        <button id="debugMode" class="secondary">Debug Mode</button>
        <button id="editProfile">Edit Profile</button>
        <div id="statusLog"></div>
        <div id="profileName"></div>
        <div id="profileEmail"></div>
      </div>
    `;

    // Reset mocks
    jest.clearAllMocks();

    // Mock storage data
    const mockStorageData = {
      apiKey: 'test-key',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
    };

    // Mock Chrome storage
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      if (callback) {
        callback(mockStorageData);
      }
      return Promise.resolve(mockStorageData);
    });

    // Mock Chrome tabs
    chrome.tabs.query.mockImplementation(() =>
      Promise.resolve([{ id: 1, active: true }])
    );
    chrome.tabs.sendMessage.mockImplementation(() =>
      Promise.resolve({ success: true })
    );
    chrome.scripting = {
      executeScript: jest.fn().mockResolvedValue([{ result: true }]),
    };
  });

  test('should initialize with profile data', async () => {
    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(process.nextTick);

    expect(document.getElementById('profileName').textContent).toBe(
      'Test User'
    );
    expect(document.getElementById('profileEmail').textContent).toBe(
      'test@example.com'
    );
  });

  // test('should handle debug mode toggle', async () => {
  //   // Reset the mock implementation from beforeEach
  //   chrome.tabs.query.mockReset();

  //   // Mock tabs.query to properly handle both Promise and callback styles
  //   chrome.tabs.query.mockImplementation((query) => {
  //     return Promise.resolve([{ id: 1 }]);
  //   });

  //   require('../../src/popup/popup.js');
  //   document.dispatchEvent(new Event('DOMContentLoaded'));
  //   await new Promise(process.nextTick);

  //   const debugMode = document.getElementById('debugMode');
  //   debugMode.click();

  //   // Wait for all promises to resolve
  //   await Promise.resolve();
  //   await new Promise(process.nextTick);

  //   expect(chrome.storage.local.set).toHaveBeenCalledWith({ debugMode: true });
  //   expect(chrome.tabs.query).toHaveBeenCalledWith({
  //     active: true,
  //     currentWindow: true,
  //   });
  //   expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
  //     action: 'TOGGLE_DEBUG',
  //     data: { enabled: true },
  //   });
  // });

  test('should handle successful auto-fill', async () => {
    // Reset mock implementations
    chrome.tabs.query.mockReset();
    chrome.tabs.sendMessage.mockReset();

    // Setup mocks
    chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
    chrome.tabs.sendMessage.mockResolvedValue({ success: true });

    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(process.nextTick);

    const startFilling = document.getElementById('startFilling');
    startFilling.click();

    // Wait for all promises to resolve
    await Promise.resolve();
    await new Promise(process.nextTick);

    // Additional wait for the executeScript and setTimeout
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 1 },
      files: ['content/content.js'],
    });

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
      action: 'START_AUTOFILL',
    });

    expect(document.getElementById('statusLog').textContent).toBe(
      'Form filled successfully!'
    );
  });

  test('should handle auto-fill errors', async () => {
    chrome.tabs.query.mockRejectedValue(new Error('Tab not found'));
    console.error = jest.fn();

    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(process.nextTick);

    const startFilling = document.getElementById('startFilling');
    startFilling.click();
    await new Promise(process.nextTick);

    expect(document.getElementById('statusLog').textContent).toBe(
      'Error: Tab not found'
    );
    expect(startFilling.disabled).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      'Auto-fill failed:',
      expect.any(Error)
    );
  });

  test('should handle missing API key', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const data = { apiKey: null };
      if (callback) callback(data);
      return Promise.resolve(data);
    });

    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(process.nextTick);

    expect(document.getElementById('statusLog').textContent).toBe(
      'Please configure your Mistral AI API key in the options page.'
    );
    expect(document.getElementById('startFilling').disabled).toBe(true);
  });

  test('should handle edit profile button click', async () => {
    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(process.nextTick);

    document.getElementById('editProfile').click();
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: expect.stringContaining('options/profile.html'),
    });
  });
});
