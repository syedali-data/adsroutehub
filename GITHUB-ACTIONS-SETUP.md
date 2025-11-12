# 🤖 Auto-Deploy with GitHub Actions (Private Repo)

This setup lets you keep your repo **private** while getting **automatic deployments** to Netlify on every push!

---

## 🎯 What You Get

- ✅ **Auto-deploy** on every push to `main`
- ✅ **Preview deployments** for pull requests
- ✅ **Keep repo private** (no cost!)
- ✅ **Deploy notifications** on commits & PRs
- ✅ **Same as Netlify's GitHub integration**

---

## 🔧 Setup Steps (5 minutes)

### Step 1: Get Netlify Credentials

#### 1.1 Get Your Netlify Auth Token

```powershell
# In your terminal
netlify status
```

Look for the site ID in the output, or run:

```powershell
# Get your site ID
netlify sites:list
```

**Your site ID:** `231d4f64-58ef-43c4-96e8-e0ee3d112cb2`

#### 1.2 Create Personal Access Token

1. Go to https://app.netlify.com/user/applications
2. Click **"New access token"**
3. Give it a name: `GitHub Actions Deploy`
4. Click **"Generate token"**
5. **Copy the token** (you'll only see it once!)

---

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repo: https://github.com/Dev-Workspace007/adsroutehub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**

Add these **4 secrets**:

| Name | Value |
|------|-------|
| `NETLIFY_AUTH_TOKEN` | The token you just created |
| `NETLIFY_SITE_ID` | `231d4f64-58ef-43c4-96e8-e0ee3d112cb2` |
| `VITE_SUPABASE_URL` | `https://zirqonwkfwfjackbtrdy.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |

---

### Step 3: Push the GitHub Actions Workflow

```powershell
# Add the workflow file
git add .github/workflows/deploy-netlify.yml
git commit -m "chore: add GitHub Actions auto-deploy"
git push origin main
```

---

### Step 4: Watch It Deploy! 🎉

1. Go to your repo on GitHub
2. Click the **"Actions"** tab
3. You'll see the deployment running!
4. When it completes, your site is updated automatically

---

## 🔄 How It Works Now

### Automatic Workflow

```
You make changes
     ↓
git push origin main
     ↓
GitHub Actions triggers
     ↓
Builds your app
     ↓
Deploys to Netlify
     ↓
✅ Site updated!
```

**No manual `netlify deploy` needed anymore!**

---

## 🌿 Pull Request Previews

When you create a pull request:

1. GitHub Actions builds a **preview version**
2. Posts a comment on the PR with the preview URL
3. You can test changes before merging
4. Merging to `main` = auto-deploy to production

---

## 📊 Comparison

| Method | Auto-Deploy | Private Repo | Cost | Setup |
|--------|------------|--------------|------|-------|
| **CLI (Current)** | ❌ Manual | ✅ Yes | FREE | Done ✅ |
| **GitHub Actions** | ✅ Auto | ✅ Yes | FREE | 5 min |
| **Public + Netlify** | ✅ Auto | ❌ No | FREE | 2 min |

---

## 🎯 My Recommendation

**Set up GitHub Actions!** You get:
- ✅ Best of both worlds
- ✅ Keep repo private
- ✅ Auto-deploy convenience
- ✅ 100% FREE

The setup I provided is ready to go - just add the 4 secrets and push!

---

## 🔍 View Deployment Logs

### In GitHub:
1. Go to **Actions** tab
2. Click on any workflow run
3. See build logs

### In Netlify:
1. Go to your site dashboard
2. Click **Deploys**
3. See deployment history

---

## 🐛 Troubleshooting

### Deployment fails with "Unauthorized"
- Check `NETLIFY_AUTH_TOKEN` is correct
- Create a new token and update the secret

### Build fails with environment variable errors
- Ensure all 4 secrets are added to GitHub
- Secret names must match exactly (case-sensitive)

### Site not updating
- Check the Actions tab for errors
- Ensure workflow pushed to `main` branch

---

## ⏸️ Pause Auto-Deploy (Optional)

To temporarily disable auto-deploy:

1. Go to repo → **Settings** → **Actions**
2. Disable workflows
3. Use CLI deployment: `netlify deploy --prod`

---

## 💡 Future Workflow

```powershell
# Your simple workflow now:

# 1. Make changes
# 2. Test locally
npm run dev

# 3. Push to GitHub
git add .
git commit -m "add new feature"
git push

# 4. That's it! GitHub Actions deploys automatically ✨
```

---

**Ready to set this up?** Just follow Steps 1-3 above! 🚀

