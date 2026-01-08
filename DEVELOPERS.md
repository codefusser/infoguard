# Developer's Guide - InfoGuard

## 🛠️ Development Setup

### Prerequisites
- Text editor or IDE (VS Code recommended)
- Chrome or Edge browser
- Git (optional)
- Node.js (optional, for build tools)

### Initial Setup

1. **Clone or download the project:**
   ```bash
   git clone https://github.com/yourusername/infoguard.git
   cd infoguard
   ```

2. **Open in your IDE:**
   ```bash
   code .  # For VS Code
   ```

3. **Load unpacked extension:**
   - `chrome://extensions/` or `edge://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select the infoguard folder

4. **Create .env file (optional):**
   ```
   GEMINI_API_KEY=your_api_key_here
   GOOGLE_CLIENT_ID=your_client_id_here
   ```

## 📝 Code Structure

### Popup Module (popup.js)

**Main class for popup interaction:**

```javascript
class InfoGuardPopup {
  constructor()
  initializeElements()        // Cache DOM elements
  attachEventListeners()      // Bind event handlers
  checkAuthStatus()          // Verify user login
  handleGoogleSignIn()       // OAuth flow
  analyzeCurrentPage()       // Scan page
  analyzeWithGemini(media)   // API call
  displayResult(result)      // Show score
  showMainSection()          // Authenticated UI
  showAuthSection()          // Login UI
}
```

**Example usage:**
```javascript
// In popup.js
const popup = new InfoGuardPopup();
// Methods are called on user interaction
```

---

### Content Script Module (content.js)

**Detect media in web pages:**

```javascript
class MediaDetector {
  constructor()
  initializeListener()       // Listen for messages
  detectMedia()             // Find all media
  isVisibleAndValid()       // Check visibility
  getAbsoluteUrl()          // Normalize URLs
  isMediaIframe()           // Detect video embeds
  enableImageSelection()    // Interactive mode
}
```

**Example usage:**
```javascript
// Automatically initialized in content.js
const detector = new MediaDetector();

// Responds to messages from popup:
// { action: 'detectMedia' }
// Returns: { media: [...] }
```

---

### Background Service Worker (background.js)

**Handle APIs and analysis:**

```javascript
class InfoGuardAnalyzer {
  constructor()
  initializeListener()              // Listen for messages
  analyzeMedia(media, token)        // Main pipeline
  fetchMediaData(url)               // Download image
  analyzeWithGemini(data, media)    // Gemini API
  parseGeminiResponse(data)         // Parse JSON
  extractArtifacts(text)            // Find artifacts
  crossReferenceWithDatabases()     // Fact check
  calculateCredibilityScore()       // Score calc
  bufferToBase64()                  // Encode image
}
```

**Example usage:**
```javascript
// Automatically initialized
const analyzer = new InfoGuardAnalyzer();

