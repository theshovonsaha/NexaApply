import { jest } from '@jest/globals';
import '../setup/chrome-mock';

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

    chrome.runtime.getURL = jest.fn((path) => `chrome-extension://id/${path}`);
    chrome.tabs = {
      query: jest.fn(),
      sendMessage: jest.fn(),
      create: jest.fn(),
    };

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-key',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
      });
    });

    chrome.tabs.query.mockReset();
    chrome.tabs.sendMessage.mockReset();
    chrome.tabs.create.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with profile data', async () => {
    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();

    expect(document.getElementById('profileName').textContent).toBe(
      'Test User'
    );
    expect(document.getElementById('profileEmail').textContent).toBe(
      'test@example.com'
    );
  });

  test('should handle auto-fill button click', async () => {
    chrome.tabs.query.mockResolvedValue([{ id: 1 }]);

    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();

    const startFilling = document.getElementById('startFilling');
    startFilling.click();
    await Promise.resolve();

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
      action: 'START_AUTOFILL',
    });
  });

  test('should handle debug mode toggle', async () => {
    chrome.tabs.query.mockResolvedValue([{ id: 1 }]);

    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();

    const debugMode = document.getElementById('debugMode');
    debugMode.click();
    await Promise.resolve();

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { debugMode: true },
      expect.any(Function)
    );
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
      action: 'TOGGLE_DEBUG',
      data: { enabled: true },
    });
  });

  test('should handle edit profile button click', async () => {
    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();

    document.getElementById('editProfile').click();
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: expect.stringContaining('profile.html'),
    });
  });

  test('should handle auto-fill errors', async () => {
    chrome.tabs.query.mockRejectedValue(new Error('Tab not found'));
    console.error = jest.fn();

    require('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();

    const startFilling = document.getElementById('startFilling');
    startFilling.click();
    await Promise.resolve();

    expect(document.getElementById('statusLog').textContent).toContain(
      'Error: Tab not found'
    );
    expect(startFilling.disabled).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      'Auto-fill error:',
      expect.any(Error)
    );
  });
});
