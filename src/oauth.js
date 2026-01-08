/**
 * OAuth Authentication Module
 * Handles Google OAuth 2.0 authentication flow using chrome.identity API
 */

class OAuthManager {
  constructor(config = CONFIG) {
    this.config = config;
    this.tokenRefreshTimeout = null;
  }

  /**
   * Get the redirect URL for OAuth
   */
  getRedirectUrl() {
    return chrome.identity.getRedirectURL('oauth2callback');
  }

  /**
   * Generate the Google OAuth URL
   */
  generateAuthUrl(clientId, redirectUrl, scopes = ['email', 'profile']) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUrl,
      response_type: 'token',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent' // Force consent to get refresh token
    });

    return `${this.config.OAUTH.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Launch the OAuth flow using chrome.identity.launchWebAuthFlow
   * This is the recommended way for Chrome extensions
   */
  async launchAuthFlow(clientId) {
    if (!clientId || clientId.includes('YOUR_')) {
      throw new Error(
        'Google Client ID is not configured. ' +
        'Go to Settings > API Setup and enter your OAuth Client ID from Google Cloud Console.'
      );
    }

    try {
      const redirectUrl = this.getRedirectUrl();
      const authUrl = this.generateAuthUrl(clientId);

      console.log('[OAuth] Launching auth flow...');

      const responseUrl = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          {
            url: authUrl,
            interactive: true
          },
          (responseUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(`Auth failed: ${chrome.runtime.lastError.message}`));
            } else if (!responseUrl) {
              reject(new Error('Auth cancelled by user'));
            } else {
              resolve(responseUrl);
            }
          }
        );
      });

      // Extract token from response URL
      const token = this.extractTokenFromUrl(responseUrl);
      if (!token) {
        throw new Error('No token received from OAuth provider');
      }

      console.log('[OAuth] Auth successful');
      return {
        accessToken: token,
        expiresIn: 3600 // 1 hour default
      };
    } catch (error) {
      console.error('[OAuth] Authentication error:', error);
      throw error;
    }
  }

  /**
   * Extract access token from OAuth redirect URL
   */
  extractTokenFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const hash = urlObj.hash.substring(1); // Remove #
      const params = new URLSearchParams(hash);
      return params.get('access_token');
    } catch (error) {
      console.error('[OAuth] Failed to extract token:', error);
      return null;
    }
  }

  /**
   * Get user profile info using access token
   */
  async getUserProfile(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[OAuth] Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Validate if token is still valid
   */
  async validateToken(accessToken) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      return response.ok;
    } catch (error) {
      console.error('[OAuth] Token validation failed:', error);
      return false;
    }
  }

  /**
   * Save token to storage with expiry information
   */
  async saveToken(accessToken, expiresIn = 3600) {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000);
      await chrome.storage.local.set({
        [this.config.STORAGE_KEYS.GOOGLE_TOKEN]: accessToken,
        [this.config.STORAGE_KEYS.TOKEN_EXPIRY]: expiryTime
      });

      // Schedule token refresh before expiry
      this.scheduleTokenRefresh(expiresIn);

      console.log('[OAuth] Token saved');
    } catch (error) {
      console.error('[OAuth] Failed to save token:', error);
      throw error;
    }
  }

  /**
   * Get stored token
   */
  async getStoredToken() {
    try {
      const result = await chrome.storage.local.get([
        this.config.STORAGE_KEYS.GOOGLE_TOKEN,
        this.config.STORAGE_KEYS.TOKEN_EXPIRY
      ]);

      const token = result[this.config.STORAGE_KEYS.GOOGLE_TOKEN];
      const expiry = result[this.config.STORAGE_KEYS.TOKEN_EXPIRY];

      if (!token) return null;

      // Check if token is expired
      if (expiry && Date.now() > expiry) {
        console.warn('[OAuth] Token expired');
        await chrome.storage.local.remove([
          this.config.STORAGE_KEYS.GOOGLE_TOKEN,
          this.config.STORAGE_KEYS.TOKEN_EXPIRY
        ]);
        return null;
      }

      return token;
    } catch (error) {
      console.error('[OAuth] Failed to get stored token:', error);
      return null;
    }
  }

  /**
   * Schedule token refresh before expiry
   */
  scheduleTokenRefresh(expiresIn) {
    // Clear existing timeout
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    // Refresh 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;
    if (refreshTime > 0) {
      this.tokenRefreshTimeout = setTimeout(() => {
        console.log('[OAuth] Token refresh triggered');
        this.emit('token-refresh-needed');
      }, refreshTime);
    }
  }

  /**
   * Clear stored authentication
   */
  async clearAuth() {
    try {
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
      }

      await chrome.storage.local.remove([
        this.config.STORAGE_KEYS.GOOGLE_TOKEN,
        this.config.STORAGE_KEYS.TOKEN_EXPIRY,
        this.config.STORAGE_KEYS.USER_EMAIL,
        this.config.STORAGE_KEYS.REFRESH_TOKEN
      ]);

      console.log('[OAuth] Authentication cleared');
    } catch (error) {
      console.error('[OAuth] Failed to clear auth:', error);
      throw error;
    }
  }

  /**
   * Emit custom events for OAuth state changes
   */
  emit(eventName, data = {}) {
    const event = new CustomEvent(`oauth:${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }
}

// Create singleton instance
const oauthManager = new OAuthManager(CONFIG);
