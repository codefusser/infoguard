# InfoGuard - Complete Reference & Troubleshooting

## Error: "Extension not properly configured"

This error occurs when the **Google OAuth Client ID** hasn't been set up yet.

### ✅ Fix (2 minutes)

**Step 1: Get Your Extension ID**
```
1. Open Chrome/Edge
2. Type in address bar: chrome://extensions/ (or edge://extensions/)
3. Enable "Developer mode" (toggle, top-right)
4. Find "InfoGuard" in the list
5. Copy the ID shown (long code like: abcdefghij...)
```

**Step 2: Create OAuth Credentials**
```
1. Go to: https://console.cloud.google.com
2. Create a new project (if you don't have one)
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Under "Authorized redirect URIs", add:
   https://YOUR_EXTENSION_ID.chromiumapp.org/oauth2callback
   (Replace YOUR_EXTENSION_ID with your actual ID from Step 1)
7. Click "CREATE"
8. Copy your "Client ID" (format: xxx.apps.googleusercontent.com)
```

**Step 3: Configure the Extension**
```
1. Click the InfoGuard icon in your toolbar
2. Click the ⚙️ settings button (top-right)
3. Go to the "API Setup" tab
4. Paste your Client ID in the field labeled "Client ID"
5. Click "Save Client ID"
6. Go back to "Account" tab
7. Click "Sign in with Google"
8. Complete the sign-in flow
9. You're all set! ✓
```

---

## Common Issues & Solutions

### Issue: "Auth timeout" when signing in

**Cause:** Network connection is slow or interrupted

**Solution:**
1. Check your internet connection speed
2. Try signing in again
3. If it keeps happening, try from a different network
4. Check browser console (F12) for more details

---

### Issue: "Redirect URI mismatch"

**Cause:** The extension ID in OAuth config doesn't match your actual extension ID

**Solution:**
1. Verify your extension ID from chrome://extensions/
2. Go to Google Cloud Console
3. Update the redirect URI to match:
   `https://CORRECT_EXTENSION_ID.chromiumapp.org/oauth2callback`
4. Try signing in again

---

### Issue: "Sign in cancelled by user"

**Cause:** You clicked "Cancel" on the Google login page

**Solution:**
1. This is normal - just click "Sign in with Google" again when ready
2. Complete the sign-in flow this time

---

### Issue: "Permission denied" error

**Cause:** You denied InfoGuard permission to access your Google account

**Solution:**
1. Click "Sign in with Google" again
2. When Google asks for permissions, click "Allow" or "Accept"
3. You can always revoke access later in your Google account settings

---

### Issue: "No images or videos found on this page"

**Cause:** Either there's no media on the page, or Content Security Policy blocks it

**Solution:**
1. Try on a different website (example: Google Images, Pinterest)
2. Refresh the page and try again
3. Check if the website restricts media loading
4. For security reasons, some sites don't allow extensions to access media

---

### Issue: "Failed to analyze media"

**Cause:** Could be network issue, API quota exceeded, or API not configured

**Solution:**
1. Check your internet connection
2. Verify you have a valid Google API key in settings (optional)
3. Check your Google Cloud Console for API quota limits
4. Try analyzing again in a few seconds (may be rate limited)
5. Check browser console (F12) for detailed error

---

### Issue: "API key not configured"

**Cause:** Gemini API key is missing (if not using OAuth)

**Solution:**
1. Either sign in with Google (recommended) OR
2. Go to https://ai.google.dev and get an API key
3. In extension settings, go to "API Setup"
4. Paste the key in "API Key" field
5. Click "Save API Key"

---

## Chrome Developer Tools Debugging

### Check Stored Data

**In Browser Console (Press F12):**

```javascript
// View your Client ID
chrome.storage.local.get('googleClientId', (result) => {
  console.log('Client ID:', result.googleClientId);
});

// View your auth token (if signed in)
chrome.storage.local.get('googleToken', (result) => {
  console.log('Token exists:', !!result.googleToken);
});

// View all stored data
chrome.storage.local.get(null, (result) => {
  console.log('All stored data:', result);
});

// View user email
chrome.storage.local.get('userEmail', (result) => {
  console.log('User email:', result.userEmail);
});
```

### Check Logs

```javascript
// View application logs (if enabled)
logger.getLogs()

// Export logs as JSON
console.log(logger.exportLogs())
```

