# Configuration Guide - InfoGuard

## 🔧 API Configuration

### Gemini 3 API Setup

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown
3. Click "NEW PROJECT"
4. Name: "InfoGuard"
5. Click "CREATE"
6. Wait for project to be created

#### Step 2: Enable Gemini API

1. Go to "APIs & Services" → "Library"
2. Search for "Generative AI API"
3. Click "Enable"
4. Go to "APIs & Services" → "Credentials"
5. Click "CREATE CREDENTIALS"
6. Select "API Key"
7. Copy your API key

#### Step 3: Add to Extension

**Option A: Through Settings UI**
```
1. Open InfoGuard popup
2. Click ⚙️ (Settings)
3. Go to "API Settings" tab
4. Paste your API key
5. Click "Save API Key"
```

**Option B: Direct Configuration**
```
Edit: src/background.js
Line: const GEMINI_API_ENDPOINT = '...'
Add your key to the request headers
```

### Google OAuth Configuration

#### Step 1: Create OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "OAuth consent screen"
4. Choose "External" user type
5. Fill in required fields:
   - App name: "InfoGuard"
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
6. Click "SAVE AND CONTINUE"
7. Skip scopes (optional for internal use)
8. Click "SAVE AND CONTINUE"
9. Click "BACK TO DASHBOARD"

#### Step 2: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS"
3. Select "OAuth 2.0 Client ID"
4. Choose "Web application"
5. Name: "InfoGuard Extension"
6. Add URIs:
   - **JavaScript origins**: `chrome-extension://<YOUR_EXTENSION_ID>`
   - **Redirect URIs**: `chrome-extension://<YOUR_EXTENSION_ID>/options.html`
7. Click "CREATE"
8. Copy your Client ID

#### Step 3: Find Your Extension ID

1. Open `chrome://extensions/`
2. Find InfoGuard
3. Copy the ID from the details

#### Step 4: Update Extension

Edit `src/popup.js`:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
// Replace with your actual Client ID
```

### Fact-Checking Database Setup

#### Snopes API

```javascript
const SNOPES_API = {
  endpoint: 'https://snopes.com/api/claims',
  methods: ['GET', 'POST'],
  rateLimit: 100 // requests per hour
}
```

Configuration in `src/background.js`:
```javascript
const TRUSTED_DATABASES = {
  'snopes': {
    url: 'https://snopes.com/api/claims',
    enabled: true,
    timeout: 5000
  }
}
```

#### FactCheck.org API

```javascript
const FACTCHECK_API = {
  endpoint: 'https://www.factcheck.org/api',
  methods: ['GET'],
  rateLimit: 50
}
```

#### Full Fact API

```javascript
const FULLFACT_API = {
  endpoint: 'https://fullfact.org/api',
  methods: ['GET'],
  rateLimit: 50
}
```

## ⚙️ Extension Settings

### Storage Schema

All settings are stored in `chrome.storage.local`:

```javascript
{
  // User Authentication
  userEmail: string,              // "user@gmail.com"
  googleToken: string,            // "ya29.a0AfH6..."
  geminiKey: string,              // "AIzaSyD..."

  // Analysis Preferences
  autoAnalyze: boolean,           // true
  enableNotifications: boolean,   // true
  databaseCheck: boolean,         // true
  confidenceThreshold: number,    // 50 (0-100)

  // UI Preferences
  theme: string,                  // "light" | "dark"
  language: string,               // "en-US"

  // Cache
  lastResults: Array,             // Recent analysis results
  mediaCache: Object,             // Downloaded media data
}
```

### Default Values

```javascript
const DEFAULTS = {
  autoAnalyze: true,
  enableNotifications: true,
  databaseCheck: true,
  confidenceThreshold: 50,
  cacheSize: 50, // MB
  cacheTTL: 86400000, // 24 hours
  maxMediaSize: 25, // MB
  timeoutDuration: 30000, // 30 seconds
}
```

## 🎨 Theme Configuration

### Light Theme (Default)

```css
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --background: #ffffff;
  --foreground: #333333;
  --border: #e0e0e0;
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
}
```

### Dark Theme

```css
:root {
  --primary: #7c8ff5;
  --secondary: #9966cc;
  --background: #1e1e1e;
  --foreground: #ffffff;
  --border: #404040;
  --success: #66bb6a;
  --warning: #ffb74d;
  --error: #ef5350;
}
```

To enable dark theme, add to settings:
```javascript
chrome.storage.local.set({ theme: 'dark' })
```

## 🌍 Multi-Language Configuration

### Supported Languages

```javascript
const LANGUAGES = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'ja-JP': '日本語',
  'zh-CN': '简体中文',
  'pt-BR': 'Português (Brasil)',
}
```

### Setting Language

```javascript
chrome.storage.local.set({ language: 'fr-FR' })
```

### Add Translations

Create `src/locales/<language>.json`:

```json
{
  "popup_title": "InfoGuard",
  "scan_page": "Scan Page",
  "analyze_button": "Analyze",
  "credibility_score": "Credibility Score",
  "artifact_detected": "Artifacts detected",
  "sign_in": "Sign In",
  "settings": "Settings"
}
```

## 📊 Analysis Configuration

### Artifact Detection Settings

```javascript
const ARTIFACT_CONFIG = {
  compressionThreshold: 0.7,      // 0-1
  blendingThreshold: 0.6,
  synthesisThreshold: 0.8,
  detectionSensitivity: 'medium', // low, medium, high
}
```

### Confidence Thresholds

```javascript
const CONFIDENCE_LEVELS = {
  high: { min: 75, label: 'High Confidence' },
  medium: { min: 50, label: 'Medium Confidence' },
  low: { min: 25, label: 'Low Confidence' },
  veryLow: { min: 0, label: 'Very Low Confidence' },
}
```

### Score Color Coding

```javascript
const SCORE_COLORS = {
  authentic: '#4caf50',     // Green (80-100%)
  uncertain: '#ff9800',     // Amber (50-80%)
  suspicious: '#f44336',    // Red (0-50%)
}
```

## 🔔 Notification Configuration

### Notification Settings

```javascript
const NOTIFICATION_CONFIG = {
  enabled: true,
  showOnSuspicious: true,  // Show when credibility < threshold
  sound: true,
  duration: 5000,          // milliseconds
  position: 'top-right',   // top-left, top-right, bottom-left, bottom-right
}
```

### Notification Types

```javascript
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',      // Analysis complete
  WARNING: 'warning',      // Suspicious content
  ERROR: 'error',          // Failed analysis
  INFO: 'info',            // General information
}
```

## 🚀 Performance Configuration

### Rate Limiting

```javascript
const RATE_LIMITS = {
  geminiAPI: {
    requestsPerMinute: 60,
    burstLimit: 10,
  },
  databaseAPI: {
    requestsPerMinute: 30,
  },
  contentScript: {
    detectInterval: 5000,  // ms between detections
    maxMediaPerPage: 50,
  }
}
```

### Caching Configuration

```javascript
const CACHE_CONFIG = {
  enabled: true,
  maxSize: 50,             // MB
  ttl: 86400000,           // 24 hours
  types: ['media', 'results', 'tokens'],
}
```

## 🔒 Security Configuration

### Content Security Policy

```
Manifest V3 default CSP:
- No inline scripts
- No eval()
- HTTPS only
- Limited external resources
```

### CORS Settings

```javascript
const CORS_CONFIG = {
  mode: 'cors',
  credentials: 'omit',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}
