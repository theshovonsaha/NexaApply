import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { validateProfile } from '../../src/options/profile.js';

describe('Profile Management', () => {
  let container;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <div class="container">
        <form id="profileForm">
          <div class="form-section">
            <div class="form-group">
              <input id="firstName" name="firstName" value="John">
              <input id="lastName" name="lastName" value="Doe">
              <input id="email" name="email" value="john@example.com">
              <input id="phone" name="phone" value="1234567890">
            </div>
          </div>
        </form>
      </div>
    `;
    container = document.querySelector('.container');

    // Reset mocks
    chrome.storage.local.get.mockReset();
    chrome.storage.local.set.mockReset();

    // Default mock implementations
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ profile: null });
    });

    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('Profile Validation', () => {
    test('should validate required fields', () => {
      const profile = {
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const result = validateProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('First name is required');
    });

    test('should pass validation with valid profile', () => {
      const profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const result = validateProfile(profile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Profile Loading', () => {
    test('should load profile from storage', async () => {
      const mockProfile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ profile: mockProfile });
      });

      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        ['profile'],
        expect.any(Function)
      );
      expect(document.getElementById('firstName').value).toBe('John');
      expect(document.getElementById('lastName').value).toBe('Doe');
      expect(document.getElementById('email').value).toBe('john@example.com');
      expect(document.getElementById('phone').value).toBe('1234567890');
    });
  });

  describe('Profile Saving', () => {
    beforeEach(() => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    test('should save valid profile', () => {
      const form = document.getElementById('profileForm');
      const submitEvent = new Event('submit');
      submitEvent.preventDefault = jest.fn();
      form.dispatchEvent(submitEvent);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        {
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
          },
        },
        expect.any(Function)
      );
    });

    test('should show success message after saving', () => {
      const form = document.getElementById('profileForm');
      const submitEvent = new Event('submit');
      submitEvent.preventDefault = jest.fn();
      form.dispatchEvent(submitEvent);

      const statusMessage = container.querySelector('.status-message.success');
      expect(statusMessage).toBeTruthy();
      expect(statusMessage.textContent).toBe('Profile saved successfully!');

      jest.advanceTimersByTime(3000);
      expect(container.querySelector('.status-message')).toBeNull();
    });
  });
});