### Enable Debug Mode

**In config.js:**
```javascript
CONFIG.DEBUG = true;  // Shows detailed logs in console
```

---

## Understanding Storage Keys

When you sign in or configure settings, InfoGuard stores data locally:

| Key | Purpose | Sensitive? |
|-----|---------|-----------|
| `googleClientId` | OAuth Client ID | No |
| `googleToken` | Auth token for API calls | ⚠️ Yes |
| `tokenExpiry` | When token expires | No |
| `userEmail` | Your email address | Yes |
| `geminiKey` | Gemini API key (optional) | ⚠️ Yes |
| `autoAnalyze` | Auto-analyze setting | No |
| `enableNotifications` | Notifications setting | No |
| `databaseCheck` | Fact-check setting | No |
| `confidenceThreshold` | Analysis threshold | No |

**⚠️ Important:** Never share data marked as "Sensitive"

---

## Security Best Practices

✅ **DO:**
- Keep your extension ID private
- Never share your API tokens
- Update the extension regularly
- Check browser extension permissions
- Use strong Google password

❌ **DON'T:**
- Hardcode API keys in code
- Share your auth token
- Use extension on untrusted computers
- Grant excessive permissions
- Log sensitive data

---

## Performance Tips

### Speed Up Analysis

1. **Reduce batch size:**
   - Go to Settings → Analysis
   - Lower "Auto-analyze batch size" to 5
   - This analyzes fewer items at once

2. **Disable database checking:**
   - Go to Settings → Analysis
   - Uncheck "Cross-reference with databases"
   - This skips fact-check verification

3. **Increase threshold:**
   - Go to Settings → Analysis
   - Increase "Confidence Threshold" to 80%
   - Only flags obvious fake content

4. **Disable auto-analyze:**
   - Go to Settings → Analysis
   - Uncheck "Auto-analyze media"
   - Only analyze when you click the button

---

## Understanding Error Messages

| Message | Meaning | Action |
|---------|---------|--------|
| "Extension not properly configured" | Client ID not set | Go to Settings → API Setup |
| "Sign in cancelled" | You clicked cancel | Try signing in again |
| "Auth timeout" | Network too slow | Try again later |
| "Failed to analyze media" | API error | Check internet, try again |
| "No images found" | Website blocks extension | Try different website |
| "Rate limit exceeded" | Too many requests | Wait a moment, try again |
| "Unauthorized" | Token invalid | Sign out, sign in again |

---

## FAQ

**Q: Is my data private?**  
A: Yes. Media is only sent to Google's API for analysis. We don't store your media or results.

**Q: What's the difference between OAuth and API Key?**  
A: OAuth is more secure (recommended). API Key is simpler but less secure.

**Q: Can I use multiple accounts?**  
A: Currently, only one account per extension. Uninstall and reinstall for new account.

**Q: How long do tokens last?**  
A: 1 hour by default. Automatically refreshed before expiry.

**Q: What websites are supported?**  
A: All websites (except those with strict CSP). Works best on social media.

**Q: Can I analyze offline?**  
A: No, API analysis requires internet connection.

**Q: How accurate is the analysis?**  
A: Gemini AI is ~85-95% accurate depending on media quality.

**Q: Does it work in incognito mode?**  
A: Need to enable extension in incognito mode first (Chrome settings).

**Q: Can I delete my stored data?**  
A: Yes, uninstall the extension (all data removed). Or use "Clear Settings" button.

---

## Contact & Support

**Found a bug?**
- GitHub Issues: https://github.com/codefusser/infoguard/issues

**Need help?**
- GitHub Discussions: https://github.com/codefusser/infoguard/discussions
- Check QUICK_SETUP.md for step-by-step guide
- Check PRODUCTION_DEPLOYMENT.md for detailed docs

**Want to contribute?**
- Fork on GitHub: https://github.com/codefusser/infoguard
- Submit pull requests
- Report issues and improvements

---

## Quick Links

- 📖 [QUICK_SETUP.md](QUICK_SETUP.md) - Setup guide
- 📚 [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Full documentation
- 🔐 [OAUTH_TECHNICAL_GUIDE.md](OAUTH_TECHNICAL_GUIDE.md) - Technical details
- 📋 [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) - What changed
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Project structure
- ⚙️ [CONFIGURATION.md](CONFIGURATION.md) - Configuration options

---

**Last Updated:** January 8, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
