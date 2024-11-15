document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  setupFormHandlers();
});

function loadProfile() {
  chrome.storage.local.get(['profile'], (result) => {
    if (result.profile) {
      Object.keys(result.profile).forEach((key) => {
        const element = document.getElementById(key);
        if (element) {
          element.value = result.profile[key];
        }
      });
    }
  });
}

function setupFormHandlers() {
  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const profile = {};

    formData.forEach((value, key) => {
      profile[key] = value;
    });

    validateAndSaveProfile(profile);
  });
}

function validateAndSaveProfile(profile) {
  const { isValid, errors } = validateProfile(profile);

  if (!isValid) {
    showStatus(errors.join('\n'), 'error');
    return false;
  }

  chrome.storage.local.set({ profile }, () => {
    showStatus('Profile saved successfully!', 'success');
  });

  return true;
}

function showStatus(message, type) {
  const status = document.createElement('div');
  status.className = `status-message ${type}`;
  status.textContent = message;
  document.querySelector('.container').appendChild(status);
  setTimeout(() => status.remove(), 3000);
}

export function validateProfile(profile) {
  const errors = [];

  if (!profile.firstName?.trim()) {
    errors.push('First name is required');
  }
  if (!profile.lastName?.trim()) {
    errors.push('Last name is required');
  }
  if (!profile.email?.trim()) {
    errors.push('Email is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
