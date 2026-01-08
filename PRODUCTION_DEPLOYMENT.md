# InfoGuard - Production Deployment Guide

## Overview

This guide covers the complete setup and deployment process for InfoGuard in a production environment. All authentication now uses proper Google OAuth 2.0 with `chrome.identity.launchWebAuthFlow`.

## Architecture Changes

### Key Improvements Made

1. **Proper OAuth 2.0 Implementation**
   - Uses `chrome.identity.launchWebAuthFlow` (Chrome's recommended approach)
   - Secure token-based authentication
   - Automatic token refresh before expiry
   - Token validation on each API call

2. **Configuration Management**
   - Centralized `config.js` module
   - Environment-specific settings
   - Secure API endpoint management
   - Credibility thresholds and color coding

3. **Error Handling & Logging**
   - Dedicated `utils.js` module with Logger and ErrorHandler
   - User-friendly error messages
   - Comprehensive debug logging
   - Retry logic for failed API calls

4. **Security Enhancements**
   - Content Security Policy in manifest
   - Token expiry management
   - Secure storage of credentials
   - No hardcoded API keys in code

## Required Setup Steps

### 1. Google Cloud Console Setup

#### Create a Google Cloud Project
```bash
1. Go to https://console.cloud.google.com
2. Create a new project named "InfoGuard"
3. Enable the following APIs:
   - Generative Language API (for Gemini)
   - Google Identity and Access Management API
4. Create OAuth 2.0 credentials:
   - Type: Web application
   - Add authorized redirect URIs:
     * https://<your-extension-id>.chromiumapp.org/oauth2callback
```

#### Get Your Extension ID
```bash
1. Go to chrome://extensions
2. Enable "Developer mode" (top right)
3. Load unpacked extension and note the ID
4. Use this ID in the redirect URI above
```

#### Get the Client ID
```bash
1. In Google Cloud Console, go to Credentials
2. Copy your OAuth 2.0 Client ID
3. You'll enter this in the extension settings
```

### 2. Extension Installation & Configuration

#### Install the Extension
```bash
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the InfoGuard folder
```

#### Configure Settings
```bash
1. Click the InfoGuard icon in your toolbar
2. Click the ⚙️ settings button
3. Go to "API Setup" tab
4. Enter your Google OAuth Client ID
5. Optionally add a Gemini API Key (if not using OAuth)
6. Go to "Account" tab
7. Click "Sign in with Google"
8. Complete the OAuth flow
```

### 3. API Configuration

#### Gemini API Key (Optional - for direct API access)
```bash
1. Go to https://ai.google.dev
2. Click "Get API Key"
3. Create a new API key
4. In extension settings, paste it in the API Key field
```

#### Alternative: Use OAuth Token (Recommended)
- The OAuth token is automatically obtained during Google Sign-in
- No need to manually configure an API key
- Token is automatically refreshed when needed

## File Structure Overview

### New Production Modules

- **`config.js`** - Centralized configuration
  - API endpoints
  - OAuth settings
  - Storage keys
  - Error messages
  - Timeout values

- **`oauth.js`** - OAuth flow management
  - `launchAuthFlow()` - Initiates OAuth
  - `getUserProfile()` - Gets user info
  - `validateToken()` - Checks token validity
  - `saveToken()` - Stores token with expiry
  - `getStoredToken()` - Retrieves valid token
  - `clearAuth()` - Logout functionality

- **`utils.js`** - Utilities & error handling
  - `Logger` class - Application logging
  - `ErrorHandler` class - User-friendly errors
  - `RetryHandler` class - Retry logic

### Updated Production Files

- **`manifest.json`**
  - Added `identity` permission
  - Updated host permissions for API calls
  - Added Content Security Policy

- **`background.js`**
  - Proper error handling throughout
  - Token validation before API calls
  - Logging for all operations
  - Context menu integration

- **`popup.js`**
  - Uses OAuth flow from oauth.js
  - Proper error handling with ErrorHandler
  - Token-based API calls

- **`options.js`**
  - Client ID configuration
  - OAuth-based sign-in
  - API key management (optional)

## Authentication Flow

```
User clicks "Sign in with Google"
            ↓
OAuth Manager launches auth flow
            ↓
User sees Google login page
            ↓
User grants permission
            ↓
OAuth token returned to extension
            ↓
Token stored in chrome.storage.local
            ↓
User profile fetched and displayed
            ↓
User can now use analysis features
```

## Token Management

### Token Lifecycle
- **Obtained**: During OAuth sign-in (1 hour default)
- **Stored**: In `chrome.storage.local`
- **Checked**: Before each API call
- **Refreshed**: Automatically 5 minutes before expiry
- **Cleared**: On user sign-out

### Token Validation
```javascript
// Before any API call
const token = await oauthManager.getStoredToken();
if (!token) {
  // Redirect user to sign in
}

// Token is automatically validated
// Expired tokens are removed and user must re-authenticate
```

## API Usage

### Gemini Analysis API

All media analysis requests use the Gemini API:

```javascript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=API_KEY

Headers:
  Content-Type: application/json

Body:
  {
    contents: [{
      parts: [
        { inline_data: { mime_type, data } },
        { text: analysis_prompt }
      ]
    }],
    systemInstruction: { parts: { text: system_prompt } }
  }
```

### Fact-Check Databases

The extension cross-references claims with:
- Snopes.com API
- FactCheck.org API
- FullFact.org API
- PolitiFact.com API

## Error Handling

### User-Friendly Error Messages

| Error Type | Message | Action |
|-----------|---------|--------|
| Auth Failed | "Authentication failed. Please sign in again." | Show sign-in button |
| Missing API Key | "Extension not properly configured..." | Direct to settings |
| Network Error | "Unable to connect. Check your connection." | Retry button |
| Rate Limited | "Too many requests. Please try again later." | Exponential backoff |
| Unknown Error | "An unknown error occurred. Please try again." | Log and retry |

### Debug Logging

Enable debug logging by setting `CONFIG.DEBUG = true` in `config.js`:

```javascript
// View logs in console
console.log('[INFO] [Context] Message', data);
console.log('[ERROR] [Context] Message', error);

// Export logs from Logger
logger.getLogs()      // Get all stored logs
logger.exportLogs()   // Export as JSON
logger.clearLogs()    // Clear log history
```

## Deployment Checklist

### Pre-Deployment
- [ ] Update version number in `manifest.json`
- [ ] Test OAuth flow in development
- [ ] Verify all error messages are user-friendly
- [ ] Test token refresh mechanism
- [ ] Validate CSP doesn't block legitimate requests
- [ ] Test on multiple websites

### Deployment
- [ ] Submit to Chrome Web Store
- [ ] Update privacy policy
- [ ] Update terms of service
- [ ] Create support documentation

### Post-Deployment
- [ ] Monitor error logs
- [ ] Track user adoption
- [ ] Gather feedback
- [ ] Monitor API quota usage

## Configuration Options

### User-Configurable Settings

Located in Options page:

```javascript
CONFIG.STORAGE_KEYS = {
  USER_EMAIL: 'userEmail',
  GOOGLE_TOKEN: 'googleToken',
  TOKEN_EXPIRY: 'tokenExpiry',
  GOOGLE_CLIENT_ID: 'googleClientId',
  GEMINI_API_KEY: 'geminiKey',
  AUTO_ANALYZE: 'autoAnalyze',
  ENABLE_NOTIFICATIONS: 'enableNotifications',
  DATABASE_CHECK: 'databaseCheck',
  CONFIDENCE_THRESHOLD: 'confidenceThreshold'
}
```

### Admin Configuration

In `config.js`:

```javascript
CONFIG = {
  ENV: 'production',
  DEBUG: false,
  OAUTH: {
    CLIENT_ID: 'YOUR_CLIENT_ID',
    SCOPES: ['email', 'profile'],
    ...
  },
  TIMEOUTS: {
    ANALYSIS: 30000,
    AUTH: 300000,
    ...
  },
  ...
}
```

## Troubleshooting

### "Authentication failed"
1. Check Client ID is correct
2. Verify extension ID matches OAuth redirect URI
3. Check network connectivity
4. Try signing out and in again

### "API key not configured"
1. Go to extension options
2. Enter either Client ID (OAuth) or API Key
3. Click Save

### "Rate limit exceeded"
1. Wait a few moments before retrying
2. Check your API quota in Google Cloud Console
3. Upgrade your plan if needed

### "No images found on this page"
1. Extension may be restricted by CSP
2. Try on a different website
3. Check console for CSP violations

### Performance Issues
1. Disable "Auto-analyze" if not needed
2. Reduce "Confidence Threshold"
3. Disable database cross-reference temporarily
4. Check available memory/CPU

## Security Best Practices

1. **Never hardcode API keys** - Use configuration files
2. **Validate tokens** - Check expiry before use
3. **Use HTTPS** - All API calls are HTTPS
4. **Secure storage** - Use `chrome.storage.local`
5. **CSP headers** - Strict Content Security Policy
6. **Error messages** - Don't leak sensitive info
7. **Logging** - Don't log auth tokens or API keys

## Monitoring & Analytics

### Key Metrics to Track

- User activation rate
- Daily/Monthly active users
- Analysis request success rate
- Average analysis time
- Error rate by type
- API quota usage
- Token refresh rate

### Logging Best Practices

```javascript
// DO: Log significant events
logger.info('Analysis', 'Media analyzed', { mediaType, score });

// DON'T: Log sensitive data
logger.debug('Auth', 'Token received', { token }); // ❌

// DO: Use error handler for user messages
const message = errorHandler.getUserMessage(error, 'Feature');
```

## Maintenance

### Regular Tasks

- Monitor API quota usage
- Review error logs weekly
- Update dependencies monthly
- Test on new Chrome versions
- Review and update privacy policy

### Update Process

1. Update version in manifest.json
2. Test changes thoroughly
3. Commit with meaningful message
4. Push to GitHub
5. Build for Chrome Web Store
6. Submit for review

## Support & Contact

For issues or questions:
- GitHub Issues: https://github.com/codefusser/infoguard/issues
- Email: support@infoguard.dev
- Discord: [Your Discord Server]

---

**Last Updated:** January 8, 2026
**Version:** 1.0.0
**Status:** Production Ready
