/**
 * InfoGuard Configuration Module
 * Centralized configuration for API endpoints, OAuth settings, and environment variables
 */

const CONFIG = {
  // Environment
  ENV: 'production', // 'development' or 'production'
  DEBUG: false,

  // Google OAuth Configuration
  OAUTH: {
    CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE', // Set via Chrome extension options
    SCOPES: ['email', 'profile'],
    AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
    TOKEN_URL: 'https://oauth2.googleapis.com/token',
    REDIRECT_PATH: '/oauth/callback'
  },

  // Gemini API Configuration
  GEMINI: {
    API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    MODEL: 'gemini-2.0-flash',
    // API key is retrieved from storage at runtime, never hardcoded
  },

  // Trusted Fact-Check Databases
  FACT_CHECK_DATABASES: {
    snopes: 'https://snopes.com/api/claims',
    factcheck: 'https://www.factcheck.org/api',
    fullfact: 'https://fullfact.org/api',
    politifact: 'https://www.politifact.com/api'
  },

  // Storage Keys
  STORAGE_KEYS: {
    USER_EMAIL: 'userEmail',
    GOOGLE_TOKEN: 'googleToken',
    TOKEN_EXPIRY: 'tokenExpiry',
    REFRESH_TOKEN: 'refreshToken',
    GEMINI_API_KEY: 'geminiKey',
    AUTO_ANALYZE: 'autoAnalyze',
    ENABLE_NOTIFICATIONS: 'enableNotifications',
    DATABASE_CHECK: 'databaseCheck',
    CONFIDENCE_THRESHOLD: 'confidenceThreshold',
    GOOGLE_CLIENT_ID: 'googleClientId'
  },

  // Timeouts and Limits
  TIMEOUTS: {
    ANALYSIS: 30000, // 30 seconds
    AUTH: 300000, // 5 minutes
    API_RETRY: 5000 // 5 seconds
  },

  // Batch Analysis
  BATCH: {
    MAX_MEDIA_PER_REQUEST: 50,
    AUTO_ANALYZE_INTERVAL: 5000, // 5 seconds
    AUTO_ANALYZE_BATCH_SIZE: 10
  },

  // Credibility Score Thresholds
  CREDIBILITY_THRESHOLDS: {
    HIGH: 0.7, // 70% - Green
    MEDIUM: 0.4, // 40% - Yellow
    LOW: 0 // Below 40% - Red
  },

  // Color codes for UI
  COLORS: {
    HIGH: '#6bcf7f', // Green
    MEDIUM: '#ffd93d', // Yellow
    LOW: '#ff6b6b' // Red
  },

  // API Error Messages
  ERROR_MESSAGES: {
    AUTH_FAILED: 'Authentication failed. Please sign in again.',
    API_KEY_MISSING: 'Gemini API key is not configured. Please add it in settings.',
    GEMINI_ERROR: 'Failed to analyze media. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    INVALID_MEDIA: 'Invalid or inaccessible media.',
    RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
    UNAUTHORIZED: 'Unauthorized. Please sign in again.',
    UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
  },

  /**
   * Validate configuration
   */
  validate() {
    if (!this.OAUTH.CLIENT_ID || this.OAUTH.CLIENT_ID.includes('YOUR_')) {
      console.warn('[InfoGuard] Google Client ID not configured. User must set it in options.');
    }
    return true;
  },

  /**
   * Get storage key for given config property
   */
  getStorageKey(property) {
    return this.STORAGE_KEYS[property] || property;
  },

  /**
   * Merge user-provided config with defaults
   */
  mergeConfig(userConfig) {
    Object.assign(this, userConfig);
    this.validate();
  }
};

// Validate on load
CONFIG.validate();
