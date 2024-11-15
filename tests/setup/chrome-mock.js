require('jest-chrome');

const mockStorage = {
  apiKey: 'test-key',
  profile: {
    name: 'Test User',
    email: 'test@example.com',
  },
  settings: {
    debugMode: false,
  },
};

global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListeners: jest.fn(),
      clearListeners: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => Promise.resolve(mockStorage)),
      set: jest.fn((data, callback) => Promise.resolve()),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
};

// Setup global DOM utilities
global.logStatus = jest.fn();
global.showError = jest.fn();
