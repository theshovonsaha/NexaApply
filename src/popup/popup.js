document.addEventListener('DOMContentLoaded', async function () {
  const startFilling = document.getElementById('startFilling');
  const debugMode = document.getElementById('debugMode');
  const editProfile = document.getElementById('editProfile');
  const statusLog = document.getElementById('statusLog');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');

  // Load profile info
  chrome.storage.local.get(['profile'], function (result) {
    if (result.profile) {
      profileName.textContent = `${result.profile.firstName} ${result.profile.lastName}`;
      profileEmail.textContent = result.profile.email;
    }
  });

  // Edit Profile button
  editProfile.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/profile.html'),
    });
  });

  // Debug Mode button
  debugMode.addEventListener('click', () => {
    const isEnabled = debugMode.classList.toggle('active');
    chrome.storage.local.set({ debugMode: isEnabled });
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'TOGGLE_DEBUG',
          data: { enabled: isEnabled },
        });
      }
    });
  });

  // Auto-Fill button
  startFilling.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      statusLog.textContent = 'Starting auto-fill process...';
      startFilling.disabled = true;

      // Inject content script
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js'],
        });
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.log('Content script already present');
      }

      // Start auto-fill
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'START_AUTOFILL',
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Auto-fill failed');
      }

      statusLog.textContent = 'Form filled successfully!';
    } catch (error) {
      console.error('Auto-fill failed:', error);
      statusLog.textContent = `Error: ${error.message}`;
    } finally {
      startFilling.disabled = false;
    }
  });

  // Check API key
  const { apiKey } = await chrome.storage.local.get(['apiKey']);
  if (!apiKey) {
    statusLog.textContent =
      'Please configure your Mistral AI API key in the options page.';
    startFilling.disabled = true;
  }
});
