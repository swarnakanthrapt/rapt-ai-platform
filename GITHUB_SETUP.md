# GitHub Setup Guide

Step-by-step instructions to push this project to GitHub.

## 🎯 Quick Start (3 Steps)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Enter repository name: `rapt-ai-platform`
3. Add description: `Rapt.ai GPU Orchestration Platform`
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README (we have one)
6. Click **"Create repository"**

### Step 2: Push Your Code

Open terminal in the `rapt-ai-github` folder:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: Rapt.ai Platform v3.0"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/rapt-ai-platform.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify

1. Go to your repository URL
2. Verify all files are uploaded
3. Check README displays correctly

**Done! Ready to deploy to Vercel →**

---

## 📁 Files That Will Be Uploaded

```
rapt-ai-platform/
├── .gitignore              ← Tells git what to ignore
├── DEPLOYMENT_GUIDE.md     ← Vercel deployment instructions
├── GITHUB_SETUP.md         ← This file
├── README.md               ← Project documentation
├── package.json            ← Dependencies
├── postcss.config.js       ← PostCSS configuration
├── tailwind.config.js      ← Tailwind CSS config
├── vercel.json             ← Vercel deployment config
├── public/
│   └── index.html          ← HTML template
└── src/
    ├── App.js              ← App wrapper
    ├── index.css           ← Tailwind imports
    ├── index.js            ← Entry point
    └── RaptAIPlatform.jsx  ← Main component (1500+ lines)
```

**Not uploaded (in .gitignore):**
- `node_modules/` - Too large, installed during build
- `build/` - Generated during deployment
- `.env.local` - Contains secrets

---

## 🔐 Authentication Options

### Option 1: HTTPS with Personal Access Token (Recommended)

1. **Create token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Select scopes: `repo` (full control)
   - Click "Generate token"
   - **Copy token immediately** (shown only once)

2. **Use token when pushing:**
   ```bash
   git push -u origin main
   # Username: YOUR_USERNAME
   # Password: paste_your_token_here
   ```

3. **Cache credentials:**
   ```bash
   # Save token for 1 hour
   git config --global credential.helper 'cache --timeout=3600'
   ```

### Option 2: SSH Keys

1. **Generate SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to accept default location
   # Enter passphrase (optional)
   ```

2. **Add key to GitHub:**
   ```bash
   # Copy public key
   cat ~/.ssh/id_ed25519.pub
   ```
   - Go to https://github.com/settings/keys
   - Click "New SSH key"
   - Paste key, add title
   - Click "Add SSH key"

3. **Use SSH URL:**
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/rapt-ai-platform.git
   git push -u origin main
   ```

---

## 🔄 Making Updates

### After Initial Push

1. **Make changes to code**

2. **Commit changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

3. **Vercel auto-deploys** (if connected)

### Create New Feature

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, then commit
git add .
git commit -m "Add new feature"

# Push branch
git push -u origin feature/new-feature

# Create Pull Request on GitHub
```

---

## 📝 Commit Message Guidelines

### Good Examples
```bash
git commit -m "Add deployment guide"
git commit -m "Fix deploy button validation"
git commit -m "Update README with Vercel instructions"
git commit -m "Improve API explorer responsiveness"
```

### Avoid
```bash
git commit -m "fix"
git commit -m "updates"
git commit -m "asdf"
```

### Conventional Commits (Optional)
```bash
git commit -m "feat: add deployment guide"
git commit -m "fix: deploy button validation"
git commit -m "docs: update README"
git commit -m "style: improve API explorer layout"
```

---

## 🏷️ Tags and Releases

### Create a Release

```bash
# Tag current version
git tag -a v3.0.0 -m "Release version 3.0.0"

# Push tags
git push --tags

