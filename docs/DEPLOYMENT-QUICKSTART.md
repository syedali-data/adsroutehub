# 🚀 **GitHub Actions Deployment - Quick Start**

**Goal:** Get the 6-tier routing system deploying automatically via GitHub Actions

**Time Required:** 30 minutes setup, then 0 minutes per deployment (automated)

---

## 🎯 **THE BIG PICTURE**

Right now you have:
- ✅ Complete 6-tier routing code written
- ✅ GitHub Actions workflow file ready
- ✅ Frontend deploying to Netlify automatically
- ❌ Edge Functions not deploying (permission issue)
- ❌ Database migrations not deploying (permission issue)

**The Fix:** Update one secret (SUPABASE_ACCESS_TOKEN) with proper permissions

**Result:** Complete system deploys automatically on every push to main

---

## ⚡ **3-STEP QUICK FIX**

### **STEP 1: Generate New Supabase Token** (5 minutes)

1. Go to: **https://supabase.com/dashboard/account/tokens**

2. Click **"Generate new token"**

3. **CRITICAL:** Check ALL these boxes ✅
   - Read access to projects
   - Write access to projects
   - **Read access to organizations** ← MUST HAVE
   - **Write access to organizations** ← MUST HAVE
   - Manage functions
   - Manage secrets
   - Manage database

4. **Name it:** `GitHub Actions Full Access`

5. Click **"Generate token"**

6. **COPY IT IMMEDIATELY** (only shown once!)

---

### **STEP 2: Update GitHub Secret** (2 minutes)

1. Go to: **https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions**

2. Find: `SUPABASE_ACCESS_TOKEN`

3. Click **"Update"** (or "New repository secret" if doesn't exist)

4. **Paste the token** from Step 1

5. Click **"Update secret"**

---

### **STEP 3: Test Deployment** (10 minutes)

**Option A: Push a small change**

```bash
# Make a tiny change
echo "# Testing automated deployment" >> .github/deployment-test.txt

# Commit and push
git add .
git commit -m "Test: Automated deployment with new token"
git push origin main
```

**Option B: Manual trigger**

1. Go to: **https://github.com/Dev-Workspace007/adsroutehub/actions**
2. Click **"Deploy Complete System"**
3. Click **"Run workflow"**
4. Click **"Run workflow"** (green button)

---

**Then watch:** https://github.com/Dev-Workspace007/adsroutehub/actions

**You should see:**
- ✅ Deploy Database Migrations (1-2 min)
- ✅ Deploy Edge Functions (2-3 min)  
- ✅ Deploy Frontend (2-3 min)
- ✅ Run Tests (1-2 min)
- ✅ Success! (10 sec)

**Total time:** 5-10 minutes (automated)

---

## 🎉 **SUCCESS = DONE FOREVER**

Once this works, **you never have to deploy manually again!**

**Future deployments:**

```bash
# 1. Make your changes
vim src/components/SomeComponent.tsx

# 2. Commit and push
git add .
git commit -m "Update feature"
git push origin main

# 3. ✅ DONE! GitHub Actions deploys everything automatically
```

**No more:**
- ❌ Running migrations manually
- ❌ Deploying functions manually
- ❌ Building frontend manually
- ❌ Remembering deployment steps

**Just:**
- ✅ Push to main
- ✅ Wait 5-10 minutes
- ✅ Everything is live!

---

## 🚨 **IF IT FAILS**

### **Error: "Your account does not have the necessary privileges"**

**Fix:** Token missing organization permissions

**Action:**
1. Delete the token in Supabase
2. Generate new token
3. **CHECK ALL PERMISSION BOXES** (especially organization access)
4. Update in GitHub
5. Re-run workflow

---

### **Error: "Missing required secret: SUPABASE_ACCESS_TOKEN"**

**Fix:** Secret not added to GitHub

**Action:**
1. Go to: https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SUPABASE_ACCESS_TOKEN`
4. Value: (paste token from Supabase)
5. Click "Add secret"

---

### **Error: "Failed to link to Supabase project"**

**Fix:** Wrong project ref or token

**Action:**
1. Verify `SUPABASE_PROJECT_REF` = `umlfhlqnnohmtlwsytkn`
2. Verify `SUPABASE_ACCESS_TOKEN` is from correct account
3. Make sure you're logged into Supabase as the project owner

---

## 📋 **FULL SECRETS CHECKLIST**

**Quick check - Make sure these exist in GitHub:**

Go to: https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions

**Critical (Must Have):**
- [ ] `SUPABASE_ACCESS_TOKEN` (new token with org permissions)
- [ ] `SUPABASE_PROJECT_REF` = `umlfhlqnnohmtlwsytkn`
- [ ] `SUPABASE_URL` = `https://umlfhlqnnohmtlwsytkn.supabase.co`
- [ ] `VITE_SUPABASE_URL` = same as above
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key)
- [ ] `NETLIFY_AUTH_TOKEN` (already have)
- [ ] `NETLIFY_SITE_ID` (already have)

