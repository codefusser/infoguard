# GitHub Repository Setup Guide

Your local repository is ready! Here's how to create and push to GitHub.

## Option 1: Using GitHub Web Interface (Recommended)

### Step 1: Create Repository on GitHub
1. Go to [github.com/new](https://github.com/new)
2. Fill in the form:
   - **Repository name:** `infoguard`
   - **Description:** Real-time deepfake and misinformation detection browser extension
   - **Visibility:** Public (recommended for open source)
   - **Initialize:** Leave all unchecked (you already have commits)
3. Click "Create repository"

### Step 2: Push Your Local Code
After creating the repo, GitHub will show you the commands to run. Execute in PowerShell:

```powershell
cd C:\Users\Administrator\codes\InfoGuard
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/infoguard.git
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username.**

### Step 3: Verify
Go to `https://github.com/YOUR_USERNAME/infoguard` to see your repo online.

---

## Option 2: Using GitHub CLI (Advanced)

If you want to install GitHub CLI for automated setup:

### Install GitHub CLI
```powershell
# Using Chocolatey
choco install gh

# Or using Scoop
scoop install gh

# Or download from
https://cli.github.com/
```

### Create and Push with One Command
```powershell
cd C:\Users\Administrator\codes\InfoGuard
gh repo create infoguard --public --source=. --remote=origin --push
```

---

## Current Git Status

Your repository currently has:
```
Commits: 1 (Initial commit)
Files: 24 tracked
Branch: master (will rename to main)
```

---

## Important Notes

### SSH vs HTTPS
- **HTTPS:** Simpler, but requires personal access token
- **SSH:** More secure, but requires key setup

**For HTTPS authentication:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a token with `repo` scope
3. Use token as password when pushing

**For SSH (recommended for future):**
```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Use SSH URL: git@github.com:YOUR_USERNAME/infoguard.git
```

---

## Post-Upload Tasks

Once your repo is online:

1. ✅ **Add .gitignore** - Prevent node_modules, build artifacts
2. ✅ **Set up branch protection** - Require reviews before merging
3. ✅ **Enable GitHub Pages** - Host documentation at username.github.io/infoguard
4. ✅ **Add topics** - browser-extension, deepfake-detection, ai-security
5. ✅ **Create releases** - Tag versions for store submissions
6. ✅ **Set up CI/CD** - GitHub Actions for testing (optional)

---

## Recommended .gitignore

Create `.gitignore` file in your repo root:

```
# Dependencies
node_modules/
package-lock.json

# Build outputs
build-temp/
*.zip
dist/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Credentials
.env
.env.local
credentials.json
```

Then commit:
```powershell
cd C:\Users\Administrator\codes\InfoGuard
git add .gitignore
git commit -m "Add .gitignore"
git push
```

---

## Next Steps

1. Create repo on GitHub using the button below or link: https://github.com/new
2. Run the push commands
3. Share your repo link: `https://github.com/YOUR_USERNAME/infoguard`
4. Use releases for version management
5. Reference repo in Chrome/Edge store listings

Good luck! 🚀
