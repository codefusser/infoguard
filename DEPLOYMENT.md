# Deployment Guide - InfoGuard

## 📦 Overview

This guide covers packaging and deploying InfoGuard to Chrome Web Store and Microsoft Edge Add-ons store.

## ✅ Pre-Deployment Checklist

Before submitting to any store, ensure:

- [ ] Version number updated in `manifest.json`
- [ ] All icons are present in `assets/icons/` (16px, 48px, 128px PNG)
- [ ] Extension tested in developer mode
- [ ] No console errors or warnings
- [ ] All permissions in manifest.json are justified
- [ ] Sensitive credentials (API keys) are NOT hardcoded
- [ ] Privacy policy created and hosted
- [ ] Screenshots prepared (1280x800px recommended)
- [ ] Promotional materials ready (icon, banner, description)

## 🔒 Security & Privacy Requirements

### 1. Create Privacy Policy

Store policies require a privacy policy URL. Create one covering:
- What data is collected
- How API calls are made
- No tracking or analytics of user content
- How authentication works

Save to your website or GitHub Pages.

### 2. Review Manifest Permissions

Your current permissions:
- `activeTab` - Access to active tab
- `scripting` - Inject scripts
- `storage` - Save settings
- `tabs` - Detect tabs
- `webRequest` - Monitor requests (may need declaration)
- `contextMenus` - Right-click menu

**Remove or justify** any unused permissions.

### 3. API Key Handling

✅ Current implementation is secure:
- API keys stored in Chrome storage (encrypted)
- Users provide their own API keys
- No hardcoded credentials
- Recommended: Add warning about API rate limits and costs

## 📦 Creating Deployment Packages

### Method 1: Chrome Web Store Package

#### Step 1: Prepare the Directory
```bash
# Remove unnecessary files
Remove-Item .git -Recurse -Force
Remove-Item .gitignore
Remove-Item node_modules -Recurse -Force (if exists)
Remove-Item package.json (if not needed)
# Keep only essential files:
# - manifest.json
# - src/
# - assets/
# - Any required documentation
```

#### Step 2: Create a ZIP File
```bash
# PowerShell command
Compress-Archive -Path "C:\Users\Administrator\codes\InfoGuard" -DestinationPath "C:\Users\Administrator\codes\InfoGuard-v1.0.0.zip"
```

#### Step 3: Verify ZIP Contents
Should contain:
```
InfoGuard/
├── manifest.json
├── src/
│   ├── background.js
│   ├── content.js
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── options.html
│   ├── options.css
│   └── options.js
├── assets/
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
└── [Optional] README.md
```

### Method 2: Creating a Release Build Script

Create [build.ps1](build.ps1):

```powershell
param(
    [string]$version = "1.0.0"
)

# Create build directory
$buildDir = "build"
if (Test-Path $buildDir) {
    Remove-Item $buildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $buildDir | Out-Null

# Copy essential files
Copy-Item manifest.json $buildDir/
Copy-Item src $buildDir/src -Recurse
Copy-Item assets $buildDir/assets -Recurse

# Create ZIP
$zipName = "InfoGuard-v$version.zip"
Compress-Archive -Path "$buildDir/*" -DestinationPath $zipName

# Cleanup
Remove-Item $buildDir -Recurse -Force

Write-Host "Package created: $zipName"
```

Run with: `.\build.ps1 -version "1.0.0"`

## 🌐 Chrome Web Store Submission

### Step 1: Create Developer Account
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click "Create new item"
3. Accept terms and pay $5 one-time fee
4. Complete your developer profile

### Step 2: Upload Extension
1. Click "New app" in the left sidebar
2. Select "Upload"
3. Upload your ZIP file
4. Review the manifest automatically parsed by Chrome

### Step 3: Complete Store Listing

**Basic Information:**
- **Name**: InfoGuard - Truth Verification
- **Short description**: Real-time deepfake and misinformation detection using AI-powered analysis.
- **Detailed description**:
  ```
  InfoGuard uses advanced AI analysis to help you identify deepfakes, 
  manipulated media, and misinformation in real-time. Simply enable 
  the extension and click on any image or video to get instant 
  credibility scores.
  
  Features:
  - Real-time deepfake detection on images and videos
  - AI-generated content identification
  - Credibility scoring with detailed analysis
  - Privacy-focused: Your data never leaves your device
  - Secure OAuth authentication with Google
  
  How it works:
  1. Install the extension
  2. Sign in with your Google account
  3. Browse social media and other websites
  4. Click the InfoGuard icon to analyze media
  5. Get instant credibility scores
  ```

