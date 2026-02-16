# Vercel Deployment Guide

Complete step-by-step guide to deploy Rapt.ai Platform to Vercel.

## 🎯 Method 1: One-Click Deploy (Easiest)

### Prerequisites
- GitHub account
- Vercel account (free at https://vercel.com)

### Steps

1. **Fork/Upload to GitHub**
   - Go to GitHub.com
   - Create new repository: `rapt-ai-platform`
   - Upload all files from this folder
   - Make repository public or private

2. **Deploy to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `rapt-ai-platform` repository
   - Click "Import"
   - Vercel auto-detects settings (Create React App)
   - Click "Deploy"
   - Wait 2-3 minutes ☕
   - Done! Get your URL: `https://rapt-ai-platform-xxx.vercel.app`

---

## 🚀 Method 2: Vercel CLI (For Developers)

### Prerequisites
- Node.js installed
- Project files on your computer

### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to Project**
   ```bash
   cd rapt-ai-platform
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```
   - Choose login method (GitHub, GitLab, email)

4. **Deploy**
   ```bash
   vercel
   ```
   - Confirm project settings
   - Press Enter for defaults
   - Wait for deployment
   - Get deployment URL!

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## 📁 Files You Need to Upload to GitHub

```
rapt-ai-platform/
├── public/
│   └── index.html
├── src/
│   ├── RaptAIPlatform.jsx
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .gitignore
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
└── README.md
```

**Do NOT upload:**
- `node_modules/` (too large, installed automatically)
- `build/` (generated during deployment)
- `.env.local` (contains secrets)

---

## ⚙️ Vercel Configuration

The `vercel.json` file configures deployment:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**What it does:**
- `buildCommand`: Runs `npm run build` to create production bundle
- `outputDirectory`: Tells Vercel where the build files are
- `framework`: Auto-detects Create React App settings
- `rewrites`: Enables client-side routing (all routes go to index.html)

---

## 🔐 Environment Variables (Optional)

If you need API keys or configuration:

### Via Vercel Dashboard
1. Go to your project on Vercel
2. Click "Settings"
3. Click "Environment Variables"
4. Add variables:
   - `REACT_APP_API_URL` = `https://api.rapt.ai`
   - `REACT_APP_API_TOKEN` = `your_token_here`
5. Click "Save"
6. Redeploy for changes to take effect

### Via Vercel CLI
```bash
vercel env add REACT_APP_API_URL production
# Enter value when prompted

vercel env add REACT_APP_API_TOKEN production
# Enter token when prompted
```

---

## 🌐 Custom Domain

### Add Custom Domain

1. **Via Vercel Dashboard**
   - Go to project settings
   - Click "Domains"
   - Enter your domain: `app.rapt.ai`
   - Follow DNS configuration instructions
   - Wait for DNS propagation (5-30 minutes)

2. **DNS Configuration**
   - Add CNAME record:
     - Name: `app` (or `@` for root domain)
     - Value: `cname.vercel-dns.com`
   - Or use Vercel nameservers for full control

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. **Push to main branch** → Production deployment
2. **Push to other branches** → Preview deployment
3. **Pull requests** → Automatic preview URLs

### Disable Auto-Deploy
In Vercel Dashboard:
- Project Settings → Git
- Uncheck "Automatic deployments from Git"

---

## 📊 Deployment Settings

### Build Settings (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install"
}
```

### Environment
- **Node.js Version**: 18.x (default)
- **Build Time**: 2-3 minutes
- **Deploy Time**: 30 seconds

### Caching
Vercel automatically caches:
- `node_modules/` (speeds up builds)
- Static assets (improves load times)

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Check package.json has all dependencies
# Ensure lucide-react is listed
```

**Error: "Command 'npm run build' exited with 1"**
- Check for syntax errors in code
- Review build logs in Vercel dashboard
- Test locally: `npm run build`

### Deployment Succeeds but App Doesn't Load

**Blank page:**
- Check browser console (F12)
- Verify `homepage: "."` in package.json
- Check vercel.json has rewrites configured

**404 on routes:**
- Verify rewrites in vercel.json
- Ensure SPA routing is enabled

### Styles Not Loading

**Tailwind not working:**
- Verify tailwind.config.js exists
- Check postcss.config.js is present
- Ensure index.css has @tailwind directives

---

## 🚀 Optimization Tips

### Improve Build Time
```json
// package.json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

### Enable Analytics
In Vercel Dashboard:
- Analytics tab → Enable Web Analytics
- Get insights on page views, performance

### Add Preview Deployments
Every branch gets a preview URL:
- `feature-branch` → `rapt-ai-platform-git-feature-branch-xxx.vercel.app`

---

## 📈 Post-Deployment

### Test Your Deployment

1. **Open deployed URL**
2. **Test all tabs:**
   - Overview → Check metrics load
   - Services → View service table
   - Deploy → Try AUTO mode deployment
   - API → Click endpoints

3. **Test deploy button:**
   - Enter service name
   - Click "Deploy Service"
   - Verify Pod IP appears

### Monitor Performance

Vercel Dashboard shows:
- Response times
- Error rates
- Bandwidth usage
- Page views

---

## 🔒 Security

### HTTPS
- Automatically enabled by Vercel
- All traffic encrypted

### Access Control
For private apps:
- Vercel Pro: Password protection
- Enterprise: SSO, SAML

### API Keys
- Store in Environment Variables
- Never commit to GitHub
- Rotate regularly

---

## 💰 Pricing

### Vercel Free Tier (Hobby)
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ HTTPS
- ✅ 100GB bandwidth/month
- ✅ Perfect for this app

### When to Upgrade
- Need > 100GB bandwidth
- Want password protection
- Need team collaboration
- Want advanced analytics

---

## 📝 Checklist

Before deploying:
- [ ] All files in correct structure
- [ ] package.json has all dependencies
- [ ] vercel.json exists
- [ ] .gitignore includes node_modules
- [ ] README.md is complete
- [ ] App works locally (`npm start`)
- [ ] Production build works (`npm run build`)

After deploying:
- [ ] App loads without errors
- [ ] All 4 tabs work
- [ ] Deploy button functions
- [ ] API explorer shows responses
- [ ] No console errors
- [ ] Mobile responsive

---

## 🎉 Success!

Your Rapt.ai Platform is now live on Vercel!

**Share your deployment:**
- Tweet: "Just deployed Rapt.ai Platform on @vercel 🚀"
- LinkedIn: Share your project URL
- Team: Send deployment link

**Next steps:**
- Monitor analytics
- Gather user feedback
- Plan feature updates
- Consider custom domain

---

## 🆘 Need Help?

### Vercel Support
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: support@vercel.com (Pro plan)

### Project Issues
- Check browser console (F12)
- Review Vercel build logs
- Test locally first
- Create GitHub issue

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Vercel CLI Docs**: https://vercel.com/docs/cli
- **Create React App**: https://create-react-app.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Happy Deploying! 🎊**