// Receives analysis requests:
// { action: 'analyzeMedia', media: {...}, token: '...' }
// Responds: { success: true, data: {...} }
```

---

### Options Module (options.js)

**Manage settings:**

```javascript
class InfoGuardOptions {
  constructor()
  initializeElements()       // Cache DOM
  attachEventListeners()     // Bind events
  switchTab(e)              // Tab navigation
  loadSettings()            // Load from storage
  handleSignIn()            // Google auth
  handleSignOut()           // Logout
  saveApiKey()              // Save API key
  saveAnalysisSettings()    // Save prefs
  showMessage()             // Display feedback
}
```

---

## 📚 Key Functions

### Authenticate with Google

```javascript
async handleGoogleSignIn() {
  // Opens OAuth window
  // Waits for token
  // Stores in chrome.storage.local
  // Shows main UI
}
```

### Detect Media on Page

```javascript
detectMedia() {
  // Scans for <img>, <video>, <iframe>
  // Filters visible elements
  // Normalizes URLs
  // Returns array of media objects
}
```

### Analyze with Gemini

```javascript
async analyzeWithGemini(mediaData, media, apiKey) {
  // Converts image to base64
  // Sends to Gemini API
  // Parses response
  // Extracts artifacts and inconsistencies
  // Returns assessment
}
```

### Calculate Score

```javascript
calculateCredibilityScore(geminiAnalysis, dbResults) {
  // Start at 80%
  // Subtract for artifacts and inconsistencies
  // Multiply by confidence
  // Adjust for database results
  // Return 0-1 value
}
```

---

## 🔄 Data Flow Examples

### Adding a New Gemini Analysis Field

1. **Update the prompt in background.js:**
   ```javascript
   getAnalysisPrompt(mediaType) {
     return `... ask Gemini for new field ...`;
   }
   ```

2. **Parse the response:**
   ```javascript
   parseGeminiResponse(data) {
     return {
       assessment: '...',
       artifacts: [...],
       inconsistencies: [...],
       newField: [...],  // Add this
     }
   }
   ```

3. **Display in popup.js:**
   ```javascript
   displayResult(result) {
     // Add new section to result card
     resultCard.innerHTML += `
       <div>${result.newField}</div>
     `;
   }
   ```

---

### Adding a New Setting

1. **Add checkbox in options.html:**
   ```html
   <input type="checkbox" id="newSetting" />
   ```

2. **Handle in options.js:**
   ```javascript
   this.newSetting = document.getElementById('newSetting');
   
   async saveAnalysisSettings() {
     await chrome.storage.local.set({
       newSetting: this.newSetting.checked
     });
   }
   ```

3. **Use in background.js:**
   ```javascript
   const result = await chrome.storage.local.get(['newSetting']);
   if (result.newSetting) {
     // Do something
   }
   ```

---

## 🧪 Testing

### Manual Testing Checklist

```
[ ] Extension loads without errors
[ ] Popup opens when clicking icon
[ ] Settings page opens
[ ] Google Sign-in works
[ ] Can save API key
[ ] Can scan pages
[ ] Can analyze images
[ ] Credibility scores display
[ ] Settings persist
[ ] Works on Chrome
[ ] Works on Edge
[ ] Mobile view responsive
```

### Testing with Sample Images

```
Test URLs:
- https://example.com/image.jpg
- https://unsplash.com/photos/...
- Social media images (Twitter, Reddit, etc.)

Test Cases:
- Authentic images
- Obvious fake/meme images
- AI-generated test images
- Deepfake test videos
```

### Browser Console Testing

```javascript
// In background.js console:
console.log('[InfoGuard] Starting analysis...');

// Check storage:
chrome.storage.local.get(null, (result) => {
  console.log('Storage:', result);
});

// Simulate message:
chrome.runtime.sendMessage({
  action: 'analyzeMedia',
  media: { type: 'image', src: '...' },
  token: '...'
});
```

---

## 🐛 Debugging Tips

### Enable Verbose Logging

Edit `src/background.js`:
```javascript
const DEBUG = true;  // Enable logging

// Use throughout:
if (DEBUG) console.log('Debug info:', data);
```

### Inspect Background Worker

1. `chrome://extensions/`
2. Find InfoGuard
3. Click "Inspect background page"
4. Check Console for logs

---

### Inspect Content Script

1. Open any website
2. Right-click → "Inspect"
3. Go to Console tab
4. Look for `[InfoGuard]` messages

---

### Monitor Network Requests

1. `chrome://extensions/`
2. Click InfoGuard Details
3. Look for "Background page"
4. Open DevTools from there
5. Go to Network tab
6. Trigger analysis
7. Watch API requests

---

### Use Chrome DevTools

```javascript
// In any console:

// Check if extension is loaded
chrome.runtime.id  // Should return extension ID

// Send message to background
chrome.runtime.sendMessage(
  { action: 'test' },
  (response) => console.log(response)
);

// Access storage
chrome.storage.local.get(null, console.log);

// Check tabs
chrome.tabs.query({}, console.log);
```

---

## 📦 Building for Production

### Version Update

