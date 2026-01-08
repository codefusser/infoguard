# OAuth 2.0 Authentication Flow - Technical Documentation

## Overview

InfoGuard uses **OAuth 2.0 with `chrome.identity.launchWebAuthFlow`** for secure, production-grade authentication with Google services. This approach follows Chrome extension best practices and eliminates the need to handle credentials directly.

## Why `chrome.identity.launchWebAuthFlow`?

### Advantages

✅ **Official Chrome API** - Recommended by Google  
✅ **Secure Token Exchange** - No password handling  
✅ **User Consent Flow** - Transparent permission model  
✅ **Automatic Redirect Handling** - Built-in URI handling  
✅ **Native OAuth 2.0** - Industry standard  

### Why NOT popup windows or background pages?

❌ Popup windows - Unreliable, can be blocked by browser  
❌ Background pages - Deprecated approach, harder to maintain  
❌ iframe sandboxing - Complex and error-prone  

## Implementation Details

### 1. OAuth Manager (`oauth.js`)

The `OAuthManager` class handles all OAuth operations:

```javascript
class OAuthManager {
  // Get redirect URL (Chrome-specific)
  getRedirectUrl()
  
  // Generate OAuth authorization URL
  generateAuthUrl(clientId, redirectUrl, scopes)
  
  // Launch the actual auth flow
  launchAuthFlow(clientId)
  
  // Extract token from redirect URL
  extractTokenFromUrl(responseUrl)
  
  // Get user profile info
  getUserProfile(accessToken)
  
  // Validate token is still valid
  validateToken(accessToken)
  
  // Save token with expiry time
  saveToken(accessToken, expiresIn)
  
  // Retrieve stored token if valid
  getStoredToken()
  
  // Clear all auth data on logout
  clearAuth()
}
```

### 2. Google OAuth URL Structure

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=https://EXTENSION_ID.chromiumapp.org/oauth2callback
  &response_type=token
  &scope=email+profile
  &access_type=offline
  &prompt=consent
```

### 3. Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Sign In with Google"                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ popup.js calls oauthManager.launchAuthFlow(clientId)        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ chrome.identity.launchWebAuthFlow(url, interactive:true)    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Browser opens Google login page                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ User enters credentials and grants permission               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Google redirects to:                                         │
│ chrome-extension://EXTENSION_ID/oauth2callback#             │
│   access_token=TOKEN&token_type=Bearer&expires_in=3600     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ extractTokenFromUrl() parses the token from hash            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Token returned to popup.js                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ getUserProfile(token) fetches user email                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ saveToken() stores token with expiry time                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ User is now authenticated and can use features              │
└─────────────────────────────────────────────────────────────┘
```

## Token Lifecycle Management

### Initial Token (from OAuth)

```javascript
{
  accessToken: "ya29.a0AfH6SMBx...",
  expiresIn: 3600,                    // 1 hour in seconds
  tokenType: "Bearer"
}
```

### Stored Token (in chrome.storage.local)

```javascript
{
  googleToken: "ya29.a0AfH6SMBx...",
  tokenExpiry: 1673640000000,         // Unix timestamp in ms
  userEmail: "user@gmail.com",
  timestamp: "2026-01-08T15:30:00Z"
}
```

### Token Validation

```javascript
// On every API call, check:
if (Date.now() > expiryTime) {
  // Token expired
  // Clear and ask user to sign in again
  await clearAuth();
  throw new Error('Token expired. Please sign in again.');
}
```

### Token Refresh

```javascript
// Automatically refresh before expiry (5 min buffer)
scheduleTokenRefresh(expiresIn) {
  refreshTime = (expiresIn - 300) * 1000;  // 300s = 5 min
  if (refreshTime > 0) {
    setTimeout(() => {
      // Emit event for UI to show refresh notification
      emit('token-refresh-needed');
    }, refreshTime);
  }
}
```

## Error Handling in OAuth

### Network Errors

```javascript
try {
  const responseUrl = await chrome.identity.launchWebAuthFlow(...);
} catch (error) {
  // chrome.runtime.lastError contains the error message
  if (error.message.includes('denied')) {
    // User denied access
    throw new Error('Auth cancelled by user');
  }
  if (error.message.includes('timeout')) {
    // Network timeout
    throw new Error('Auth timeout. Check your connection.');
  }
}
```

### User Cancellation

```javascript
// If user clicks "Cancel" during OAuth:
// responseUrl will be null or undefined
if (!responseUrl) {
  throw new Error('Auth cancelled by user');
  // Extension remains in pre-auth state
}
```

### Invalid Redirect URI

```javascript
// Manifest must list correct redirect URL
// If extension ID doesn't match OAuth config:
// Error: "redirect_uri_mismatch"

// Solution: Update OAuth app with correct extension ID
chrome.identity.getRedirectURL('oauth2callback')
// Returns: chrome-extension://EXTENSION_ID/oauth2callback
```

## API Integration

