# Quick Start Guide - InfoGuard

## ⚡ 5-Minute Setup

### Step 1: Load the Extension (2 min)

**Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right corner)
3. Click "Load unpacked"
4. Select the `vibe-guard` folder
5. Done! 🎉

**Edge:**
1. Open `edge://extensions/`
2. Enable "Developer mode" (left sidebar)
3. Click "Load unpacked"
4. Select the `vibe-guard` folder
5. Done! 🎉

### Step 2: Configure API (2 min)

**Option A: Use Google Sign-in (Recommended)**
1. Click the InfoGuard icon
2. Click "Sign in with Google"
3. Complete Google authentication
4. That's it! Ready to analyze

**Option B: Manual API Key**
1. Get a key from [Google AI Studio](https://ai.google.dev/)
2. Open InfoGuard settings (⚙️ button)
3. Go to "API Settings" tab
4. Paste your API key
5. Click "Save API Key"

### Step 3: Start Analyzing (1 min)

1. Go to any social media site (Twitter, Facebook, Reddit, etc.)
2. Click the InfoGuard icon
3. Click "Scan Page"
4. See credibility scores instantly!

## 🎯 Common Tasks

### Analyze an Image
1. Click InfoGuard icon
2. Click "Analyze Selected Image"
3. Hover over images (borders highlight)
4. Click the image you want to analyze
5. Results appear in seconds

### Check Credibility Score
- **80-100%**: Likely authentic
- **50-80%**: Some minor artifacts detected
- **0-50%**: High likelihood of manipulation

### Change Settings
- Click ⚙️ in the popup
- Adjust preferences as needed
- Settings saved automatically

## 📱 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✅ Fully Supported |
| Edge | 88+ | ✅ Fully Supported |
| Firefox | - | ⏳ Coming Soon |
| Safari | - | ⏳ Coming Soon |

## 🔑 Getting API Keys

### Google Gemini API
1. Visit: https://ai.google.dev/
2. Click "Get API Key"
3. Create new project or select existing
4. Copy the key
5. Add to Vibe Guard settings

### Google OAuth (Sign-in)
1. Visit: https://console.cloud.google.com/
2. Create new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Set redirect URI to `chrome-extension://<extension-id>/options.html`

## ⚙️ Settings Explained

| Setting | What it Does |
|---------|-------------|
| **Auto-analyze** | Automatically scan pages for media |
| **Notifications** | Alert you about suspicious content |
| **Database Check** | Cross-reference with fact-checkers |
| **Confidence Threshold** | Only flag content below this % as suspicious |

## 🚨 When InfoGuard Flags Content

If InfoGuard shows a **low credibility score**, it means:
- ⚠️ Visual artifacts detected (compression, blending, synthesis)
- ⚠️ Possible deepfake indicators (facial/anatomical inconsistencies)
- ⚠️ Signs of AI generation (unnatural features)
- ⚠️ Matching claims from fact-checking databases

**This doesn't mean it's definitely fake** - use it as a warning sign to do additional research.

## 🐛 Quick Troubleshooting

**Extension not showing?**
- Refresh the page
- Make sure Developer mode is ON
- Check the extensions list (might be hidden)

**No media detected?**
- Not all sites embed media detectably
- Try a different social media platform
- Check browser console for errors

**API errors?**
- Verify your API key is correct
- Check your Google Cloud quota
- Ensure API is enabled in Cloud Console

**Sign-in issues?**
- Clear browser cookies
- Try a different Google account
- Check internet connection

## 📚 Next Steps

- [Read Full Documentation](./README.md)
- [View Architecture Guide](./ARCHITECTURE.md)
- [Check Advanced Settings](./ADVANCED.md)

## 💬 Need Help?

- Check the troubleshooting section in README.md
- Visit GitHub Issues
- Email support@infoguard.com

---

**Happy verifying! 🛡️**
