# Troubleshooting Guide - InfoGuard

## 🔍 Common Issues & Solutions

### Installation Issues

#### Problem: "Load unpacked" button not visible

**Cause:** Developer mode is not enabled

**Solution:**
1. Go to `chrome://extensions/` or `edge://extensions/`
2. Look for toggle switch in **top-right corner**
3. Click to enable Developer mode (should turn blue)
4. "Load unpacked" button should now appear

---

#### Problem: Extension doesn't load when clicking "Load unpacked"

**Cause:** Invalid folder selection or missing manifest.json

**Solution:**
1. Make sure you selected the **root infoguard folder**
2. Not a subfolder like `src/`
3. Verify `manifest.json` exists at the root level
4. Check manifest.json syntax (use JSON validator)
5. Refresh the page

---

#### Problem: Extension appears but has an error icon

**Cause:** Manifest.json syntax error or missing files

**Solution:**
1. Check manifest.json for syntax errors
2. Use an online JSON validator
3. Ensure all referenced files exist
4. Check file permissions (readable)
5. Try reloading the extension (refresh button)

---

### Authentication Issues

#### Problem: "Sign in with Google" button doesn't work

**Cause:** Invalid Client ID or OAuth not configured

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Verify your project has Google Identity API enabled
3. Check your OAuth 2.0 credentials
4. Verify redirect URI includes your extension ID:
   ```
   chrome-extension://<YOUR_EXTENSION_ID>/options.html
   ```
5. Update `src/popup.js` with correct Client ID
6. Reload the extension

**To find your extension ID:**
1. Go to `chrome://extensions/`
2. Find InfoGuard
3. Copy the ID shown on the card

---

#### Problem: "Sign in" button is stuck loading

**Cause:** OAuth flow timeout or network issue

**Solution:**
1. Check internet connection
2. Clear browser cookies/cache
3. Try a different Google account
4. Check browser console (F12) for error messages
5. Verify OAuth credentials are correct
6. Try again after 5 minutes

---

#### Problem: Signed in but can't analyze media

**Cause:** API key missing or invalid

**Solution:**
1. Open extension settings (⚙️ button)
2. Go to "API Settings" tab
3. Enter a valid Gemini API key
4. Click "Save API Key"
5. If using Google Sign-in, key should be auto-configured

---

### API Issues

#### Problem: API errors when analyzing (500, 401, 403)

**Cause:** Invalid API key, quota exceeded, or API not enabled

**Solution:**

**For 401 (Unauthorized):**
- Verify API key is correct
- Check key hasn't been revoked
- Generate a new key if needed
- Update extension settings

**For 403 (Forbidden):**
- API may not be enabled in Google Cloud
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Check APIs & Services → Enabled APIs
- Enable "Generative Language API"
- Wait a few minutes for changes to take effect

**For 500 (Server Error):**
- This is a temporary Gemini API issue
- Wait a few minutes and try again
- Check API status on Google's status page

**For Quota Exceeded:**
- You've hit API rate limits
- Check your quota in Google Cloud Console
- APIs & Services → Quotas
- Wait before making more requests

---

#### Problem: "Network error" when trying to analyze

**Cause:** No internet connection or CORS issue

**Solution:**
1. Check your internet connection
2. Make sure you can access Google APIs
3. Check browser console (F12) for actual error
4. Try a different website/image
5. Restart the browser

---

#### Problem: Analysis takes too long (>30 seconds)

**Cause:** Large file size, network latency, or API overload

**Solution:**
1. Try with a smaller image
2. Check internet speed
3. Wait for API to respond (Gemini can be slow)
4. Check if Gemini service is having issues
5. Try analyzing fewer images at once

---

### Media Detection Issues

#### Problem: "No images or videos found on this page"

**Cause:** Content script not running or no media on page

**Solution:**

1. **Verify content script is running:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for message: `[InfoGuard] Detected X media items`
   - If not present, content script didn't run

2. **Check permissions:**
   - Go to extension settings
   - Verify "content_scripts" in manifest.json

3. **Try a different website:**
   - Some sites block content detection
   - Try: Twitter, Reddit, Facebook, Instagram

4. **Check if page has media:**
   - Open the page's DevTools
   - Look for `<img>` or `<video>` tags
   - If none exist, there's nothing to analyze

5. **Reload extension:**
   - Go to `chrome://extensions/`
   - Click refresh button on InfoGuard
   - Try again

---

#### Problem: Images show but can't be analyzed individually

**Cause:** Image URL not accessible or data extraction failed

**Solution:**
1. Try scanning the page instead of individual images
2. Check if image is from same domain (CORS)
3. Some images may be protected/blocked
4. Try a different image
5. Check browser console for detailed error

---

### Settings Issues

#### Problem: Settings not being saved

**Cause:** Storage permission issue or corrupted data

**Solution:**
1. Check if extension has storage permission:
   - Go to `chrome://extensions/`
   - Find Vibe Guard
   - Click "Details"
   - Check "Permissions" tab
   - Should include "Storage"

2. Clear extension storage:
   - Go to extension settings
   - Click "Clear API Key"
   - Sign out and back in

3. Restart the browser