### Using Token for API Calls

```javascript
// Get the stored token
const token = await oauthManager.getStoredToken();

// Use in API headers
const response = await fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Handle 401 Unauthorized (token invalid)
if (response.status === 401) {
  // Token is invalid (shouldn't happen if validation works)
  await oauthManager.clearAuth();
  throw new Error(CONFIG.ERROR_MESSAGES.AUTH_FAILED);
}
```

### Gemini API Call with Token

```javascript
const apiKey = await getGeminiApiKey(); // Either OAuth token or API key

const response = await fetch(
  `${GEMINI_API_ENDPOINT}?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: mediaData },
          { text: analysisPrompt }
        ]
      }]
    })
  }
);
```

## Security Considerations

### Token Storage

✅ **Stored in**: `chrome.storage.local`  
✅ **Encrypted by**: Chrome (automatic)  
✅ **Accessible by**: This extension only  

❌ **NOT stored in**: localStorage (vulnerable)  
❌ **NOT logged**: Never log tokens  
❌ **NOT hardcoded**: Never in source code  

### Redirect URI Validation

```javascript
// Chrome validates that redirect_uri matches extension ID
// Format: chrome-extension://EXTENSION_ID/path

// Get your extension ID from:
chrome.identity.getRedirectURL('oauth2callback')

// Must match in Google Cloud Console:
// Authorized redirect URIs:
//   https://EXTENSION_ID.chromiumapp.org/oauth2callback
```

### Scope Limitations

```javascript
// Only request necessary scopes
SCOPES: ['email', 'profile']

// NO: ['https://www.googleapis.com/auth/userinfo.email']
// NO: Extra scopes = more user permissions needed
// YES: Minimal scopes = better security
```

### Token Expiry

```javascript
// Tokens expire after 1 hour by default
// Always check expiry before use
async getStoredToken() {
  if (Date.now() > expiryTime) {
    await clearAuth();
    return null;  // Force re-authentication
  }
  return token;
}
```

## Configuration for Production

### Manifest Permissions

```json
{
  "permissions": ["identity", "storage"],
  "host_permissions": [
    "https://www.googleapis.com/*",
    "https://generativelanguage.googleapis.com/*"
  ]
}
```

### Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "default-src 'self'; connect-src https:"
  }
}
```

## Testing OAuth Flow

### Unit Tests

```javascript
// Test token extraction
const token = oauthManager.extractTokenFromUrl(
  'chrome-ext://...#access_token=ABC123'
);
assert(token === 'ABC123');

// Test token validation
const valid = await oauthManager.validateToken('valid_token');
assert(valid === true);

// Test expired token removal
await oauthManager.saveToken('token', -1);  // Already expired
const stored = await oauthManager.getStoredToken();
assert(stored === null);
```

### Integration Tests

```javascript
// Test full OAuth flow
async function testOAuthFlow() {
  const result = await oauthManager.launchAuthFlow(CLIENT_ID);
  assert(result.accessToken);
  
  const profile = await oauthManager.getUserProfile(result.accessToken);
  assert(profile.email);
}

// Test token persistence
async function testTokenPersistence() {
  await oauthManager.saveToken('test_token', 3600);
  const stored = await oauthManager.getStoredToken();
  assert(stored === 'test_token');
}

// Test logout
async function testLogout() {
  await oauthManager.clearAuth();
  const stored = await oauthManager.getStoredToken();
  assert(stored === null);
}
```

## Debugging

### Enable Debug Logging

```javascript
// In config.js
CONFIG.DEBUG = true;

// View logs in browser console
console.log('[OAuth] Launching auth flow...');
console.log('[OAuth] Token received:', token);
console.log('[OAuth] Token saved with expiry:', expiryTime);
```

### Check Stored Token

```javascript
// In browser console
chrome.storage.local.get(['googleToken', 'tokenExpiry'], (result) => {
  console.log('Stored token:', result.googleToken);
  console.log('Expiry time:', new Date(result.tokenExpiry));
  console.log('Currently expired?', Date.now() > result.tokenExpiry);
});
```

### Monitor Auth Events

```javascript
// Listen for auth state changes
window.addEventListener('oauth:token-refresh-needed', (event) => {
  console.log('Token will expire soon');
});

window.addEventListener('oauth:auth-failed', (event) => {
  console.log('Auth failed:', event.detail);
});
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "redirect_uri_mismatch" | Extension ID doesn't match | Update OAuth config with correct ID |
| Auth page won't open | CSP too strict | Check manifest CSP settings |
| Token shows as expired | Clock skew | Add 5 min buffer before expiry |
| "Auth cancelled by user" | User clicked cancel | Handle gracefully, show retry option |
| API 401 Unauthorized | Invalid/expired token | Check token validation logic |

---

**Last Updated:** January 8, 2026  
**OAuth Standard:** RFC 6749  
**Chrome API:** chrome.identity  
**Gemini API:** v1beta/models/gemini-2.0-flash
