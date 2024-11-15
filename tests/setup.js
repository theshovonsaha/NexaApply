import '@testing-library/jest-dom';

// Custom Chrome API mock with proper implementation
const createMessageHandler = () => {
  const listeners = new Set();
  return {
    addListener: jest.fn((callback) => {
      listeners.add(callback);
    }),
    removeListener: jest.fn((callback) => {
      listeners.delete(callback);
    }),
    hasListeners: jest.fn(() => listeners.size > 0),
    clearListeners: jest.fn(() => {
      listeners.clear();
    }),
    callListeners: jest.fn((message, sender, sendResponse) => {
      listeners.forEach((listener) => listener(message, sender, sendResponse));
    }),
    listeners,
  };
};

// Setup chrome mock
global.chrome = {
  runtime: {
    onInstalled: createMessageHandler(),
    onMessage: createMessageHandler(),
    sendMessage: jest.fn().mockImplementation(() => Promise.resolve()),
    getURL: jest.fn((path) => `chrome-extension://mock-id/${path}`),
  },
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        const mockStorage = {
          apiKey: 'test-key',
          profile: { name: 'Test User', email: 'test@example.com' },
          settings: { debugMode: false },
        };
        if (typeof callback === 'function') {
          callback(mockStorage);
        }
        return Promise.resolve(mockStorage);
      }),
      set: jest.fn().mockImplementation((items, callback) => {
        if (typeof callback === 'function') {
          callback();
        }
        return Promise.resolve();
      }),
    },
    onChanged: createMessageHandler(),
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock console methods
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Mock DOM elements
document.body.innerHTML = '';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';

  // Safely clear listeners
  if (chrome?.runtime?.onMessage?.clearListeners) {
    chrome.runtime.onMessage.clearListeners();
  }
  if (chrome?.runtime?.onInstalled?.clearListeners) {
    chrome.runtime.onInstalled.clearListeners();
  }
  if (chrome?.storage?.onChanged?.clearListeners) {
    chrome.storage.onChanged.clearListeners();
  }
});