```

### API Key Security

```
DO:
✅ Store in chrome.storage.local
✅ Use HTTPS only
✅ Rotate keys regularly
✅ Monitor usage

DON'T:
❌ Commit to Git
❌ Log to console
❌ Send in insecure requests
❌ Share publicly
```

## 📱 Responsive Breakpoints

```javascript
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
}
```

CSS media queries:
```css
@media (max-width: 768px) {
  /* Tablet styles */
}

@media (max-width: 480px) {
  /* Mobile styles */
}
```

## 🐛 Debug Configuration

### Enable Debug Mode

Edit `src/background.js`:
```javascript
const DEBUG = true;  // Enable console logging

if (DEBUG) {
  console.log('[InfoGuard] Debug mode enabled');
}
```

### Log Levels

```javascript
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
}

const CURRENT_LOG_LEVEL = LOG_LEVEL.INFO;
```

## 📝 Configuration Examples

### Minimal Setup

```javascript
// Just sign in with Google
const CONFIG = {
  useGoogleAuth: true,
  autoAnalyze: false,
  databaseCheck: true,
}
```

### Full Setup

```javascript
// Complete configuration
const CONFIG = {
  useGoogleAuth: true,
  geminiKey: 'AIzaSyD...',
  autoAnalyze: true,
  enableNotifications: true,
  databaseCheck: true,
  confidenceThreshold: 60,
  theme: 'light',
  language: 'en-US',
  debugMode: false,
  cacheEnabled: true,
}
```

### Production Setup

```javascript
// Production configuration
const CONFIG = {
  useGoogleAuth: true,
  geminiKey: process.env.GEMINI_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  autoAnalyze: true,
  enableNotifications: false, // Disable for privacy
  databaseCheck: true,
  confidenceThreshold: 70,
  theme: 'light',
  debugMode: false,
  cacheEnabled: true,
  cacheTTL: 604800000, // 1 week
}
```

---

**For more information, see README.md and ARCHITECTURE.md**
