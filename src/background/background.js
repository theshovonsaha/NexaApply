// Background Script
let mistralAI = null;
const activeJobs = new Map();

// Add to top of background.js
console.log('Service Worker Initialized');

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('NexaApply installed');

  // Set default settings
  chrome.storage.local.get(['settings'], function (result) {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          debugMode: false,
          autoFill: true,
          delay: 500,
        },
      });
    }
  });
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ANALYZE_FORM') {
    handleFormAnalysis(message.data, sender.tab.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleFormAnalysis(formData, tabId) {
  try {
    const { profile } = await chrome.storage.local.get(['profile']);
    if (!profile) {
      throw new Error('Profile not configured');
    }

    const analysis = {
      fields: formData.fields.map((field) => {
        const fieldText =
          `${field.label} ${field.name} ${field.id}`.toLowerCase();
        let value = '';

        // Enhanced address field detection
        if (/first.*name/i.test(fieldText)) {
          value = profile.firstName;
        } else if (/last.*name/i.test(fieldText)) {
          value = profile.lastName;
        } else if (/phone.*code/i.test(fieldText)) {
          value = '+1';
        } else if (/phone.*number/i.test(fieldText)) {
          value = profile.phone;
        } else if (/address.*line.*1|street|address$/i.test(fieldText)) {
          value = profile.address;
        } else if (/address.*line.*2|suite|apt|unit/i.test(fieldText)) {
          value = profile.addressLine2 || '';
        } else if (/city|town|municipality/i.test(fieldText)) {
          value = profile.city;
        } else if (/state|province|region/i.test(fieldText)) {
          value = profile.state || 'Ontario';
        } else if (/postal.*code|zip/i.test(fieldText)) {
          value = profile.postalCode;
        } else if (/country/i.test(fieldText)) {
          value = profile.country || 'Canada';
        } else if (/hear.*about/i.test(fieldText)) {
          value = 'LinkedIn';
        }

        return {
          selector: field.selector,
          value: value || '',
        };
      }),
    };

    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

function matchFieldWithProfile(field, profile) {
  // Simple pattern matching
  const patterns = {
    firstName: /first.*name|given.*name/i,
    lastName: /last.*name|family.*name|surname/i,
    email: /email/i,
    phone: /phone|telephone|mobile/i,
    address: /address|street/i,
    city: /city|town/i,
    state: /state|province|region/i,
    zip: /zip|postal.*code/i,
  };

  // Check field label and name against patterns
  const fieldText = `${field.label} ${field.name} ${field.id}`.toLowerCase();

  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(fieldText)) {
      return profile[key] || '';
    }
  }

  return '';
}

// Helper function to send messages with retry
async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message timeout'));
        }, 5000);

        chrome.tabs.sendMessage(tabId, message, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}

function updateStatus(data, tabId) {
  // Update job status
  if (activeJobs.has(tabId)) {
    const job = activeJobs.get(tabId);
    job.lastUpdate = Date.now();
    job.lastStatus = data;
    activeJobs.set(tabId, job);
  }

  // Broadcast status to popup if open
  chrome.runtime.sendMessage({
    type: 'STATUS_UPDATE',
    content: data,
  });
}

// Cleanup completed jobs periodically
setInterval(() => {
  const now = Date.now();
  for (const [tabId, job] of activeJobs.entries()) {
    if (job.status === 'complete' && now - job.timestamp > 3600000) {
      activeJobs.delete(tabId);
    }
  }
}, 3600000);

// Add after line 6
chrome.runtime.onStartup.addListener(() => {
  console.log('nexaApply starting up');
  activeJobs.clear();
});

// Error handling for chrome.storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed:`,
      `Old value:`,
      oldValue,
      `New value:`,
      newValue
    );
  }
});
