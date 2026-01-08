// Popup Script
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

class InfoGuardPopup {
  constructor() {
    this.user = null;
    this.isAnalyzing = false;
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
    // Overlay page on demand: request content script to run analysis and draw badges
    this.analyzePageBtn.addEventListener('click', () => this.requestPageOverlay());
    this.analyzeImageBtn.addEventListener('click', () => this.analyzeSelectedImage());
    this.clearBadgesBtn.addEventListener('click', () => this.clearBadgesOnPage());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.errorRetryBtn.addEventListener('click', () => this.hideError());
  }

  async checkAuthStatus() {
    try {
      const result = await chrome.storage.local.get(['userEmail', 'googleToken', 'geminiKey']);
      
      if (result.userEmail && result.googleToken) {
        this.user = {
          email: result.userEmail,
          token: result.googleToken
        };
        this.showMainSection();
      } else {
        this.showAuthSection();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.showAuthSection();
    }
  }

  async handleGoogleSignIn() {
    this.googleSignInBtn.disabled = true;
    this.showLoading('Signing in with Google...');

    try {
      // In a real implementation, you would use chrome.identity.launchWebAuthFlow
      // For now, we'll create a popup window for OAuth
      const authUrl = this.getGoogleAuthUrl();
      
      const authWindow = await chrome.windows.create({
        url: authUrl,
        type: 'popup',
        width: 500,
        height: 600
      });

      // Listen for message from auth page
      const token = await this.waitForAuthToken();
      
      if (token) {
        // Store the token
        await chrome.storage.local.set({
          userEmail: 'user@gmail.com', // Parse from token
          googleToken: token,
          geminiKey: GEMINI_API_KEY
        });

        this.user = {
          email: 'user@gmail.com',
          token: token
        };

        this.showMainSection();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      this.showError('Failed to sign in. Please try again.');
    } finally {
      this.googleSignInBtn.disabled = false;
    }
  }

  async handleGoogleSignOut() {
    try {
      await chrome.storage.local.remove(['userEmail', 'googleToken']);
      this.user = null;
      this.showAuthSection();
    } catch (error) {
      console.error('Sign out error:', error);
      this.showError('Failed to sign out.');
    }
  }

  async analyzeCurrentPage() {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.analyzePageBtn.disabled = true;
    this.showLoading('Scanning page for media...');

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Send overlay request to content script which will draw badges
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'overlayPage' });
      if (response && typeof response.mediaCount !== 'undefined') {
        if (response.mediaCount === 0) this.showError('No images or videos found on this page.');
        else this.hideLoading();
      } else {
        this.showError('Failed to request page overlay.');
      }
    } catch (error) {
      console.error('Page analysis error:', error);
      this.showError('Failed to analyze page. Make sure you\'re on a web page.');
    } finally {
      this.isAnalyzing = false;
      this.analyzePageBtn.disabled = false;
    }
  }

  async requestPageOverlay() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;
    this.analyzePageBtn.disabled = true;
    this.showLoading('Requesting page overlay...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'overlayPage' });
      if (response && typeof response.mediaCount !== 'undefined') {
        if (response.mediaCount === 0) this.showError('No images or videos found on this page.');
        else this.hideLoading();
      } else {
        this.showError('Failed to request page overlay.');
      }
    } catch (err) {
      console.error('Overlay request failed:', err);
      this.showError('Failed to request overlay.');
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
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError('Failed to analyze media. Please try again.');
    }
  }

  async analyzeWithGemini(media) {
    // This would call the background script which handles Gemini API
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'analyzeMedia',
        media: media,
        token: this.user.token
      }, (response) => {
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Analysis failed'));
        }
      });
    });
  }

  displayMediaList(mediaList) {
    this.mediaList.innerHTML = '';
    mediaList.forEach((media, index) => {
      const mediaItem = document.createElement('div');
      mediaItem.className = 'media-item';
      
      if (media.type === 'image') {
        mediaItem.innerHTML = `<img src="${media.src}" alt="Media ${index + 1}">`;
      } else if (media.type === 'video') {
        mediaItem.innerHTML = `<video><source src="${media.src}"></video>`;
      }

      mediaItem.addEventListener('click', () => {
        this.analyzeMedia([media]);
      });

      this.mediaList.appendChild(mediaItem);
    });

    this.mediaSection.classList.remove('hidden');
  }

  displayResult(result) {
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';

    const scorePercentage = Math.round(result.credibilityScore * 100);
    const scoreColor = scorePercentage > 70 ? '#6bcf7f' : scorePercentage > 40 ? '#ffd93d' : '#ff6b6b';

    resultCard.innerHTML = `
      <h4>${result.mediaType.toUpperCase()} Analysis</h4>
      <div class="credibility-score">
        <div class="score-bar">
          <div class="score-fill" style="width: ${scorePercentage}%; background: linear-gradient(90deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%);"></div>
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
    this.loadingIndicator.querySelector('p').textContent = message;
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
    // This would open a dialog to select an image from the page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'selectImage'
    });
  }

  async clearBadgesOnPage() {
    try {
      this.clearBadgesBtn.disabled = true;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'clearBadges' });
      if (response && response.cleared) {
        this.showLoading('Cleared badges on page');
        setTimeout(() => this.hideLoading(), 800);
      } else {
        this.showError('Failed to clear badges on page.');
      }
    } catch (err) {
      console.error('Clear badges failed:', err);
      this.showError('Failed to clear badges.');
    } finally {
      this.clearBadgesBtn.disabled = false;
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  getGoogleAuthUrl() {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: chrome.identity.getRedirectURL(),
      response_type: 'token',
      scope: 'email profile',
      access_type: 'offline'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  waitForAuthToken() {
    return new Promise((resolve) => {
      const listener = (request, sender, sendResponse) => {
        if (request.action === 'authToken') {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(request.token);
        }
      };

      chrome.runtime.onMessage.addListener(listener);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(null);
      }, 5 * 60 * 1000);
    });
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new VibeGuardPopup();
  });
} else {
  new VibeGuardPopup();
}
