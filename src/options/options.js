document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.local.get(['apiKey', 'settings'], (result) => {
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if (result.settings?.debugMode) {
      document.getElementById('debugMode').checked = result.settings.debugMode;
    }
  });

  // Save settings
  document.getElementById('save').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const debugMode = document.getElementById('debugMode').checked;

    chrome.storage.local.set(
      {
        apiKey: apiKey,
        settings: {
          debugMode: debugMode,
          autoFill: true,
          delay: 500,
        },
      },
      () => {
        const status = document.getElementById('status');
        status.textContent = 'Settings saved!';
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
      }
    );
  });

  // Configure profile
  document.getElementById('configureProfile').addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/profile.html'),
    });
  });
});
