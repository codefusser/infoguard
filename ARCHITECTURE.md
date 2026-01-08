# Architecture Guide - InfoGuard

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              InfoGuard Extension                   │  │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         Popup (popup.html/js/css)            │  │   │
│  │  │  - User interface                            │  │   │
│  │  │  - Sign-in flow                              │  │   │
│  │  │  - Results display                           │  │   │
│  │  │  - Settings access                           │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                       ↕                             │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │   Content Script (content.js)                │  │   │
│  │  │  - Detects images/videos on pages            │  │   │
│  │  │  - Extracts media data                       │  │   │
│  │  │  - Runs in page context                      │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                       ↕                             │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Background Service Worker (background.js)   │  │   │
│  │  │  - Handles API calls                         │  │   │
│  │  │  - Manages authentication tokens             │  │   │
│  │  │  - Calls Gemini API                          │  │   │
│  │  │  - Cross-references databases                │  │   │
│  │  │  - Calculates credibility scores             │  │   │
│  │  │  - Stores settings                           │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                       ↕                             │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │    Options Page (options.html/js/css)        │  │   │
│  │  │  - User settings and preferences             │  │   │
│  │  │  - API key management                        │  │   │
│  │  │  - Account management                        │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                       ↕                                     │
├─────────────────────────────────────────────────────────────┤
│              Chrome / Edge Extension API                   │
│  - Storage (chrome.storage.local)                          │
│  - Messaging (chrome.runtime.sendMessage)                  │
│  - Tabs (chrome.tabs.sendMessage)                          │
├─────────────────────────────────────────────────────────────┤
│                   External Services                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Google OAuth   │  │  Gemini 3 API   │                 │
│  │  - Authentication   - Media analysis │                 │
│  │  - Token mgmt.      - Artifact detection               │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Fact-Checking Databases                     │  │
│  │  - Snopes          - FactCheck.org      - Full Fact   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Component Details

### 1. Popup (popup.html, popup.css, popup.js)

**Purpose**: Main user interface for the extension

**Key Classes**:
```javascript
class InfoGuardPopup {
  checkAuthStatus()        // Check if user is logged in
  handleGoogleSignIn()     // OAuth authentication
  handleGoogleSignOut()    // Logout
  analyzeCurrentPage()     // Trigger page analysis
  analyzeMedia()           // Analyze specific media
  displayResult()          // Show credibility score
  showMainSection()        // Show authenticated UI
  showAuthSection()        // Show login screen
}
```

**State Management**:
- User object (email, token)
- Analysis results
- Loading state
- Error messages

**Storage Integration**:
- Reads: `userEmail`, `googleToken`, `geminiKey`
- Writes: Analysis results (temporary)

### 2. Content Script (content.js)

**Purpose**: Detect and extract media from web pages

**Key Classes**:
```javascript
class MediaDetector {
  detectMedia()           // Find all images/videos
  isVisibleAndValid()     // Check if element is visible
  getAbsoluteUrl()        // Convert relative to absolute URLs
  isMediaIframe()         // Detect video iframes
  enableImageSelection()  // Allow user to click images
}
```

**Detection Methods**:
- `<img>` tags
- `<video>` tags with `<source>`
- `<picture>` elements
- `<iframe>` embeds (YouTube, Vimeo, etc.)

**Data Structure**:
```javascript
const media = {
  type: 'image' | 'video',
  src: 'absolute URL',
  alt: 'description',
  platform: 'YouTube' | undefined,
  timestamp: 'ISO string'
}
```

### 3. Background Service Worker (background.js)

**Purpose**: Handle API calls, authentication, and analysis

**Key Classes**:
```javascript
class InfoGuardAnalyzer {
  analyzeMedia()                  // Main pipeline
  fetchMediaData()                // Download media
  analyzeWithGemini()             // Call Gemini API
  crossReferenceWithDatabases()   // Check fact-checkers
  calculateCredibilityScore()     // Compute score
  parseGeminiResponse()           // Parse API response
}
```

**API Endpoints**:
```javascript
// Gemini
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

// Fact-Checking
GET https://snopes.com/api/claims
GET https://www.factcheck.org/api
GET https://fullfact.org/api
```

**Analysis Pipeline**:
```
Media Input
    ↓
Fetch Media Data (binary)
    ↓
Send to Gemini with Prompt
    ↓
Analyze Visual Artifacts
    ↓
Extract Claims
    ↓
Cross-Reference Databases
    ↓
Calculate Score (0-1)
    ↓
Return Results
```

### 4. Options Page (options.html, options.css, options.js)

**Purpose**: Settings and configuration interface

**Key Classes**:
```javascript
class InfoGuardOptions {
  switchTab()              // Navigate between tabs
  loadSettings()           // Load from storage
  handleGoogleSignIn()     // Google authentication
  saveApiKey()             // Save Gemini API key
  saveAnalysisSettings()   // Save preferences
}
```

**Storage Keys**:
```javascript
{
  userEmail: string,
  googleToken: string,
  geminiKey: string,
  autoAnalyze: boolean,
  enableNotifications: boolean,
  databaseCheck: boolean,
  confidenceThreshold: number (0-100)
}
```

## 🔄 Data Flow

### User Signs In

```
User clicks "Sign in with Google"
    ↓
popup.js calls handleGoogleSignIn()
    ↓
Opens OAuth flow in new window
    ↓
Waits for auth token
    ↓
Stores in chrome.storage.local:
  - userEmail
  - googleToken
    ↓
popup.js shows main interface
```

### Page Analysis Flow