Update in `manifest.json`:
```json
"version": "1.1.0"  // Increment version
```

### Code Optimization

1. **Minify JavaScript:**
   ```bash
   npm install -g terser
   terser src/popup.js -o src/popup.min.js
   ```

2. **Minify CSS:**
   ```bash
   npm install -g csso-cli
   csso src/popup.css -o src/popup.min.css
   ```

3. **Update references in HTML:**
   ```html
   <link rel="stylesheet" href="popup.min.css">
   <script src="popup.min.js"></script>
   ```

### Create Package

1. Go to `chrome://extensions/`
2. Click ⋮ menu on InfoGuard
3. Select "Pack extension"
4. Choose source folder
5. A `.crx` file is generated

---

## 🔧 Common Customizations

### Change Color Scheme

Edit `src/popup.css` and `src/options.css`:

```css
:root {
  --primary: #667eea;      /* Change this */
  --secondary: #764ba2;    /* And this */
}
```

### Disable Features

In `src/popup.js`:
```javascript
// Hide API key setting
// Hide notification option
// Hide database check option
```

### Add New Language

Create `src/locales/fr-FR.json`:
```json
{
  "analyze": "Analyser",
  "credibility": "Crédibilité"
}
```

### Custom Favicon

Replace icons in `assets/icons/`:
- `icon-16.png`
- `icon-48.png`
- `icon-128.png`

---

## 🚀 Performance Optimization

### Reduce Bundle Size

```javascript
// Before
const results = await analyzeAllMedia(images);

// After - Use generators for lazy evaluation
function* analyzeMedia(images) {
  for (const image of images) {
    yield analyzeImage(image);
  }
}
```

### Cache API Responses

```javascript
// Add caching
const analysisCache = new Map();

async analyzeMedia(media) {
  const key = media.src;
  if (analysisCache.has(key)) {
    return analysisCache.get(key);
  }
  
  const result = await this.analyzeWithGemini(media);
  analysisCache.set(key, result);
  return result;
}
```

### Lazy Load Images

```javascript
// Only analyze visible images
const visibleImages = images.filter(img => {
  const rect = img.getBoundingClientRect();
  return rect.top < window.innerHeight;
});
```

---

## 📚 Resources for Developers

### Extension Development
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/)
- [Edge Extensions Docs](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/)
- [MDN Web Extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

### Gemini API
- [Gemini API Docs](https://ai.google.dev/docs)
- [API Reference](https://ai.google.dev/api/rest)
- [Google AI SDK](https://ai.google.dev/tutorials/setup)

### JavaScript
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [ES6+ Features](https://es6-features.org/)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [JSON Formatter](https://jsonlint.com/)

---

## 🤝 Contributing Guidelines

### Code Style

```javascript
// Use camelCase for variables and functions
const userEmail = 'user@gmail.com';

// Use PascalCase for classes
class MediaDetector { }

// Use UPPER_SNAKE_CASE for constants
const API_ENDPOINT = 'https://...';

// Add comments for complex logic
// Fetch media data and convert to base64
const mediaData = await fetchMediaData(url);
```

### Commit Messages

```
feat: Add new feature description
fix: Fix bug description
docs: Update documentation
refactor: Refactor code section
test: Add or update tests
```

### Pull Request Process

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Test thoroughly
5. Commit with clear messages
6. Push to branch
7. Create Pull Request
8. Wait for review

---

## 📊 Project Metrics

Current state:
- **Lines of Code**: ~1500
- **Number of Classes**: 4
- **API Endpoints**: 2+ (Gemini, Databases)
- **Storage Keys**: 10+
- **Functions**: 50+

---

## 🆘 Getting Help

### For Development Questions:
1. Check code comments
2. Review documentation
3. Check GitHub issues
4. Ask on GitHub Discussions

### For API Questions:
1. Check Gemini API docs
2. Check Google Cloud docs
3. Check Chrome Extensions docs

---

**Happy developing! 🚀**

Last Updated: January 7, 2026
