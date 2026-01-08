# 🛡️ InfoGuard - Real-time Truth Verification

A powerful browser extension that leverages **Google's Gemini 3 AI** to detect deepfakes, manipulated media, and AI-generated content in real-time. InfoGuard analyzes images and videos from social media feeds, identifies visual artifacts, and provides credibility scores backed by fact-checking databases.

## ✨ Key Features

- **Real-time Media Analysis**: Automatically detects and analyzes images/videos on web pages
- **AI-Powered Deepfake Detection**: Uses Gemini 3's Advanced Visual Reasoning to identify manipulation
- **Credibility Scoring**: Get 0-100% credibility scores with detailed explanations
- **Artifact Detection**: Identifies visual inconsistencies, compression artifacts, and unnatural features
- **Cross-Reference Checking**: Validates claims against Snopes, FactCheck.org, and Full Fact
- **One-Click Authentication**: Simple Google Sign-in integration
- **Browser Compatible**: Works seamlessly with Chrome and Edge browsers
- **Privacy-First**: No media data stored, secure OAuth authentication

## 📋 Requirements

- **Browsers**: Google Chrome or Microsoft Edge (Manifest V3)
- **Google Account**: Required for Gemini API access
- **Gemini API Key**: Optional (can use Google Sign-in instead)
- **Internet Connection**: For API calls and database queries

## 🚀 Installation

### Option 1: Load as Unpacked Extension (Development)

1. **Clone/Download the extension**:
   ```bash
   cd "c:\Users\Administrator\codes\infoguard"
   ```

2. **Open Chrome/Edge Extensions Page**:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load Unpacked Extension**:
   - Click "Load unpacked"
   - Select the extension folder: `c:\Users\Administrator\codes\infoguard`

5. **The extension should now appear** in your extensions list with the InfoGuard icon

### Option 2: Package for Distribution

1. **In Chrome/Edge**:
   - Go to the extensions page
   - Click the menu (⋮) next to "InfoGuard"
   - Select "Pack extension"
   - Choose the extension folder
   - A `.crx` file will be generated

## 🔧 Configuration

### Setting Up Google Authentication

1. **Get a Google Client ID**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the "Google Identity" API
   - Create OAuth 2.0 credentials (Web application)
   - Add `chrome-extension://<extension-id>/options.html` to authorized redirect URIs

2. **Update the extension**:
   - Open `src/popup.js`
   - Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
   - Save the file

### Setting Up Gemini API

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create a new API key
   - Copy your key

2. **Add to Extension**:
   - Open the InfoGuard options page (extension icon → Settings)
   - Go to "API Settings" tab
   - Paste your API key
   - Click "Save API Key"

   Or update `src/background.js`:
   ```javascript
   const GEMINI_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
   ```

## 📖 Usage Guide

### Analyzing Page Content

1. **Open InfoGuard**:
   - Click the InfoGuard icon in your browser toolbar
   - Sign in with your Google account (first time only)

2. **Scan Current Page**:
   - Click "Scan Page" button
   - The extension will detect all images and videos
   - Select which media to analyze

3. **View Results**:
   - Results show credibility score (0-100%)
   - Visual artifacts detected
   - Inconsistencies found
   - Analysis explanation in natural language

### Analyzing Individual Images

1. Click "Analyze Selected Image"
2. Hover over images on the page - borders will highlight them
3. Click on an image to analyze it individually
4. Results appear instantly

### Customizing Settings

Open the InfoGuard options page to:
- Configure analysis preferences
- Manage trusted fact-checking sources
- Set confidence threshold for warnings
- Enable/disable notifications
- Manage API credentials

## 🏗️ Project Structure

```
vibe-guard/
├── manifest.json           # Extension configuration
├── src/
│   ├── popup.html         # Main popup UI
│   ├── popup.css          # Popup styles
│   ├── popup.js           # Popup logic
│   ├── content.js         # Page content detection
│   ├── background.js      # Service worker & API handling
│   ├── options.html       # Settings page
│   ├── options.css        # Settings styles
│   └── options.js         # Settings logic
├── assets/
│   └── icons/             # Extension icons (16x16, 48x48, 128x128)
├── README.md              # This file
└── LICENSE                # MIT License
```

## 🤖 How Gemini 3 Integration Works

### Analysis Pipeline

1. **Media Detection** (`content.js`):
   - Scans DOM for images and videos
   - Extracts image data and video URLs