```
User clicks "Scan Page"
    ↓
popup.js sends message to content.js
    ↓
content.js detects media (images, videos)
    ↓
Returns media list to popup.js
    ↓
popup.js displays media thumbnails
    ↓
User selects or auto-analyzes media
    ↓
popup.js sends to background.js:
  - media object
  - user token
    ↓
background.js analyzeMedia():
  1. Fetch media data
  2. Send to Gemini API
  3. Check databases
  4. Calculate score
    ↓
Returns results to popup.js
    ↓
popup.js displays credibility score
```

## 🔐 Authentication Flow

### OAuth 2.0 with Google

```
1. Extension requests auth
2. Opens Google OAuth consent screen
3. User approves
4. Google redirects with token
5. Extension captures token
6. Stores in secure storage
7. Uses token for API calls

Authentication Headers:
Authorization: Bearer <googleToken>

Gemini API Key:
Sent as query parameter: ?key=<geminiKey>
```

## 💾 Storage Schema

### Local Storage (`chrome.storage.local`)

```
{
  // Authentication
  "userEmail": "user@gmail.com",
  "googleToken": "ya29.a0AfH6SMBx...",
  "geminiKey": "AIzaSyD...",

  // Settings
  "autoAnalyze": true,
  "enableNotifications": true,
  "databaseCheck": true,
  "confidenceThreshold": 50,

  // Cache
  "lastAnalysisResults": [
    {
      mediaType: "image",
      credibilityScore: 0.85,
      timestamp: "2026-01-07T10:30:00Z"
    }
  ]
}
```

## 🔌 Message Passing

### Content ↔ Popup

```javascript
// Content → Popup
chrome.runtime.sendMessage({
  action: 'detectMedia'
})

// Response
{
  media: [
    { type: 'image', src: '...', alt: '...' },
    { type: 'video', src: '...', platform: '...' }
  ]
}
```

### Popup ↔ Background

```javascript
// Popup → Background
chrome.runtime.sendMessage({
  action: 'analyzeMedia',
  media: mediaObject,
  token: userToken
})

// Response
{
  success: true,
  data: {
    mediaType: 'image',
    credibilityScore: 0.82,
    assessment: '...',
    artifacts: ['...'],
    inconsistencies: ['...'],
    confidence: 75
  }
}
```

## 🧮 Credibility Score Algorithm

```javascript
score = 0.8  // Start with 80% authentic

// Reduce for artifacts
score -= artifacts.length * 0.08

// Reduce for inconsistencies
score -= inconsistencies.length * 0.10

// Apply confidence multiplier
score *= (geminiConfidence / 100)

// Check databases
dbResults.forEach(result => {
  if (result.verdict === 'false') score -= 0.15
})

// Clamp between 0 and 1
score = Math.max(0, Math.min(1, score))

// Display as percentage
displayScore = score * 100  // 0-100%
```

## 🎨 UI Architecture

### Popup Layout

```
┌─────────────────────────┐
│  Header (Logo + Menu)   │
├─────────────────────────┤
│  Auth Section           │
│  OR                     │
│  ┌─────────────────────┐│
│  │  Analysis Section   ││
│  │  - Scan Page        ││
│  │  - Select Image     ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │  Results Section    ││
│  │  - Score Bar        ││
│  │  - Assessment       ││
│  │  - Artifacts        ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │  Media List         ││
│  │  - Thumbnails       ││
│  │  - Click to analyze ││
│  └─────────────────────┘│
├─────────────────────────┤
│  User Status            │
└─────────────────────────┘
```

### Options Page Layout

```
┌───────────────────────────────┐
│  Header                       │
├───────────────────────────────┤
│  [Account] [API] [Analysis].. │
├───────────────────────────────┤
│  Tab Content:                 │
│  - Account: Sign in/out       │
│  - API: Key management        │
│  - Analysis: Preferences      │
│  - About: Info & Credits      │
├───────────────────────────────┤
│  Footer                       │
└───────────────────────────────┘
```

## 🔄 Extension Lifecycle

```
1. Installation
   - manifest.json loaded
   - Icons registered
   - Service worker initialized

2. User Opens Popup
   - popup.html rendered
   - popup.js runs
   - checkAuthStatus() called
   - If authenticated → show main UI
   - If not → show login UI

3. Content Script Injection
   - Runs on document_end
   - MediaDetector initialized
   - Listens for messages

4. Analysis Request
   - Popup sends message to content.js
   - Content.js detects media
   - Popup sends to background.js
   - background.js makes API calls
   - Results returned to popup.js
   - UI updated with scores

5. Settings Changes
   - options.js saves to storage
   - background.js reads on demand
   - Settings persist across sessions
```

## 📊 Performance Considerations

- **Media Detection**: O(n) where n = DOM elements
- **Gemini API**: ~2-5 seconds per image
- **Database Queries**: ~1 second per database
- **Total Analysis**: ~3-10 seconds for first media

**Optimizations**:
- Cache media data locally
- Batch database queries
- Async/await for non-blocking UI
- Lazy load results

## 🔗 Dependencies

- **Chrome APIs**: storage, tabs, runtime, windows, extensions
- **External APIs**: Google OAuth, Gemini, Fact-checking services
- **Built-in**: Fetch API, DOM, CSS Grid, ES6+

## 🛡️ Security Architecture

```
┌─────────────────┐
│  Sensitive Data │
├─────────────────┤
│ - API Keys      │ → Stored in chrome.storage.local
│ - Auth Tokens   │ → HTTPS only
│ - User Email    │ → Never logged
└─────────────────┘

┌─────────────────┐
│  Content Policy │
├─────────────────┤
│ - No inline JS  │
│ - CSP headers   │
│ - No eval()     │
│ - HTTPS required│
└─────────────────┘
```

---

**For more info, see README.md and QUICKSTART.md**
