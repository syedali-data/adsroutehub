# 🚀 Deploy to Netlify CLI (Private Repo - FREE)

This method lets you deploy from a **private GitHub repo for free** by deploying directly from your local machine.

---

## 📋 Prerequisites

- ✅ Node.js installed
- ✅ Netlify account (free)
- ✅ Local copy of this repo

---

## 🎯 One-Time Setup

### Step 1: Install Netlify CLI

```powershell
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```powershell
netlify login
```

This opens your browser to authenticate.

---

## 🚀 Deploy Your Site

### Option A: Use the PowerShell Script (Easiest)

```powershell
# Run the automated deployment script
.\deploy-to-netlify.ps1
```

### Option B: Manual Commands

```powershell
# 1. Build the project
npm run build

# 2. Deploy to Netlify
netlify deploy --prod --dir=dist
```

**On first deploy:**
- Choose **"Create & configure a new site"**
- Select your team
- Enter site name: `adsroutehub` (or any name)
- It will deploy!

---

## 🔧 Add Environment Variables

After first deploy, add environment variables:

### Method 1: Via Netlify Dashboard
1. Go to your site in https://app.netlify.com
2. **Site settings** → **Environment variables**
3. Add:
   ```
   VITE_SUPABASE_URL=https://zirqonwkfwfjackbtrdy.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

### Method 2: Via CLI
```powershell
netlify env:set VITE_SUPABASE_URL "https://zirqonwkfwfjackbtrdy.supabase.co"
netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY "your-anon-key"
```

---

## 🔄 Future Deployments

Every time you want to deploy updates:

```powershell
# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

Or just run:
```powershell
.\deploy-to-netlify.ps1
```

---

## 🤖 Setup Continuous Deployment (Optional)

Want auto-deploy on git push (while keeping repo private)?

### Use GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
        run: npm run build
        
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**Setup:**
1. Get Netlify auth token: `netlify login` then get token from `~/.netlify/config.json`
2. Get site ID: Run `netlify status` or find in Netlify dashboard
3. Add to GitHub repo secrets:
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

Now every push to `main` auto-deploys! 🎉

---

## 💡 Comparison: CLI vs Public Repo

| Feature | CLI Deploy | Public Repo |
|---------|------------|-------------|
| Cost | ✅ FREE | ✅ FREE |
| Private repo | ✅ Yes | ❌ No |
| Auto-deploy on push | ❌ Manual* | ✅ Automatic |
| Preview deployments | ❌ No | ✅ Yes |
| Rollback | ✅ Yes | ✅ Yes |
| Setup complexity | ⚠️ Medium | ✅ Easy |

*Can add GitHub Actions for auto-deploy

---

## 🆘 Troubleshooting

### "netlify command not found"
```powershell
# Reinstall globally
npm install -g netlify-cli

# Or use npx
npx netlify-cli deploy --prod --dir=dist
```

### Build fails
```powershell
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment variables not working
- Variables must be added in Netlify dashboard
- Redeploy after adding variables
- Variables need `VITE_` prefix for Vite apps

---

## ✅ Success!

Your site is now deployed from a **private repo for FREE**! 🎉

**Site URL:** Check output or run `netlify status`

No GitHub connection needed - keep your repo private! 🔒