2. **Gemini Analysis** (`background.js`):
   - Sends media to Gemini 3 API
   - Analyzes for deepfakes and AI-generated content
   - Identifies visual artifacts and inconsistencies
   - Extracts claims from media

3. **Database Cross-Reference**:
   - Queries Snopes, FactCheck.org, Full Fact
   - Checks for matching claims
   - Gathers verdicts on claims

4. **Credibility Scoring**:
   - Combines Gemini confidence score
   - Accounts for detected artifacts
   - Incorporates database results
   - Returns 0-100% credibility score

### Gemini Capabilities Used

- **Visual Reasoning**: Analyzes pixel-level details for manipulation
- **Artifact Detection**: Identifies compression, blending, and synthesis artifacts
- **Deepfake Detection**: Recognizes facial and anatomical inconsistencies
- **Deep Research**: Cross-references information across databases

## 🔒 Privacy & Security

- **No Data Storage**: Media is not stored or indexed
- **Secure Authentication**: OAuth 2.0 with Google
- **API Security**: All communications are HTTPS encrypted
- **Local Processing**: Analysis results cached locally only
- **Transparent**: Open source - inspect the code yourself

## 🛠️ Development

### Code Structure

**popup.js** - Main popup logic:
```javascript
class InfoGuardPopup {
  checkAuthStatus()      // Verify user is logged in
  analyzeCurrentPage()   // Scan page for media
  analyzeWithGemini()    // Send to Gemini API
  displayResult()        // Show credibility score
}
```

**background.js** - API and analysis:
```javascript
class InfoGuardAnalyzer {
  analyzeMedia()              // Main analysis pipeline
  analyzeWithGemini()         // Gemini API call
  crossReferenceWithDatabases()  // Fact-checking
  calculateCredibilityScore() // Score calculation
}
```

**content.js** - Media detection:
```javascript
class MediaDetector {
  detectMedia()          // Find images/videos on page
  enableImageSelection() // Let user select images
}
```

### Testing

1. **Load the extension** as unpacked (see Installation section)
2. **Test on social media**:
   - Twitter/X
   - Facebook
   - Instagram
   - TikTok
   - Reddit

3. **Test features**:
   - Page scanning
   - Individual image analysis
   - Settings persistence
   - Authentication flow

### Building for Production

1. **Update API Credentials**:
   - Replace placeholder Client IDs and API keys
   - Use environment variables in production

2. **Optimize Assets**:
   - Create proper extension icons
   - Minimize CSS and JavaScript
   - Test on both Chrome and Edge

3. **Package Extension**:
   - Use Chrome DevTools to pack
   - Or Edge Extension Toolkit

## 📚 API Documentation

### Gemini 3 API Endpoints

- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Method**: POST
- **Authentication**: API Key in query parameter
- **Content Types**: Images (JPEG, PNG, WebP), Videos

### Message Passing

**Content → Background**:
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'detectMedia'
})
```

**Background → Popup**:
```javascript
chrome.runtime.sendMessage({
  action: 'analyzeMedia',
  media: mediaObject,
  token: userToken
})
```

## 🐛 Troubleshooting

### Extension Not Appearing
- Ensure it's loaded in Chrome/Edge extensions page
- Check manifest.json for syntax errors
- Verify all files are in the correct directories

### API Errors
- Verify your Gemini API key is valid
- Check Google Cloud project settings
- Ensure API is enabled in Google Cloud Console

### No Media Detected
- Check if page has images/videos
- Ensure content.js is running (check permissions)
- Try refreshing the page
- Some sites may block content detection

### Authentication Issues
- Clear browser cache and cookies
- Verify Google client ID is correct
- Check OAuth redirect URI settings
- Try signing out and back in

## 📝 License

MIT License - Free for personal and commercial use

```
MIT License

Copyright (c) 2026 InfoGuard Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- [ ] Support for more fact-checking APIs
- [ ] Enhanced video analysis
- [ ] Multi-language support
- [ ] Advanced artifact visualization
- [ ] Performance optimization
- [ ] Unit tests

## 📞 Support & Feedback

- **Report Issues**: [GitHub Issues](https://github.com/yourusername/infoguard/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/infoguard/discussions)
- **Documentation**: See [Wiki](https://github.com/yourusername/infoguard/wiki)

## 🙏 Acknowledgments

- Built with **Gemini 3** by Google
- Fact-checking data from Snopes, FactCheck.org, Full Fact
- Inspired by the need for digital truth in the age of AI

---

**Made with ❤️ to protect truth online**

Last Updated: January 2026
