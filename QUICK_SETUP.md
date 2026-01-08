# Quick Setup Guide - Getting Your Google Client ID

## Step-by-Step Setup (2 minutes)

### 1. Find Your Extension ID
```
1. Open Chrome/Edge
2. Go to: chrome://extensions/ (or edge://extensions/)
3. Enable "Developer mode" (toggle in top-right)
4. Look for "InfoGuard" extension
5. Copy the ID (long alphanumeric code)
   Example: abcdefghijklmnopqrstuvwxyz123456
```

### 2. Create a Google Cloud Project
```
1. Go to: https://console.cloud.google.com
2. Click "Select a Project" (top-left)
3. Click "NEW PROJECT"
4. Name it: "InfoGuard"
5. Click "CREATE"
6. Wait for it to be created (30 seconds)
7. Select the new project
```

### 3. Enable Required APIs
```
1. In Google Cloud Console, click "APIs & Services"
2. Click "Enabled APIs & Services"
3. Click "Enable APIs and Services"
4. Search for: "Generative Language API"
5. Click it and press "ENABLE"
6. Wait for it to enable
```

### 4. Create OAuth Credentials
```
1. Click "Credentials" (left sidebar)
2. Click "Create Credentials"
3. Select "OAuth client ID"
4. Choose "Web application"
5. Name it: "InfoGuard Extension"
6. Click "Add URI" under "Authorized redirect URIs"
7. Enter: https://YOUR_EXTENSION_ID.chromiumapp.org/oauth2callback
   (Replace YOUR_EXTENSION_ID with the ID from Step 1)
8. Click "CREATE"
9. Copy your "Client ID" (looks like: xyz123.apps.googleusercontent.com)
```

### 5. Configure the Extension
```
1. Open the InfoGuard extension settings
   - Click InfoGuard icon in toolbar
   - Click ⚙️ gear icon (top-right)
2. Go to "API Setup" tab
3. Paste your Client ID in the field
4. Click "Save Client ID"
5. You should see: "Google Client ID saved successfully!"
```

### 6. Sign In
```
1. Go back to the main InfoGuard popup
2. Click "Sign in with Google"
3. You'll see the Google login screen
4. Enter your Google email and password
5. Grant permission to InfoGuard
6. You're done! ✓
```

## Troubleshooting

### "Cannot find Client ID in Google Cloud Console"
- Make sure you're in the "Credentials" section
- Look for "OAuth 2.0 Client IDs"
- If you don't see it, you may not have created OAuth credentials
- Go back to Step 4 and create them

### "Redirect URI mismatch error"
- Your extension ID might be wrong
- Check chrome://extensions/ again for the correct ID
- Make sure you included the full redirect URI format:
  `https://EXTENSION_ID.chromiumapp.org/oauth2callback`
- Update it in Google Cloud Console

### Still getting "Not properly configured"
1. Clear all settings: Click "Clear Saved Data" in settings
2. Verify Client ID is saved:
   - Open DevTools (F12)
   - Console tab
   - Type: `chrome.storage.local.get('googleClientId', console.log)`
   - It should show your Client ID
3. Try signing in again

### "Sign in cancelled by user"
- This means you clicked "Cancel" on the Google login screen
- Just click "Sign in with Google" again when ready

### "Auth timeout"
- Your internet connection may be slow
- Try again in a few seconds
- Check your internet speed

## What's the Client ID For?

The Client ID is like a password that tells Google:
- ✅ "This is a legitimate InfoGuard extension"
- ✅ "It's installed on this specific extension ID"
- ✅ "Users can safely sign in"

It's safe to share your Client ID because it's tied to your specific extension ID.

## Security Note

The Client ID is NOT sensitive - it's public information that identifies your OAuth application. It does NOT give access to user data directly.

However, the **OAuth tokens** received during sign-in ARE sensitive and should never be shared.

---

**Need Help?**
- Check the [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for more details
- Check [OAUTH_TECHNICAL_GUIDE.md](OAUTH_TECHNICAL_GUIDE.md) for technical details
- Open an issue on GitHub: https://github.com/codefusser/infoguard/issues