4. Try clearing all extension data:
   - Settings → Privacy and security → Clear browsing data
   - Choose "All time"
   - Select "Cookies and other site data"
   - Clear

---

#### Problem: Sign out doesn't work

**Cause:** Storage clearing failed

**Solution:**
1. Try clicking "Sign Out" again
2. Clear browser cookies for Google domain
3. Reload extension
4. Try signing in with a different account

---

#### Problem: API key not being remembered

**Cause:** Storage issue or invalid key format

**Solution:**
1. Verify API key format (should start with `AIza`)
2. Remove extra spaces/characters
3. Clear previous key: Click "Clear API Key"
4. Save again
5. Restart extension

---

### Performance Issues

#### Problem: Extension is slow or laggy

**Cause:** Too many images detected, memory leak, or slow API

**Solution:**
1. Analyze fewer images (scroll past most of them)
2. Close other extensions
3. Restart browser
4. Check available RAM
5. Try on a page with fewer images

---

#### Problem: Popup takes forever to open

**Cause:** Page has too many elements, startup delay

**Solution:**
1. Unload other extensions (temporarily)
2. Close extra browser tabs
3. Restart browser
4. Try on a different page
5. Check if background script is running:
   - DevTools → Application → Service Workers

---

#### Problem: "Out of memory" error

**Cause:** Too much data cached, memory leak

**Solution:**
1. Clear extension storage: Settings → Clear API Key
2. Clear browser cache
3. Restart browser
4. Reload extension

---

### Browser-Specific Issues

#### Chrome Issues

**Problem:** Extension shows "Corrupted extension" error

**Solution:**
1. Go to `chrome://extensions/`
2. Remove and re-add InfoGuard
3. Verify manifest.json is valid
4. Check for invalid characters in files

**Problem:** Changes don't take effect after editing code

**Solution:**
1. Go to `chrome://extensions/`
2. Click the refresh button on InfoGuard
3. Or unload and reload the extension

---

#### Edge Issues

**Problem:** Extension not loading on Windows N edition

**Cause:** Edge Add-ons might have restrictions

**Solution:**
1. Check Edge version (should be 88+)
2. Try using Chrome instead
3. Install prerequisites for your Windows edition

**Problem:** Settings UI looks broken in Edge

**Solution:**
1. Make sure Edge is up to date
2. Try refreshing the settings page
3. Check for browser-specific CSS issues
4. Test in Chrome to confirm

---

### Advanced Troubleshooting

#### Enable Debug Logging

Edit `src/background.js`:
```javascript
const DEBUG = true;  // Change from false to true
```

Then check browser console (F12) for detailed logs.

---

#### Check Service Worker Status

1. Go to `chrome://extensions/`
2. Click "Details" on InfoGuard
3. Go to "Background Page" or "Inspect"
4. Look for console logs
5. Check for error messages

---

#### Monitor Network Activity

1. Open DevTools (F12)
2. Go to "Network" tab
3. Try to analyze
4. Look for failed requests
5. Check response status and content

---

#### Verify File Structure

```
infoguard/
├── manifest.json          ← Must exist at root
├── src/
│   ├── popup.html         ← Must exist
│   ├── popup.css          ← Must exist
│   ├── popup.js           ← Must exist
│   ├── background.js      ← Must exist
│   ├── content.js         ← Must exist
│   ├── options.html       ← Must exist
│   ├── options.css        ← Must exist
│   └── options.js         ← Must exist
└── assets/
    └── icons/             ← Recommended
```

---

## 🔗 Useful Resources

### Debugging Tools
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Edge DevTools](https://docs.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/)
- [JSON Validator](https://jsonlint.com/)

### API Documentation
- [Gemini API Docs](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google AI Studio](https://ai.google.dev/)

### Browser Extension Resources
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Edge Add-ons Guide](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/)
- [MDN Web Extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

---

## 📋 Error Message Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Manifest not found" | manifest.json missing | Check file exists at root |
| "Invalid manifest" | JSON syntax error | Validate manifest.json |
| "Permission denied" | Missing permission | Add to manifest.json permissions |
| "Script blocked" | CSP violation | Remove inline scripts |
| "CORS error" | Cross-origin request blocked | Check API endpoint |
| "API key invalid" | Wrong or expired key | Get new key from Google |
| "Quota exceeded" | Rate limit hit | Wait before retrying |
| "Service worker failed" | background.js error | Check console for details |
| "Storage error" | Can't access storage | Check storage permission |

---

## 💬 Getting Help

### Before asking for help:
1. ✅ Check this troubleshooting guide
2. ✅ Check README.md
3. ✅ Check browser console (F12) for errors
4. ✅ Try on a different browser/site
5. ✅ Restart the browser
6. ✅ Clear cache and reload extension

### Where to get help:
- **Questions**: Check README.md and QUICKSTART.md
- **Bugs**: Create issue on GitHub
- **API Issues**: Check Gemini docs
- **Google Oauth**: Check Google Cloud docs

### When reporting bugs:
1. Include browser and version
2. Describe what you did
3. Show error messages
4. Share console logs (F12)
5. Provide website/image if possible

---

**Last Updated:** January 7, 2026

**Need more help?** Check the documentation files in the project folder.