**Nice to Have:**
- [ ] `RESEND_API_KEY` (for emails)
- [ ] `LEAD_INTAKE_API_KEY` (for webhooks)
- [ ] `TWILIO_*` (for SMS, optional)

**If missing any:** See `check-github-secrets.md` for where to get them

---

## 🎯 **WHAT GETS DEPLOYED**

When you push to main, GitHub Actions automatically deploys:

### **1. Database Changes**
- Any new migration files in `supabase/migrations/`
- Creates tables, indexes, functions
- Seeds data (cities, distances, etc.)

### **2. Edge Functions**
- `supabase/functions/_shared/router-v2.ts` → 6-tier routing logic
- `supabase/functions/lead-intake/index-v2.ts` → Main intake function
- Updates environment secrets
- Restarts functions automatically

### **3. Frontend**
- Builds React app with Vite
- Deploys to Netlify
- Updates environment variables
- Live in ~2-3 minutes

### **4. Tests**
- Health checks (functions responding)
- Sample lead routing
- Database verification
- Fails deployment if tests don't pass

---

## 📊 **TIME COMPARISON**

### **Manual Deployment:**
1. Run database migrations (10 min)
2. Deploy Edge Functions (15 min)
3. Build and deploy frontend (10 min)
4. Test everything (15 min)
5. Debug issues (30 min)

**Total:** 1.5 - 2.5 hours per deployment

### **GitHub Actions (After Setup):**
1. Push to main
2. Wait 5-10 minutes
3. ✅ Done!

**Total:** 5-10 minutes (automated)

**Time Saved:** 1.5 - 2.5 hours per deployment!

**After 10 deployments:**
- Manual: 15-25 hours
- Automated: ~2 hours (including 30 min setup)
- **Saved: 13-23 hours!** 🎉

---

## ✅ **READY TO START?**

**Do these 3 things:**

1. **[ ] Generate new Supabase token** with ALL permissions
   - https://supabase.com/dashboard/account/tokens

2. **[ ] Update SUPABASE_ACCESS_TOKEN in GitHub**
   - https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions

3. **[ ] Test deployment**
   - Push small change OR manual trigger in Actions tab

**Expected result:** Complete system deployed in 5-10 minutes!

---

## 📞 **NEED MORE HELP?**

**Detailed guides:**
- `GITHUB-ACTIONS-FIX-GUIDE.md` - Complete troubleshooting guide
- `check-github-secrets.md` - Verify all secrets
- `DEPLOY-VIA-GITHUB-ACTIONS.md` - Full documentation

**Where to get help:**
- GitHub Actions logs (shows exact error)
- Supabase dashboard logs
- Knowledge base has all credentials

---

## 🎉 **THE GOAL**

**Before:** Manual 2-hour deployments, error-prone, stressful

**After:** Push to main → Coffee break → Everything deployed ☕✅

**Let's make it happen!** Start with Step 1 (generate new token) 🚀

---

**⏱️ Time to start:** 30 minutes  
**⏱️ Time per future deployment:** 0 minutes (automated)  
**🎁 Time saved per deployment:** 1.5-2.5 hours  
**🚀 ROI:** Pays for itself after 1 deployment!

