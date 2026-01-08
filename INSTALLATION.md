# Installation Guide - InfoGuard

## 📋 System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Browser**: Chrome 88+ or Edge 88+
- **RAM**: 512MB minimum
- **Disk Space**: 10MB
- **Internet**: Required for API calls
- **Google Account**: Required for authentication

## 🛠️ Installation Methods

### Method 1: Development Installation (Unpacked Extension)

Best for testing and development.

#### Windows

1. **Open File Explorer**
   - Navigate to: `C:\Users\Administrator\codes\infoguard`

2. **Open Chrome or Edge**
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`

3. **Enable Developer Mode**
   - Look for the toggle switch in the top-right corner
   - Click to enable (should turn blue)

4. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `infoguard` folder
   - Click "Select Folder"

5. **Verify Installation**
   - InfoGuard should appear in your extensions list
   - Icon should show in the toolbar

#### macOS

1. **Open Finder**
   - Navigate to the infoguard folder

2. **Open Chrome or Edge**
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`

3. **Enable Developer Mode**
   - Toggle in top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the infoguard folder
   - Click "Open"

#### Linux

1. **Open File Manager**
   - Navigate to the infoguard folder

2. **Open Chrome or Edge**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. **Enable Developer Mode**
   - Toggle in top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder
   - Click "Open"

### Method 2: Production Installation (.crx Package)

For distribution and production use.

#### Creating a .crx File

**Chrome:**
1. Go to `chrome://extensions/`
2. Find InfoGuard in the list
3. Click the menu (⋮) next to it
4. Select "Pack extension"
5. Choose the source folder: `infoguard`
6. Leave the key file blank (first time)
7. Click "Pack extension"
8. A `.crx` file will be created

**Edge:**
1. Go to `edge://extensions/`
2. Click the menu (⋮) next to InfoGuard
3. Select "More options" → "Export as zip"
4. Or use: Settings → Extensions → Extensions folder → Pack extension

#### Installing from .crx File

1. Drag and drop the `.crx` file into the extensions page
2. Or: Download from Chrome Web Store (once published)

### Method 3: Build from Source

For advanced users who want to customize.

#### Prerequisites

- Node.js 14+ (optional, for build tools)
- Git (optional, to clone)

#### Steps

1. **Download the source**
   ```bash
   # Option A: Clone (if using git)
   git clone https://github.com/yourusername/infoguard.git
   cd infoguard

   # Option B: Download as zip
   # Extract to a folder
   ```

2. **Configure API Keys**
   - Open `src/popup.js`
   - Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
   - Save the file

3. **Load in browser**
   - Follow "Method 1" above to load as unpacked extension

4. **Test**
   - Open a social media site
   - Click InfoGuard icon
   - Sign in and test the features

## 🔑 API Configuration

### Getting Google Client ID

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create a new project**
   - Click "Select a Project" at top
   - Click "NEW PROJECT"
   - Name it "InfoGuard"
   - Click "CREATE"

3. **Enable Google Identity API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Identity"
   - Click "Google Identity Service"
   - Click "ENABLE"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "CREATE CREDENTIALS"
   - Select "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins: `chrome-extension://<extension-id>`
   - Add authorized redirect URIs: `chrome-extension://<extension-id>/options.html`
   - Click "CREATE"
   - Copy the Client ID

5. **Update Extension**
   - Open `src/popup.js`
   - Find: `const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';`
   - Replace with your Client ID
   - Save the file

### Getting Gemini API Key

1. **Go to [Google AI Studio](https://ai.google.dev/)**

2. **Sign in with your Google account**

3. **Click "Create API Key"**
   - Select or create a project
   - API key is generated

4. **Copy the key**
   - Save it somewhere safe

5. **Add to Extension** (one of two ways):

   **Option A: In Extension Settings**
   - Open InfoGuard popup
   - Click ⚙️ (settings)
   - Go to "API Settings" tab
   - Paste the key
   - Click "Save API Key"

   **Option B: In Code**
   - Open `src/background.js`
   - Find: `const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';`
   - Replace with your actual key
   - Save the file

## ✅ Verification Checklist

After installation, verify everything works:

- [ ] Extension appears in toolbar
- [ ] Extension icon is visible
- [ ] Clicking icon opens popup
- [ ] Settings page (⚙️) opens correctly
- [ ] Can sign in with Google
- [ ] Can analyze pages with media
- [ ] Credibility scores appear
- [ ] Settings persist after refresh
- [ ] Works on social media sites

## 🚀 First Use

1. **Click the InfoGuard icon** in your toolbar

2. **Sign in with Google**
   - Click "Sign in with Google"
   - Complete authentication

3. **Go to a social media site**
   - Twitter, Facebook, Instagram, TikTok, Reddit, etc.

4. **Analyze content**
   - Click "Scan Page"
   - Wait for results
   - View credibility scores

5. **Customize settings**
   - Click ⚙️ button
   - Adjust preferences
   - Save settings

## 📂 File Structure After Installation

```
chrome://extensions/
├── InfoGuard
│   ├── manifest.json
│   ├── src/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   ├── popup.js
│   │   ├── background.js
│   │   ├── content.js
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   └── assets/
│       └── icons/
```

## 🔧 Troubleshooting Installation

### "Load unpacked" button not visible
- Make sure "Developer mode" toggle is ON
- Look in top-right corner of extensions page

### "Error" after loading
- Check manifest.json for syntax errors
- Verify all file paths are correct
- Refresh the page

### Extension loads but doesn't work
- Check browser console for errors (F12)
- Verify API keys are set correctly
- Make sure you're signed in with Google

### Can't detect media on pages
- Ensure content.js has run (check background script)
- Try refreshing the page
- Check if site blocks content detection

### API errors when analyzing
- Verify API key is valid
- Check Google Cloud quota limits
- Ensure API is enabled in Cloud Console

## 🔐 Security Notes

- Never share your API keys
- Don't commit API keys to public repositories
- Use environment variables in production
- Keep your Google account secure
- Use strong passwords

## 📚 Next Steps

1. **Read the Quick Start Guide**: [QUICKSTART.md](./QUICKSTART.md)
2. **Read Full Documentation**: [README.md](./README.md)
3. **Configure Settings**: Open InfoGuard and customize
4. **Start Analyzing**: Use on social media sites

## 💬 Need Help?

- **Installation Issues**: Check troubleshooting section above
- **Feature Questions**: See [README.md](./README.md)
- **Bug Reports**: [GitHub Issues](https://github.com/yourusername/infoguard/issues)
- **General Help**: [GitHub Discussions](https://github.com/yourusername/infoguard/discussions)

---

**Installation complete! Happy analyzing! 🛡️**
