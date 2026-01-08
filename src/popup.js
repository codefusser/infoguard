// Popup Script

class InfoGuardPopup {
  constructor() {
    this.user = null;
    this.isAnalyzing = false;
    this.oauthManager = oauthManager;
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.initializeElements();
    this.attachEventListeners();
    this.checkAuthStatus();
  }

  initializeElements() {
    // Auth section elements
    this.authSection = document.getElementById('authSection');
    this.mainSection = document.getElementById('mainSection');
    this.errorSection = document.getElementById('errorSection');
    this.googleSignInBtn = document.getElementById('googleSignInBtn');
    this.googleSignOutBtn = document.getElementById('googleSignOutBtn');

    // Main section elements
    this.analyzePageBtn = document.getElementById('analyzePageBtn');
    this.analyzeImageBtn = document.getElementById('analyzeImageBtn');
    this.clearBadgesBtn = document.getElementById('clearBadgesBtn');
    this.settingsBtn = document.getElementById('settingsBtn');

    // Results section elements
    this.resultsSection = document.getElementById('resultsSection');
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.resultsContent = document.getElementById('resultsContent');

    // Media section elements
    this.mediaSection = document.getElementById('mediaSection');
    this.mediaList = document.getElementById('mediaList');

    // User info
    this.userInfo = document.getElementById('userInfo');
    this.errorText = document.getElementById('errorText');
    this.errorRetryBtn = document.getElementById('errorRetryBtn');
  }

  attachEventListeners() {
    this.googleSignInBtn.addEventListener('click', () => this.handleGoogleSignIn());
    this.googleSignOutBtn.addEventListener('click', () => this.handleGoogleSignOut());
    this.analyzePageBtn.addEventListener('click', () => this.requestPageOverlay());
    this.analyzeImageBtn.addEventListener('click', () => this.analyzeSelectedImage());
    this.clearBadgesBtn.addEventListener('click', () => this.clearBadgesOnPage());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.errorRetryBtn.addEventListener('click', () => this.hideError());
  }

  async checkAuthStatus() {
    try {
      const token = await this.oauthManager.getStoredToken();
      const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.USER_EMAIL]);
      const userEmail = result[CONFIG.STORAGE_KEYS.USER_EMAIL];

