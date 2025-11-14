# 🔧 **GitHub Actions Deployment Fix Guide**

**Goal:** Enable GitHub Actions to fully deploy the 6-tier routing system automatically

**Current Issue:** Supabase access token lacks organization-level permissions for CLI operations

**Status:** ⏳ Needs fixes before deployment can work

---

## 🚨 **THE PROBLEM**

Based on the knowledge base, the current issue is:

```
Error: "Your account does not have the necessary privileges"
Location: Supabase CLI operations in GitHub Actions
Cause: Access token doesn't have organization-level permissions
```

---

## ✅ **THE SOLUTION (Step-by-Step)**

### **STEP 1: Generate New Supabase Access Token with Proper Permissions** (5 minutes)

#### **Current Credentials (from Knowledge Base):**
- **Project URL:** `https://umlfhlqnnohmtlwsytkn.supabase.co`
- **Project Ref:** `umlfhlqnnohmtlwsytkn`
- **Organization:** basetrial02's Org

#### **Action Required:**

1. **Go to Supabase Account Tokens:**
   - URL: https://supabase.com/dashboard/account/tokens
   - Make sure you're logged in as the account owner

2. **Delete Old Token (if exists):**
   - Look for any token named "GitHub Actions" or similar
   - Click "Delete" to remove it

