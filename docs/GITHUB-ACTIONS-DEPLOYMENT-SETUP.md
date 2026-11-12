# 🚀 **GitHub Actions Deployment Setup Guide**

**Automatic deployment of the complete 6-tier routing system via GitHub Actions**

---

## 📋 **WHAT THIS DOES**

When you push to the `main` branch, GitHub Actions will automatically:

1. ✅ **Deploy database migrations** to Supabase
2. ✅ **Deploy Edge Functions** (6-tier routing) to Supabase
3. ✅ **Deploy frontend** to Netlify
4. ✅ **Run automated tests** to verify everything works
5. ✅ **Notify you** of success or failure

**Total deployment time:** ~5-10 minutes (fully automated)

---

## 🔧 **SETUP INSTRUCTIONS**

### **Step 1: Get Supabase Access Token**

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate new token"**
3. Name it: `GitHub Actions Deployment`
4. Copy the token (you'll only see it once!)

**Save this as:** `SUPABASE_ACCESS_TOKEN`

---

### **Step 2: Get Supabase Project Reference**

1. Go to your Supabase dashboard
2. Click on your project
3. Go to **Settings** → **General**
4. Find **"Reference ID"** (looks like: `zirqonwkfwfjackbtrdy`)
5. Copy it

**Save this as:** `SUPABASE_PROJECT_REF`

---

### **Step 3: Get Netlify Credentials** (Already have these)

You already have these from previous setup:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

---

### **Step 4: Add All Secrets to GitHub**

1. Go to your GitHub repository: `Dev-Workspace007/adsroutehub`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each:

**Required Secrets:**

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `SUPABASE_ACCESS_TOKEN` | (from Step 1) | Supabase Dashboard → Account → Tokens |
| `SUPABASE_PROJECT_REF` | `zirqonwkfwfjackbtrdy` | Supabase Dashboard → Settings → General |
| `NETLIFY_AUTH_TOKEN` | (already have) | Netlify Dashboard |
| `NETLIFY_SITE_ID` | (already have) | Netlify Dashboard |
| `VITE_SUPABASE_URL` | `https://zirqonwkfwfjackbtrdy.supabase.co` | Supabase Dashboard |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` | Supabase Dashboard → Settings → API |
| `RESEND_API_KEY` | `re_...` | Resend Dashboard |
| `LEAD_INTAKE_API_KEY` | (your custom key) | Your settings |
| `TWILIO_ACCOUNT_SID` | (if using SMS) | Twilio Dashboard |
| `TWILIO_AUTH_TOKEN` | (if using SMS) | Twilio Dashboard |
| `TWILIO_PHONE_NUMBER` | (if using SMS) | Twilio Dashboard |

---

### **Step 5: Enable GitHub Actions**

1. In your repository, go to **Settings** → **Actions** → **General**
2. Under **"Actions permissions"**, select:
   - ✅ **"Allow all actions and reusable workflows"**
3. Click **"Save"**

---

### **Step 6: Test the Workflow**

**Option A: Push to main branch**

```bash
# Make a small change (e.g., update README)
echo "# Testing GitHub Actions" >> README.md

# Commit and push
git add .
git commit -m "Test GitHub Actions deployment"
git push origin main
```

**Option B: Manual trigger**

1. Go to **Actions** tab in GitHub
2. Click **"Deploy Complete System"** workflow
3. Click **"Run workflow"** button
4. Select branch: `main`
5. Click **"Run workflow"**

---

### **Step 7: Monitor Deployment**

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the progress in real-time:
   - 🗄️ Deploy Database Migrations
   - 🚀 Deploy Edge Functions
   - 🎨 Deploy Frontend
   - 🧪 Run Automated Tests
   - ✅ Notify Success

**Expected duration:** 5-10 minutes

---

## 📊 **WORKFLOW STRUCTURE**

```
GitHub Push (main branch)
         │
         ▼
┌─────────────────────────────────────────────┐
│  JOB 1: Deploy Database Migrations          │
│  • Link to Supabase                         │
│  • Run migrations                           │
│  • Verify success                           │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  JOB 2: Deploy Edge Functions               │
│  • Prepare router-v2.ts                     │
│  • Deploy lead-intake function              │
│  • Deploy other functions                   │
│  • Set environment secrets                  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  JOB 3: Deploy Frontend (Netlify)           │
│  • Build React app                          │
│  • Deploy to Netlify                        │
│  • Verify deployment                        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  JOB 4: Run Automated Tests                 │
│  • Health checks                            │
│  • Database verification                    │
│  • Test lead routing                        │
│  • Test summary                             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  JOB 5: Notify Success ✅                   │
│  • Deployment complete                      │
│  • System operational                       │
│  • Optional: Slack/Email notification       │
└─────────────────────────────────────────────┘
```

---

## 🎯 **WHAT GETS DEPLOYED**

### **On Every Push to Main:**

✅ **Database Changes** (if any)
- New migrations in `supabase/migrations/`
- Automatic schema updates

✅ **Edge Functions** (if changed)
- router-v2.ts → router.ts
- index-v2.ts → index.ts
- All 6-tier routing logic
- Environment variables updated

✅ **Frontend** (if changed)
- React application rebuilt
- Deployed to Netlify
- New UI components

✅ **Tests**
- Health checks
- Sample lead routing
- Verification queries

---

## ✅ **SUCCESS INDICATORS**

When deployment succeeds, you'll see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPLETE SYSTEM DEPLOYMENT SUCCESSFUL! ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Deployed components:
• Database migrations (Supabase)
• Edge Functions with 6-tier routing (Supabase)
• Frontend application (Netlify)

System Status: 🟢 OPERATIONAL

🎉 Zero-waste lead routing is now LIVE across all Ontario!
```

---

## 🚨 **TROUBLESHOOTING**

### **Issue: "Missing secrets" error**

**Cause:** Required secrets not set in GitHub

**Fix:**
1. Go to repository Settings → Secrets → Actions
2. Verify all secrets from Step 4 are added
3. Re-run workflow

---

### **Issue: "Supabase connection failed"**

**Cause:** Invalid `SUPABASE_ACCESS_TOKEN`

**Fix:**
1. Generate new token: https://supabase.com/dashboard/account/tokens
2. Update secret in GitHub
3. Re-run workflow

---

### **Issue: "Edge Functions deployment failed"**

**Cause:** Syntax error in function code

**Fix:**
1. Check GitHub Actions logs for specific error
2. Fix the error in your code
3. Push to main again (auto-deploys)

---

### **Issue: "Tests failed"**

**Cause:** System not ready or test data issue

**Fix:**
1. Wait 1-2 minutes for deployment to stabilize
2. Re-run workflow manually
3. If still fails, check Supabase logs

---

## 📝 **MANUAL DEPLOYMENT (If Needed)**

If GitHub Actions fails, you can still deploy manually:

**Database:**
```bash
supabase link --project-ref zirqonwkfwfjackbtrdy
supabase db push
```

**Edge Functions:**
```bash
supabase functions deploy lead-intake
```

**Frontend:**
```bash
npm run build
netlify deploy --prod
```

---

## 🎯 **RECOMMENDED WORKFLOW**

### **For Development:**

1. Create a new branch: `git checkout -b feature/new-feature`
2. Make changes
3. Test locally
4. Push to branch: `git push origin feature/new-feature`
5. Create Pull Request
6. After review, merge to `main`
7. **GitHub Actions automatically deploys!** 🎉

### **For Hotfixes:**

1. Make urgent fix
2. Commit: `git commit -m "Hotfix: description"`
3. Push to main: `git push origin main`
4. **Deploys automatically in ~5 minutes**
5. Monitor GitHub Actions tab

---

## 📊 **MONITORING AFTER DEPLOYMENT**

After GitHub Actions completes:

**Check Supabase Logs:**
1. Dashboard → Logs → Edge Functions
2. Look for `[Router V2]` entries
3. Verify tiers are being used

**Check Netlify:**
1. Dashboard → Site
2. Verify new deployment is live
3. Test frontend in browser

**Check Routing Performance:**
```sql
SELECT 
  tier_used,
  COUNT(*) as lead_count,
  AVG(execution_time_ms) as avg_time
FROM routing_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY tier_used;
```

---

## 🎉 **BENEFITS OF GITHUB ACTIONS**

✅ **Automatic Deployment**
- No manual steps required
- Push to main = automatic deploy
- Consistent deployment process

✅ **Built-in Testing**
- Every deployment is tested
- Catch issues early
- Rollback if tests fail

✅ **Version Control**
- Every deployment tracked
- Easy to see what changed
- Easy to rollback if needed

✅ **Time Savings**
- Manual deployment: 2-3 hours
- GitHub Actions: 5-10 minutes
- **Save 1.5-2.5 hours per deployment!**

✅ **Reliability**
- Same process every time
- No human error
- Automated verification

---

## 🚀 **READY TO USE**

Your GitHub Actions workflow is now set up!

**Next time you need to deploy:**

1. Make your changes
2. Commit: `git commit -m "Your changes"`
3. Push: `git push origin main`
4. **Done!** GitHub Actions handles everything else

**Monitor progress:**
- Go to GitHub → Actions tab
- Watch real-time deployment
- Get notified when complete

---

## 📞 **GETTING HELP**

**GitHub Actions Documentation:**
- https://docs.github.com/en/actions

**Supabase CLI Documentation:**
- https://supabase.com/docs/guides/cli

**Workflow File Location:**
- `.github/workflows/deploy-complete-system.yml`

**Need to modify the workflow?**
- Edit the YAML file
- Push changes
- GitHub Actions will use new version

---

## ✅ **SETUP COMPLETE!**

You now have:
- ✅ Automatic database deployments
- ✅ Automatic Edge Function deployments
- ✅ Automatic frontend deployments
- ✅ Automatic testing
- ✅ Notifications on success/failure

**Total setup time:** ~15 minutes  
**Time saved per deployment:** 1.5-2.5 hours  
**Deployment frequency:** As often as you want!

---

**🎉 Your complete system now deploys automatically via GitHub Actions!** 🚀

**Just push to main and let GitHub Actions handle everything!**