      if (token && userEmail) {
        this.user = {
          email: userEmail,
          token: token
        };
        this.showMainSection();
        this.logger.info('Popup', 'User authenticated', { email: userEmail });
      } else {
        this.showAuthSection();
      }
    } catch (error) {
      this.logger.error('Popup', 'Auth check failed', error);
      this.showAuthSection();
    }
  }

  async handleGoogleSignIn() {
    this.googleSignInBtn.disabled = true;
    this.showLoading('Signing in with Google...');

    try {
      // Get Client ID from storage or use default
      const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.GOOGLE_CLIENT_ID]);
      const clientId = result[CONFIG.STORAGE_KEYS.GOOGLE_CLIENT_ID] || CONFIG.OAUTH.CLIENT_ID;

      // Check if Client ID is configured
      if (!clientId || clientId.includes('YOUR_')) {
        this.hideLoading();
        this.showError(
          '⚙️ Setup Required: Please configure your Google Client ID in Settings first.\n\n' +
          'Steps:\n' +
          '1. Click the ⚙️ button (top right)\n' +
          '2. Go to "API Setup" tab\n' +
          '3. Enter your Google OAuth Client ID\n' +
          '4. Click "Save Client ID"\n' +
          '5. Return to try signing in again'
        );
        this.googleSignInBtn.disabled = false;
        return;
      }

      // Launch OAuth flow
      const authResult = await this.oauthManager.launchAuthFlow(clientId);

      if (!authResult.accessToken) {
        throw new Error('No access token received');
      }

      // Get user profile info
      const profile = await this.oauthManager.getUserProfile(authResult.accessToken);

      // Save authentication data
      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.USER_EMAIL]: profile.email,
        [CONFIG.STORAGE_KEYS.GOOGLE_TOKEN]: authResult.accessToken
      });

      // Save token with expiry
      await this.oauthManager.saveToken(authResult.accessToken, authResult.expiresIn);

      this.user = {
        email: profile.email,
        token: authResult.accessToken
      };

      this.logger.info('Popup', 'Google sign-in successful', { email: profile.email });
      this.hideLoading();
      this.showMainSection();
    } catch (error) {
      this.logger.error('Popup', 'Sign in error', error);
      const message = this.errorHandler.getUserMessage(error, 'Google Sign-In');
      this.showError(message);
    } finally {
      this.googleSignInBtn.disabled = false;
    }
  }

  async handleGoogleSignOut() {
    try {
      this.googleSignOutBtn.disabled = true;
      await this.oauthManager.clearAuth();
      this.user = null;
      this.logger.info('Popup', 'User signed out');
      this.showAuthSection();
    } catch (error) {
      this.logger.error('Popup', 'Sign out error', error);
      this.showError('Failed to sign out. Please try again.');
    } finally {
      this.googleSignOutBtn.disabled = false;
    }
  }

  async requestPageOverlay() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;
    this.analyzePageBtn.disabled = true;
    this.showLoading('Scanning page for media...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'overlayPage' });

      if (response && typeof response.mediaCount !== 'undefined') {
        if (response.mediaCount === 0) {
          this.showError('No images or videos found on this page.');
        } else {
          this.hideLoading();
          this.logger.info('Popup', 'Page overlay requested', { mediaCount: response.mediaCount });
        }
      } else {
        this.showError('Failed to request page overlay.');
      }
    } catch (error) {
      this.logger.error('Popup', 'Overlay request failed', error);
      const message = this.errorHandler.getUserMessage(error, 'Page Analysis');
      this.showError(message);
    } finally {
      this.isAnalyzing = false;
      this.analyzePageBtn.disabled = false;
    }
  }

  async analyzeMedia(mediaList) {
    this.showLoading('Analyzing with Gemini AI...');
    this.resultsContent.innerHTML = '';

    try {
      for (const media of mediaList) {
        const result = await this.analyzeWithGemini(media);
        this.displayResult(result);
      }

      this.hideLoading();
      this.logger.info('Popup', 'Media analysis completed', { count: mediaList.length });
    } catch (error) {
      this.logger.error('Popup', 'Analysis error', error);
      const message = this.errorHandler.getUserMessage(error, 'Media Analysis');
      this.showError(message);
    }
  }

  async analyzeWithGemini(media) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'analyzeMedia',
          media: media,
          token: this.user.token
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Analysis failed'));
          }
        }
      );
    });
  }

  displayResult(result) {
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';

    const scorePercentage = Math.round(result.credibilityScore * 100);
    const scoreColor = scorePercentage > 70 ? CONFIG.COLORS.HIGH : scorePercentage > 40 ? CONFIG.COLORS.MEDIUM : CONFIG.COLORS.LOW;

    resultCard.innerHTML = `
      <h4>${result.mediaType.toUpperCase()} Analysis</h4>
      <div class="credibility-score">
        <div class="score-bar">
          <div class="score-fill" style="width: ${scorePercentage}%; background: linear-gradient(90deg, ${CONFIG.COLORS.LOW} 0%, ${CONFIG.COLORS.MEDIUM} 50%, ${CONFIG.COLORS.HIGH} 100%);"></div>
        </div>
        <span class="score-value" style="color: ${scoreColor};">${scorePercentage}%</span>
      </div>
      <div class="credibility-text">
        <strong>Assessment:</strong> ${result.assessment}
      </div>
      <div class="analysis-detail">
        <p><strong>Artifacts Detected:</strong> ${result.artifacts.join(', ') || 'None'}</p>
        <p><strong>Inconsistencies:</strong> ${result.inconsistencies.join(', ') || 'None'}</p>
        <p><strong>Confidence:</strong> ${result.confidence}%</p>
      </div>
    `;

    this.resultsContent.appendChild(resultCard);
    this.resultsSection.classList.remove('hidden');
  }

  showLoading(message = 'Processing...') {
    const messageElement = this.loadingIndicator.querySelector('p');
    if (messageElement) {
      messageElement.textContent = message;
    }
    this.loadingIndicator.classList.remove('hidden');
  }

  hideLoading() {
    this.loadingIndicator.classList.add('hidden');
  }

  showMainSection() {
    this.authSection.classList.add('hidden');
    this.mainSection.classList.remove('hidden');
    this.errorSection.classList.add('hidden');
    this.userInfo.textContent = `Signed in as: ${this.user.email}`;
  }

  showAuthSection() {
    this.authSection.classList.remove('hidden');
    this.mainSection.classList.add('hidden');
    this.errorSection.classList.add('hidden');
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorSection.classList.remove('hidden');
    this.loadingIndicator.classList.add('hidden');
  }

  hideError() {
    this.errorSection.classList.add('hidden');
  }

  async analyzeSelectedImage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      chrome.tabs.sendMessage(tab.id, {
        action: 'selectImage'
      });

      this.logger.info('Popup', 'Image selection mode activated');
    } catch (error) {
      this.logger.error('Popup', 'Image selection failed', error);
      this.showError('Failed to enable image selection.');
    }
  }

  async clearBadgesOnPage() {
    try {
      this.clearBadgesBtn.disabled = true;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'clearBadges' });

      if (response && response.cleared) {
        this.showLoading('Cleared badges on page');
        setTimeout(() => this.hideLoading(), 800);
        this.logger.info('Popup', 'Badges cleared');
      } else {
        this.showError('Failed to clear badges on page.');
      }
    } catch (error) {
      this.logger.error('Popup', 'Clear badges failed', error);
      this.showError('Failed to clear badges.');
    } finally {
      this.clearBadgesBtn.disabled = false;
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new InfoGuardPopup();
  });
} else {
  new InfoGuardPopup();
}