3. **Generate New Token:**
   - Click **"Generate new token"**
   - **Name:** `GitHub Actions - Full Permissions`
   - **Scopes:** Make sure ALL of these are selected:
     - ✅ Read access to projects
     - ✅ Write access to projects
     - ✅ Read access to organizations
     - ✅ Write access to organizations
     - ✅ Manage functions
     - ✅ Manage secrets
     - ✅ Manage database
   - Click **"Generate token"**
   - **COPY THE TOKEN IMMEDIATELY** (you'll only see it once!)

4. **Save Token:**
   - Copy to clipboard
   - Save somewhere safe temporarily (will add to GitHub in next step)

---

### **STEP 2: Update ALL GitHub Secrets** (10 minutes)

**Go to:** https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions

**Required Secrets (Update/Add Each):**

#### **Supabase Keys (NEW INSTANCE):**

| Secret Name | Value | Source |
|-------------|-------|--------|
| `SUPABASE_PROJECT_REF` | `umlfhlqnnohmtlwsytkn` | Your new Supabase project |
| `SUPABASE_URL` | `https://umlfhlqnnohmtlwsytkn.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_ACCESS_TOKEN` | (new token from Step 1) | Just generated in Step 1 |
| `SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbGZobHFubm9obXRsd3N5dGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMTE1ODUsImV4cCI6MjA3ODU4NzU4NX0.uZs3rnGRXI0_ubCCyXopjJmdS5kHbGp9m1X1dNyO0iM` | From knowledge base |
| `SUPABASE_SERVICE_ROLE_KEY` | (get from Supabase) | Dashboard → Settings → API → service_role (click Reveal) |
| `SUPABASE_DB_PASSWORD` | `Mali@5786` | From knowledge base |

#### **Vite Environment Variables (for Frontend):**

| Secret Name | Value | Same As |
|-------------|-------|---------|
| `VITE_SUPABASE_URL` | `https://umlfhlqnnohmtlwsytkn.supabase.co` | Same as SUPABASE_URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (same as SUPABASE_PUBLISHABLE_KEY) | Same as above |

#### **External API Keys:**

| Secret Name | Value | Source |
|-------------|-------|--------|
| `RESEND_API_KEY` | `re_W7a2mAvM_KLdtG8NTjY1VU8nQCAbjzTfr` | From knowledge base |
| `LEAD_INTAKE_API_KEY` | `routehub_intake_2024_Mali5786_secure_xyz789` | From knowledge base |
| `TWILIO_ACCOUNT_SID` | (if using SMS) | Twilio Dashboard |
| `TWILIO_AUTH_TOKEN` | (if using SMS) | Twilio Dashboard |
| `TWILIO_PHONE_NUMBER` | (if using SMS) | Twilio Dashboard |

#### **Netlify (Already Configured):**

| Secret Name | Status |
|-------------|--------|
| `NETLIFY_AUTH_TOKEN` | ✅ Already configured |
| `NETLIFY_SITE_ID` | ✅ Already configured |

---

### **STEP 3: Verify Workflow File** (2 minutes)

The workflow file `.github/workflows/deploy-complete-system.yml` exists and looks good. Let's verify it's configured correctly:

**Check these points:**
- ✅ Triggers on push to `main` branch
- ✅ Deploys database migrations
- ✅ Deploys Edge Functions
- ✅ Deploys frontend to Netlify
- ✅ Runs automated tests
- ✅ Uses correct Supabase project ref

**File is already created and configured correctly!** ✅

---

### **STEP 4: Test Deployment Manually** (15 minutes)

Once all secrets are updated, test the deployment:

#### **Option A: Trigger via Git Push**

```bash
# Make a small change to trigger deployment
echo "# Testing GitHub Actions - $(date)" >> .github/test-deployment.txt

# Commit and push
git add .
git commit -m "Test: GitHub Actions deployment with new Supabase token"
git push origin main
```

#### **Option B: Manual Workflow Trigger**

1. Go to: https://github.com/Dev-Workspace007/adsroutehub/actions
2. Click **"Deploy Complete System"** workflow
3. Click **"Run workflow"** button
4. Select branch: `main`
5. Check "Run automated tests": ✅
6. Click **"Run workflow"**

---

### **STEP 5: Monitor Deployment** (5-10 minutes)

Watch the deployment in real-time:

1. **Go to Actions:** https://github.com/Dev-Workspace007/adsroutehub/actions
2. **Click on running workflow**
3. **Watch each job:**
   - 🗄️ Deploy Database Migrations (1-2 min)
   - 🚀 Deploy Edge Functions (2-3 min)
   - 🎨 Deploy Frontend to Netlify (2-3 min)
   - 🧪 Run Automated Tests (1-2 min)
   - ✅ Notify Success (10 sec)

**Expected Total Time:** 5-10 minutes

---

## 🎯 **SUCCESS CRITERIA**

You'll know it's working when you see:

### **✅ All Jobs Complete Successfully**

```
✅ Deploy Database Migrations
✅ Deploy Edge Functions  
✅ Deploy Frontend to Netlify
✅ Run Automated Tests
✅ Notify Deployment Success
```

### **✅ Success Message**

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

### **✅ Verification in Supabase**

1. Go to: https://app.supabase.com/project/umlfhlqnnohmtlwsytkn
2. Click **"Edge Functions"**
3. Should see:
   - ✅ `lead-intake` (deployed)
   - ✅ Last deployed: Just now

---

## 🚨 **TROUBLESHOOTING**

### **Issue 1: "Missing secrets" Error**

**Symptoms:**
```
Error: Required secret not found: SUPABASE_ACCESS_TOKEN
```

**Fix:**
1. Go to GitHub → Settings → Secrets → Actions
2. Verify ALL secrets from Step 2 are present
3. Click "Update" on any that look wrong
4. Re-run workflow

---

### **Issue 2: "Supabase connection failed"**

**Symptoms:**
```
Error: Failed to link to Supabase project
Error: Your account does not have the necessary privileges
```

**Fix:**
1. Generate NEW access token (Step 1)
2. Make sure ALL organization permissions are checked
3. Update `SUPABASE_ACCESS_TOKEN` in GitHub
4. Re-run workflow

---

### **Issue 3: "Edge Functions deployment failed"**

**Symptoms:**
```
Error: Failed to deploy function: lead-intake
Error: Compilation error in router-v2.ts
```

**Fix:**
1. Check the error message in GitHub Actions logs
2. Usually a TypeScript error in the function code
3. Fix the error locally
4. Push to main again (will re-deploy)

---

### **Issue 4: "Database migration failed"**

**Symptoms:**
```
Error: Failed to run migrations
Error: Database connection failed
```

**Fix:**
1. Verify `SUPABASE_DB_PASSWORD` is correct: `Mali@5786`
2. Verify `SUPABASE_PROJECT_REF` is correct: `umlfhlqnnohmtlwsytkn`
3. Check if database is paused (go to Supabase dashboard, click "Resume")
4. Re-run workflow

---

## 📊 **WHAT GETS DEPLOYED**

### **Database Migrations:**
- `supabase/migrations/000_complete_initial_schema.sql`
- `supabase/migrations/002_seed_ontario_cities_fixed.sql`
- `supabase/migrations/003_add_missing_buyer_columns.sql` (if exists)
- `supabase/migrations/004_add_all_missing_buyer_columns.sql` (if exists)

### **Edge Functions:**
- `supabase/functions/_shared/router-v2.ts` → `router.ts` (copied during deploy)
- `supabase/functions/lead-intake/index-v2.ts` → `index.ts` (copied during deploy)
- `supabase/functions/unlock-delivery/index.ts`
- `supabase/functions/test-lead-routing/index.ts`

### **Frontend:**
- Complete React app built with Vite
- Deployed to Netlify
- Connected to new Supabase instance

---

## 🎉 **AFTER SUCCESSFUL DEPLOYMENT**

### **Immediate Verification:**

1. **Test the App:**
   - Go to: https://starlit-gecko-dae065.netlify.app
   - Login as admin
   - Check dashboard loads

2. **Test Edge Functions:**
   ```bash
   curl -X POST "https://umlfhlqnnohmtlwsytkn.supabase.co/functions/v1/lead-intake" \
     -H "Content-Type: application/json" \
     -H "x-api-key: routehub_intake_2024_Mali5786_secure_xyz789" \
     -d '{
       "name": "Test Lead",
       "email": "test@example.com",
       "phone": "+14165551234",
       "city": "toronto",
       "service_type": "plumbing",
       "exclusivity": "shared"
     }'
   ```

3. **Check Routing Audit:**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM routing_audit 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### **Future Deployments:**

Now that it's working, every push to `main` will automatically:
1. Deploy database changes
2. Deploy Edge Function updates
3. Deploy frontend updates
4. Run tests
5. Notify you of success/failure

**Time per deployment:** 5-10 minutes (fully automated)
**Your time:** 0 minutes (just push code!)

---

## 📋 **QUICK CHECKLIST**

Before testing deployment, verify:

- [ ] Generated new Supabase access token with ALL permissions
- [ ] Updated `SUPABASE_ACCESS_TOKEN` in GitHub secrets
- [ ] Updated `SUPABASE_PROJECT_REF` to `umlfhlqnnohmtlwsytkn`
- [ ] Updated `SUPABASE_URL` to new instance
- [ ] Updated `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Verified all other secrets are present
- [ ] Workflow file exists: `.github/workflows/deploy-complete-system.yml`
- [ ] Ready to test deployment!

---

## 🚀 **READY TO DEPLOY?**

Once all secrets are updated:

```bash
# Option 1: Push a test change
echo "# Test deployment - $(date)" >> .github/test.txt
git add .
git commit -m "Test: Complete system deployment"
git push origin main

# Option 2: Manual trigger in GitHub Actions UI
# Go to: https://github.com/Dev-Workspace007/adsroutehub/actions
# Click "Deploy Complete System" → "Run workflow"
```

**Then watch:** https://github.com/Dev-Workspace007/adsroutehub/actions

**Expected duration:** 5-10 minutes

**Result:** ✅ Complete 6-tier routing system deployed automatically!

---

## 📞 **NEED HELP?**

**Common Issues:**
- Token permissions → Regenerate with ALL scopes checked
- Missing secrets → Double-check all secrets in GitHub
- Deployment fails → Check logs in GitHub Actions

**Files to Check:**
- `.github/workflows/deploy-complete-system.yml` - Workflow config
- `supabase/functions/_shared/router-v2.ts` - 6-tier router
- `supabase/functions/lead-intake/index-v2.ts` - Main function

---

**🎉 Once this works, you'll have a fully automated deployment pipeline!**

**Every push to main = Complete system deployed in 5-10 minutes!**

