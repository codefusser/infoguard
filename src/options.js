// Options Page Script

class InfoGuardOptions {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.loadSettings();
  }

  initializeElements() {
    // Tab elements
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabPanes = document.querySelectorAll('.tab-pane');

    // Account tab
    this.signInBtn = document.getElementById('signInBtn');
    this.signOutBtn = document.getElementById('signOutBtn');
    this.accountStatus = document.getElementById('accountStatus');
    this.accountStatusBox = document.getElementById('accountStatusBox');

    // API Settings tab
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    this.clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
    this.apiStatusMessage = document.getElementById('apiStatusMessage');

    // Analysis tab
    this.autoAnalyzeToggle = document.getElementById('autoAnalyzeToggle');
    this.notificationsToggle = document.getElementById('notificationsToggle');
    this.databaseCheckToggle = document.getElementById('databaseCheckToggle');
    this.confidenceThreshold = document.getElementById('confidenceThreshold');
    this.thresholdValue = document.getElementById('thresholdValue');
    this.saveAnalysisBtn = document.getElementById('saveAnalysisBtn');
    this.analysisStatusMessage = document.getElementById('analysisStatusMessage');
  }

  attachEventListeners() {
    // Tab switching
    this.tabBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => this.switchTab(e));
    });

    // Account
    this.signInBtn.addEventListener('click', () => this.handleSignIn());
    this.signOutBtn.addEventListener('click', () => this.handleSignOut());

    // API Settings
    this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
    this.clearApiKeyBtn.addEventListener('click', () => this.clearApiKey());

    // Analysis Settings
    this.confidenceThreshold.addEventListener('input', (e) => {
      this.thresholdValue.textContent = e.target.value + '%';
    });
    this.saveAnalysisBtn.addEventListener('click', () => this.saveAnalysisSettings());
  }

  switchTab(e) {
    const tabName = e.target.getAttribute('data-tab');

    // Hide all tabs
    this.tabPanes.forEach((pane) => {
      pane.classList.remove('active');
    });

    // Remove active class from all buttons
    this.tabBtns.forEach((btn) => {
      btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    e.target.classList.add('active');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        'userEmail',
        'autoAnalyze',
        'enableNotifications',
        'databaseCheck',
        'confidenceThreshold'
      ]);

      // Load account status
      if (result.userEmail) {
        this.showSignedIn(result.userEmail);
      } else {
        this.showSignedOut();
      }

      // Load analysis settings
      this.autoAnalyzeToggle.checked = result.autoAnalyze !== false;
      this.notificationsToggle.checked = result.enableNotifications !== false;
      this.databaseCheckToggle.checked = result.databaseCheck !== false;

      if (result.confidenceThreshold) {
        this.confidenceThreshold.value = result.confidenceThreshold;
        this.thresholdValue.textContent = result.confidenceThreshold + '%';
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async handleSignIn() {
    this.signInBtn.disabled = true;

    try {
      // In a real implementation, use chrome.identity.launchWebAuthFlow
      const email = prompt('Enter your Google email:');
      
      if (email) {
        await chrome.storage.local.set({
          userEmail: email,
          googleToken: 'mock_token_' + Date.now()
        });

        this.showSignedIn(email);
        this.showMessage('Account connected successfully!', 'success', 'account');
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      this.showMessage('Sign in failed. Please try again.', 'error', 'account');
    } finally {
      this.signInBtn.disabled = false;
    }
  }

  async handleSignOut() {
    try {
      await chrome.storage.local.remove(['userEmail', 'googleToken']);
      this.showSignedOut();
      this.showMessage('Signed out successfully.', 'success', 'account');
    } catch (error) {
      console.error('Sign out failed:', error);
      this.showMessage('Sign out failed.', 'error', 'account');
    }
  }

  showSignedIn(email) {
    this.accountStatus.textContent = `Signed in as: ${email}`;
    this.accountStatus.classList.add('signed-in');
    this.signInBtn.classList.add('hidden');
    this.signOutBtn.classList.remove('hidden');
  }

  showSignedOut() {
    this.accountStatus.textContent = 'Not signed in';
    this.accountStatus.classList.remove('signed-in');
    this.signInBtn.classList.remove('hidden');
    this.signOutBtn.classList.add('hidden');
  }

  async saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim();

    if (!apiKey) {
      this.showMessage('Please enter an API key.', 'error', 'api');
      return;
    }

    try {
      this.saveApiKeyBtn.disabled = true;

      await chrome.storage.local.set({ geminiKey: apiKey });

      this.apiKeyInput.value = '';
      this.showMessage('API key saved successfully!', 'success', 'api');
    } catch (error) {
      console.error('Failed to save API key:', error);
      this.showMessage('Failed to save API key.', 'error', 'api');
    } finally {
      this.saveApiKeyBtn.disabled = false;
    }
  }

  async clearApiKey() {
    try {
      this.clearApiKeyBtn.disabled = true;

      await chrome.storage.local.remove(['geminiKey']);

      this.apiKeyInput.value = '';
      this.showMessage('API key cleared.', 'success', 'api');
    } catch (error) {
      console.error('Failed to clear API key:', error);
      this.showMessage('Failed to clear API key.', 'error', 'api');
    } finally {
      this.clearApiKeyBtn.disabled = false;
    }
  }

  async saveAnalysisSettings() {
    try {
      this.saveAnalysisBtn.disabled = true;

      await chrome.storage.local.set({
        autoAnalyze: this.autoAnalyzeToggle.checked,
        enableNotifications: this.notificationsToggle.checked,
        databaseCheck: this.databaseCheckToggle.checked,
        confidenceThreshold: parseInt(this.confidenceThreshold.value)
      });

      this.showMessage('Preferences saved successfully!', 'success', 'analysis');
    } catch (error) {
      console.error('Failed to save analysis settings:', error);
      this.showMessage('Failed to save preferences.', 'error', 'analysis');
    } finally {
      this.saveAnalysisBtn.disabled = false;
    }
  }

  showMessage(text, type, section) {
    const messageBox = section === 'api' ? this.apiStatusMessage : this.analysisStatusMessage;

    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageBox.classList.add('hidden');
    }, 5000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new InfoGuardOptions();
  });
} else {
  new InfoGuardOptions();
}
