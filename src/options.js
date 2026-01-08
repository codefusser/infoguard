/**
 * Options Page Script
 * Handles user settings, OAuth authentication, and API key management
 */

class InfoGuardOptions {
  constructor() {
    this.oauthManager = oauthManager;
    this.logger = logger;
    this.errorHandler = errorHandler;
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

    // Google Client ID
    this.clientIdInput = document.getElementById('googleClientIdInput');
    this.saveClientIdBtn = document.getElementById('saveClientIdBtn');

    // API Settings tab
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    this.clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
    this.apiStatusMessage = document.getElementById('apiStatusMessage');
    this.clientIdStatusMessage = document.getElementById('clientIdStatusMessage');

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

    // Client ID
    if (this.saveClientIdBtn) {
      this.saveClientIdBtn.addEventListener('click', () => this.saveClientId());
    }

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
        CONFIG.STORAGE_KEYS.USER_EMAIL,
        CONFIG.STORAGE_KEYS.AUTO_ANALYZE,
        CONFIG.STORAGE_KEYS.ENABLE_NOTIFICATIONS,
        CONFIG.STORAGE_KEYS.DATABASE_CHECK,
        CONFIG.STORAGE_KEYS.CONFIDENCE_THRESHOLD,
        CONFIG.STORAGE_KEYS.GOOGLE_CLIENT_ID
      ]);

      // Load account status
      if (result[CONFIG.STORAGE_KEYS.USER_EMAIL]) {
        this.showSignedIn(result[CONFIG.STORAGE_KEYS.USER_EMAIL]);
      } else {
        this.showSignedOut();
      }

      // Load Client ID
      if (this.clientIdInput && result[CONFIG.STORAGE_KEYS.GOOGLE_CLIENT_ID]) {
        this.clientIdInput.value = result[CONFIG.STORAGE_KEYS.GOOGLE_CLIENT_ID];
      }

      // Load analysis settings
      this.autoAnalyzeToggle.checked = result[CONFIG.STORAGE_KEYS.AUTO_ANALYZE] !== false;
      this.notificationsToggle.checked = result[CONFIG.STORAGE_KEYS.ENABLE_NOTIFICATIONS] !== false;
      this.databaseCheckToggle.checked = result[CONFIG.STORAGE_KEYS.DATABASE_CHECK] !== false;

      if (result[CONFIG.STORAGE_KEYS.CONFIDENCE_THRESHOLD]) {
        this.confidenceThreshold.value = result[CONFIG.STORAGE_KEYS.CONFIDENCE_THRESHOLD];
        this.thresholdValue.textContent = result[CONFIG.STORAGE_KEYS.CONFIDENCE_THRESHOLD] + '%';
      }

      this.logger.info('Options', 'Settings loaded');
    } catch (error) {
      this.logger.error('Options', 'Failed to load settings', error);
    }
  }

  async handleSignIn() {
    this.signInBtn.disabled = true;

    try {
      const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.GOOGLE_CLIENT_ID]);
      const clientId = result[CONFIG.STORAGE_KEYS.GOOGLE_CLIENT_ID] || CONFIG.OAUTH.CLIENT_ID;

      if (!clientId || clientId.includes('YOUR_')) {
        this.showMessage(
          'Please configure your Google Client ID first in the API Settings tab.',
          'error',
          'account'
        );
        this.signInBtn.disabled = false;
        return;
      }

      this.showMessage('Opening Google sign-in...', 'info', 'account');

      // Launch OAuth flow
      const authResult = await this.oauthManager.launchAuthFlow(clientId);

      if (!authResult.accessToken) {
        throw new Error('No access token received');
      }

      // Get user profile
      const profile = await this.oauthManager.getUserProfile(authResult.accessToken);

      // Save authentication data
      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.USER_EMAIL]: profile.email,
        [CONFIG.STORAGE_KEYS.GOOGLE_TOKEN]: authResult.accessToken
      });

      // Save token with expiry
      await this.oauthManager.saveToken(authResult.accessToken, authResult.expiresIn);

      this.showSignedIn(profile.email);
      this.showMessage('Successfully signed in!', 'success', 'account');
      this.logger.info('Options', 'User signed in', { email: profile.email });
    } catch (error) {
      this.logger.error('Options', 'Sign in error', error);
      const message = this.errorHandler.getUserMessage(error, 'Google Sign-In');
      this.showMessage(message, 'error', 'account');
    } finally {
      this.signInBtn.disabled = false;
    }
  }

  async handleSignOut() {
    try {
      this.signOutBtn.disabled = true;
      await this.oauthManager.clearAuth();
      this.showSignedOut();
      this.showMessage('Signed out successfully.', 'success', 'account');
      this.logger.info('Options', 'User signed out');
    } catch (error) {
      this.logger.error('Options', 'Sign out error', error);
      this.showMessage('Failed to sign out. Please try again.', 'error', 'account');
    } finally {
      this.signOutBtn.disabled = false;
    }
  }

  showSignedIn(email) {
    this.accountStatus.textContent = `✓ Signed in as: ${email}`;
    this.accountStatus.classList.add('signed-in');
    this.signInBtn.classList.add('hidden');
    this.signOutBtn.classList.remove('hidden');
  }

  showSignedOut() {
    this.accountStatus.textContent = '✗ Not signed in';
    this.accountStatus.classList.remove('signed-in');
    this.signInBtn.classList.remove('hidden');
    this.signOutBtn.classList.add('hidden');
  }

  async saveClientId() {
    const clientId = this.clientIdInput.value.trim();

    if (!clientId) {
      this.showMessage('Please enter a Google Client ID.', 'error', 'clientId');
      return;
    }

    try {
      this.saveClientIdBtn.disabled = true;

      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.GOOGLE_CLIENT_ID]: clientId
      });

      this.showMessage('Google Client ID saved successfully!', 'success', 'clientId');
      this.logger.info('Options', 'Client ID saved');
    } catch (error) {
      this.logger.error('Options', 'Failed to save Client ID', error);
      this.showMessage('Failed to save Client ID.', 'error', 'clientId');
    } finally {
      this.saveClientIdBtn.disabled = false;
    }
  }

  async saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim();

    if (!apiKey) {
      this.showMessage('Please enter a Gemini API key.', 'error', 'api');
      return;
    }

    try {
      this.saveApiKeyBtn.disabled = true;

      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.GEMINI_API_KEY]: apiKey
      });

      this.apiKeyInput.value = '';
      this.showMessage('Gemini API key saved successfully!', 'success', 'api');
      this.logger.info('Options', 'API key saved');
    } catch (error) {
      this.logger.error('Options', 'Failed to save API key', error);
      this.showMessage('Failed to save API key.', 'error', 'api');
    } finally {
      this.saveApiKeyBtn.disabled = false;
    }
  }

  async clearApiKey() {
    try {
      this.clearApiKeyBtn.disabled = true;

      await chrome.storage.local.remove([CONFIG.STORAGE_KEYS.GEMINI_API_KEY]);

      this.apiKeyInput.value = '';
      this.showMessage('API key cleared.', 'success', 'api');
      this.logger.info('Options', 'API key cleared');
    } catch (error) {
      this.logger.error('Options', 'Failed to clear API key', error);
      this.showMessage('Failed to clear API key.', 'error', 'api');
    } finally {
      this.clearApiKeyBtn.disabled = false;
    }
  }

  async saveAnalysisSettings() {
    try {
      this.saveAnalysisBtn.disabled = true;

      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.AUTO_ANALYZE]: this.autoAnalyzeToggle.checked,
        [CONFIG.STORAGE_KEYS.ENABLE_NOTIFICATIONS]: this.notificationsToggle.checked,
        [CONFIG.STORAGE_KEYS.DATABASE_CHECK]: this.databaseCheckToggle.checked,
        [CONFIG.STORAGE_KEYS.CONFIDENCE_THRESHOLD]: parseInt(this.confidenceThreshold.value)
      });

      this.showMessage('Preferences saved successfully!', 'success', 'analysis');
      this.logger.info('Options', 'Analysis settings saved');
    } catch (error) {
      this.logger.error('Options', 'Failed to save analysis settings', error);
      this.showMessage('Failed to save preferences.', 'error', 'analysis');
    } finally {
      this.saveAnalysisBtn.disabled = false;
    }
  }

  showMessage(text, type, section) {
    let messageBox;

    if (section === 'api') {
      messageBox = this.apiStatusMessage;
    } else if (section === 'clientId') {
      messageBox = this.clientIdStatusMessage;
    } else {
      messageBox = this.analysisStatusMessage;
    }

    if (!messageBox) return;

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
