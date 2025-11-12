# 🚀 Deploying ADS RouteHub to Netlify

## Prerequisites

Before deploying, ensure you have:
- ✅ A GitHub account with this repository
- ✅ A Netlify account (sign up at https://netlify.com)
- ✅ Supabase project credentials (or create a new one)

---

## 📋 Pre-Deployment Checklist

### 1. **Secure Your Environment Variables**

First, remove the `.env` file from git tracking:

```bash
git rm --cached .env
git add .gitignore .env.example netlify.toml _redirects DEPLOYMENT.md
git commit -m "chore: prepare for Netlify deployment

- Remove .env from git tracking
- Add Netlify configuration
- Add deployment documentation"
git push origin main
```

### 2. **Set Up Supabase** (if not already done)

**Option A: Use Lovable's Managed Supabase**
- Your current credentials should work as-is
- URL: `https://zirqonwkfwfjackbtrdy.supabase.co`
- Anon Key: Already in your local `.env`

**Option B: Create Your Own Supabase Project**
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `adsroutehub` (or any name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)
5. Get your credentials:
   - Go to **Project Settings** → **API**
   - Copy `URL` and `anon/public` key
6. Apply database migrations:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Push migrations
   supabase db push
   ```

---

## 🌐 Deploy to Netlify

### Method 1: Deploy via Netlify UI (Recommended for First Time)

#### Step 1: Connect Repository

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Authorize Netlify to access your GitHub
5. Search for and select **`adsroutehub`** repository

#### Step 2: Configure Build Settings

Netlify should auto-detect these (verify they match):

- **Base directory**: *(leave empty)*
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Branch**: `main`

#### Step 3: Add Environment Variables

Click **"Add environment variables"** and add:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

**Important:** Use your actual Supabase credentials!

#### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait 2-3 minutes for build to complete
3. Your site will be live at: `https://random-name-123456.netlify.app`

#### Step 5: Configure Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain: `adsroutehub.com`
4. Follow DNS configuration instructions
5. SSL will be automatically provisioned

---

### Method 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Follow prompts:
# - Create & configure a new site
# - Choose your team
# - Site name: adsroutehub (or any name)
# - Build command: npm run build
# - Publish directory: dist

# Add environment variables
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY "your-anon-key"

# Deploy
netlify deploy --prod
```

---

## 🔧 Post-Deployment Configuration

### 1. **Update Supabase URLs**

If you're using your own Supabase project, update these URLs in your Supabase dashboard:

**Authentication Settings** → **URL Configuration**:
- **Site URL**: `https://your-netlify-site.netlify.app`
- **Redirect URLs**: 
  - `https://your-netlify-site.netlify.app/**`
  - `http://localhost:8080/**` (for local dev)

### 2. **Configure Supabase Edge Functions**

Your edge functions need environment variables too:

Go to **Supabase Dashboard** → **Edge Functions** → **Settings**:

```bash
RESEND_API_KEY=your-resend-api-key
LEAD_INTAKE_API_KEY=your-lead-intake-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 3. **Deploy Edge Functions**

```bash
# Deploy all edge functions
supabase functions deploy lead-intake
supabase functions deploy unlock-delivery
supabase functions deploy test-sms
supabase functions deploy test-lead-routing
```

### 4. **Test Your Deployment**

1. Visit your Netlify URL
2. Try logging in (use magic link authentication)
3. Test creating a lead
4. Verify email notifications work
5. Check that routing functions properly

---

## 🔐 Environment Variables Reference

### Client-Side (Netlify)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ Yes | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | ✅ Yes | `eyJhbGci...` |

### Server-Side (Supabase Edge Functions)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SUPABASE_URL` | Same as client URL | ✅ Yes | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | ✅ Yes | Get from Supabase dashboard |
| `SUPABASE_ANON_KEY` | Same as VITE_SUPABASE_PUBLISHABLE_KEY | ✅ Yes | `eyJhbGci...` |
| `RESEND_API_KEY` | Resend email API key | ✅ Yes | Get from resend.com |
| `LEAD_INTAKE_API_KEY` | Custom API key for lead intake | ✅ Yes | Generate a random secure string |
| `ALLOW_TEST_SEND_TO_OWNER` | Allow test Resend key (dev only) | ❌ No | `false` |

---

## 🎯 Continuous Deployment

Netlify will automatically:
- ✅ Build and deploy on every push to `main` branch
- ✅ Create preview deployments for pull requests
- ✅ Rollback to previous versions if needed
- ✅ Provide SSL certificates automatically

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module '@/components/...'"**
- **Solution**: Path aliases are already configured in `vite.config.ts`

**Error: "Environment variable undefined"**
- **Solution**: Add environment variables in Netlify dashboard

### Runtime Issues

**Error: "Failed to fetch" or CORS errors**
- **Solution**: Check Supabase URL configuration includes your Netlify domain

**Authentication not working**
- **Solution**: Add your Netlify URL to Supabase redirect URLs

**Edge functions not responding**
- **Solution**: Deploy edge functions and verify environment variables are set

### Performance Issues

**Slow initial load**
- **Solution**: Netlify automatically uses CDN, but you can enable:
  - Asset optimization
  - Split chunks (already enabled in Vite)
  - Lazy loading routes

---

## 📊 Monitoring

### Netlify Analytics (Optional)

Enable in **Site settings** → **Analytics**:
- Page views
- Unique visitors
- Top pages
- Build performance

### Supabase Analytics

Monitor in **Supabase Dashboard**:
- Database size
- API requests
- Edge function invocations
- Active connections

---

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# Make your changes
git add .
git commit -m "your changes"
git push origin main

# Netlify auto-deploys!
```

### Manual Redeploy

In Netlify dashboard:
1. Go to **Deploys**
2. Click **Trigger deploy** → **Deploy site**

### Rollback

In Netlify dashboard:
1. Go to **Deploys**
2. Find previous working deploy
3. Click **"Publish deploy"**

---

## 💰 Costs

### Free Tier Limits

**Netlify Free Plan:**
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ SSL certificates
- ✅ Continuous deployment

**Supabase Free Plan:**
- ✅ 500 MB database
- ✅ 2 GB file storage
- ✅ 50,000 monthly active users
- ✅ 2 million Edge Function invocations

**Both services are free for small-medium traffic!**

---

## 📞 Support

- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: Create an issue in your GitHub repo

---

## ✅ Deployment Complete Checklist

- [ ] `.env` removed from git
- [ ] Netlify site created and deployed
- [ ] Environment variables configured in Netlify
- [ ] Supabase credentials working
- [ ] Edge functions deployed to Supabase
- [ ] Site URL added to Supabase redirect URLs
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Authentication tested
- [ ] Lead routing tested
- [ ] Email notifications tested

**Your ADS RouteHub is now live! 🎉**