**Additional Fields:**
- **Category**: Tools
- **Language**: English
- **Privacy policy URL**: [Your URL]
- **Support email**: [Your email]
- **Homepage URL**: [Your GitHub/website]

### Step 4: Upload Store Assets

Required screenshots (1280×800px):
1. Initial popup view
2. Analysis results
3. Settings page
4. Multiple detections example

Small promo tile (440×280px):
- Icon and short description

### Step 5: Detailed Pricing & Distribution
- **Pricing**: Free (recommended)
- **Distribution**: Public
- **Target regions**: All countries where applicable

### Step 6: Content Rating
Complete the content rating questionnaire (usually straightforward for tools).

### Step 7: Submit for Review
- Click "Submit for review"
- Review takes typically 1-5 business days
- You'll receive approval or feedback email

## 🔷 Microsoft Edge Add-ons Submission

### Step 1: Register Developer Account
1. Go to [Microsoft Edge Add-ons Dashboard](https://partner.microsoft.com/dashboard/microsoftedge)
2. Create Microsoft account if needed
3. Complete developer profile

### Step 2: Create New Extension Submission
1. Click "New extension"
2. Upload ZIP file
3. Complete the form

### Step 3: Fill Store Listing

Same structure as Chrome Web Store:
- Description
- Screenshots
- Support information
- Privacy policy

### Step 4: Submit for Review
- Expected review time: 1-3 business days

## 📋 Version Updates

### For Subsequent Releases:

1. Update version in `manifest.json`:
   ```json
   "version": "1.0.1"
   ```

2. Rebuild package with new version number

3. In store dashboard:
   - Upload new ZIP
   - Add changelog (what's new)
   - Submit for review

## ⚠️ Common Rejection Reasons & Prevention

| Issue | Prevention |
|-------|-----------|
| Unclear permissions | Document why each permission is needed |
| Privacy concerns | Include clear privacy policy |
| Misleading description | Be accurate about features |
| Hardcoded API keys | Use user-provided credentials |
| Broken functionality | Test thoroughly before submission |
| Low-quality assets | Use professional icons/screenshots |
| No support contact | Include support email |

## 🔄 Monitoring After Launch

### Metrics to Track:
- User count
- Ratings and reviews
- Crash reports
- Feature requests

### Update Frequency:
- Bug fixes: As needed
- Features: Every 1-2 months (recommended)
- Security patches: Immediately

## 📱 Android/Mobile Considerations

Chrome extensions don't work on mobile browsers. If you want mobile support:
- Build a React Native or Flutter app
- OR use web-based version with responsive design

## 🐛 Troubleshooting

### Extension Rejected

**If rejected, check:**
1. All permissions justified
2. Privacy policy valid and accessible
3. No obfuscated or minified code (unless documented)
4. Meets store content policies
5. Proper testing and functionality

**Response:**
- Stores provide detailed rejection reasons
- Fix issues and resubmit (no additional fee)
- Can resubmit multiple times

### Low Installation Rate

**If few users install:**
1. Improve description and screenshots
2. Add demo video
3. Build marketing presence (blog, social media)
4. Respond to reviews and fix issues
5. Optimize keywords in title/description

## 📚 Additional Resources

- [Chrome Web Store Publishing Guidelines](https://developer.chrome.com/docs/webstore/program-policies/)
- [Edge Extension Publishing Guide](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension)
- [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/developers/) (for Firefox future support)

## ✨ Next Steps

1. ✅ Create privacy policy
2. ✅ Prepare store assets (screenshots, icon, description)
3. ✅ Register developer accounts
4. ✅ Create deployment package
5. ✅ Submit to Chrome Web Store
6. ✅ Submit to Microsoft Edge Add-ons
7. ✅ Monitor reviews and ratings
8. ✅ Plan regular updates