# Create release on GitHub
# Go to: https://github.com/YOUR_USERNAME/rapt-ai-platform/releases/new
# Select tag, add release notes, publish
```

---

## 👥 Collaboration

### Add Collaborators

1. Go to repository Settings
2. Click "Collaborators"
3. Click "Add people"
4. Enter GitHub username
5. Send invitation

### Branch Protection

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require pull request before merging
   - Require status checks to pass
   - Include administrators

---

## 🐛 Troubleshooting

### "Authentication failed"

**Solution 1: Use Personal Access Token**
- Generate at https://github.com/settings/tokens
- Use as password when pushing

**Solution 2: Check SSH key**
```bash
ssh -T git@github.com
# Should see: "Hi username! You've successfully authenticated"
```

### "Repository not found"

Check remote URL:
```bash
git remote -v
# Should show: origin  https://github.com/YOUR_USERNAME/rapt-ai-platform.git
```

Fix if wrong:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/rapt-ai-platform.git
```

### "Large files detected"

If files > 100MB:
```bash
# Remove from git
git rm --cached large-file.zip

# Add to .gitignore
echo "large-file.zip" >> .gitignore

# Commit
git add .gitignore
git commit -m "Remove large file"
git push
```

### "Permission denied"

```bash
# Check SSH key
ssh-add -l

# If empty, add key
ssh-add ~/.ssh/id_ed25519
```

---

## 📊 Repository Settings

### Recommended Settings

**General:**
- ✅ Issues enabled
- ✅ Pull requests enabled
- ✅ Discussions enabled (optional)

**Options:**
- ✅ Automatically delete head branches
- ✅ Allow merge commits
- ✅ Allow squash merging

**Pages (optional):**
- Enable if you want GitHub Pages
- Source: gh-pages branch
- Custom domain: docs.rapt.ai

---

## 🎨 GitHub Repository Enhancements

### Add Topics

In repository page:
- Click "⚙️ Manage topics"
- Add: `react`, `kubernetes`, `gpu-orchestration`, `tailwindcss`, `vercel`

### Create .github Folder (Optional)

```bash
mkdir .github

# Add issue templates
mkdir .github/ISSUE_TEMPLATE

# Add pull request template
touch .github/pull_request_template.md

# Add workflows for CI/CD
mkdir .github/workflows
```

### Add Repository Badges

In README.md:
```markdown
![Build Status](https://github.com/YOUR_USERNAME/rapt-ai-platform/workflows/CI/badge.svg)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Version](https://img.shields.io/badge/version-3.0.0-blue)
```

---

## 📦 Releases and Versions

### Semantic Versioning

- **v3.0.0** - Major release (breaking changes)
- **v3.1.0** - Minor release (new features)
- **v3.1.1** - Patch release (bug fixes)

### Create Release

```bash
# Tag version
git tag -a v3.0.0 -m "Release v3.0.0 - Initial public release"

# Push tag
git push origin v3.0.0

# Create release on GitHub
# Include changelog and deployment notes
```

---

## 🔗 Connecting to Vercel

### Automatic Deployment

1. Go to https://vercel.com/new
2. Select GitHub repository
3. Click "Import"
4. Deploy

**Now:**
- Push to `main` → Production deployment
- Push to other branches → Preview deployments
- Pull requests → Preview URLs

---

## ✅ Checklist

Before pushing:
- [ ] All files in correct structure
- [ ] .gitignore exists (excludes node_modules)
- [ ] package.json is correct
- [ ] README.md is complete
- [ ] No sensitive data in code
- [ ] No large files (>100MB)

After pushing:
- [ ] Repository is public/private as intended
- [ ] README displays correctly
- [ ] All files uploaded
- [ ] No errors in Actions (if any)
- [ ] Clone and test: `git clone YOUR_REPO_URL`

---

## 🎉 Success!

Your code is now on GitHub!

**Next Steps:**
1. ✅ Code on GitHub
2. → Deploy to Vercel (see DEPLOYMENT_GUIDE.md)
3. → Share your project
4. → Start collaborating

**Repository URL:**
```
https://github.com/YOUR_USERNAME/rapt-ai-platform
```

---

## 🔗 Useful Commands

```bash
# Check status
git status

# View history
git log --oneline

# View remotes
git remote -v

# Pull latest changes
git pull

# Clone repository
git clone https://github.com/YOUR_USERNAME/rapt-ai-platform.git

# View branches
git branch -a

# Switch branch
git checkout branch-name

# Delete branch
git branch -d branch-name
```

---

**Ready to deploy? See DEPLOYMENT_GUIDE.md →**
