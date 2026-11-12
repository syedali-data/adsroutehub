# ✅ **GitHub Secrets Verification Checklist**

**Last Updated:** November 14, 2024  
**Purpose:** Verify all required secrets are set in GitHub for automated deployment

---

## 🔐 **REQUIRED SECRETS (15 Total)**

Go to: https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions

**Verify each secret exists and has the correct value:**

---

### **1. Supabase Core (6 secrets)**

| # | Secret Name | Expected Value/Format | Status |
|---|-------------|----------------------|--------|
| 1 | `SUPABASE_PROJECT_REF` | `umlfhlqnnohmtlwsytkn` | ⬜ |
| 2 | `SUPABASE_URL` | `https://umlfhlqnnohmtlwsytkn.supabase.co` | ⬜ |
| 3 | `SUPABASE_ACCESS_TOKEN` | `sbp_...` (from account tokens page) | ⬜ |
| 4 | `SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` (anon key) | ⬜ |
| 5 | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (service_role key) | ⬜ |
| 6 | `SUPABASE_DB_PASSWORD` | `Mali@5786` | ⬜ |

---

### **2. Vite Environment (2 secrets)**

| # | Secret Name | Expected Value/Format | Status |
|---|-------------|----------------------|--------|
| 7 | `VITE_SUPABASE_URL` | `https://umlfhlqnnohmtlwsytkn.supabase.co` | ⬜ |
| 8 | `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as #4 above | ⬜ |

---

### **3. External APIs (4 secrets)**

| # | Secret Name | Expected Value/Format | Status |
|---|-------------|----------------------|--------|
| 9 | `RESEND_API_KEY` | `re_W7a2mAvM_KLdtG8NTjY1VU8nQCAbjzTfr` | ⬜ |
| 10 | `LEAD_INTAKE_API_KEY` | `routehub_intake_2024_Mali5786_secure_xyz789` | ⬜ |
| 11 | `TWILIO_ACCOUNT_SID` | `AC...` (optional for SMS) | ⬜ |
| 12 | `TWILIO_AUTH_TOKEN` | (optional for SMS) | ⬜ |

---

### **4. Netlify (2 secrets)** ✅ Already Configured

| # | Secret Name | Expected Value/Format | Status |
|---|-------------|----------------------|--------|
| 13 | `NETLIFY_AUTH_TOKEN` | (already set) | ✅ |
| 14 | `NETLIFY_SITE_ID` | `231d4f64-58ef-43c4-96e8-e0ee3d112cb2` | ✅ |

---

### **5. Optional (1 secret)**

| # | Secret Name | Expected Value/Format | Status |
|---|-------------|----------------------|--------|
| 15 | `TWILIO_PHONE_NUMBER` | `+1234567890` (if using SMS) | ⬜ |

---

## 🎯 **CRITICAL: SUPABASE_ACCESS_TOKEN**

**This is the most important secret that's currently causing deployment failures.**

### **How to Generate (Step-by-Step):**

1. **Go to:** https://supabase.com/dashboard/account/tokens

2. **Delete old token if exists:**
   - Look for "GitHub Actions" or similar
   - Click "Delete"

3. **Click:** "Generate new token"

4. **Settings:**
   - **Name:** `GitHub Actions - Full Deployment`
   - **Scopes:** Select ALL of these ✅
     - Read access to projects
     - Write access to projects
     - Read access to organizations
     - Write access to organizations
     - Manage functions
     - Manage secrets
     - Manage database

5. **Click:** "Generate token"

6. **COPY IMMEDIATELY** (only shown once!)

7. **Add to GitHub:**
   - Go to: https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions
   - Click "New repository secret" (or "Update" if exists)
   - Name: `SUPABASE_ACCESS_TOKEN`
   - Value: (paste the token)
   - Click "Add secret"

---

## 📋 **WHERE TO GET EACH VALUE**

### **Supabase Keys:**

**Go to:** https://app.supabase.com/project/umlfhlqnnohmtlwsytkn/settings/api

1. **SUPABASE_URL:**
   - Section: "Project URL"
   - Copy the full URL

2. **SUPABASE_PUBLISHABLE_KEY:**
   - Section: "Project API keys"
   - Find: "anon" / "public"
   - Click "Copy"

3. **SUPABASE_SERVICE_ROLE_KEY:**
   - Section: "Project API keys"
   - Find: "service_role"
   - Click "Reveal" → "Copy"
   - ⚠️ KEEP SECRET - Never commit to git

---

### **Database Password:**

**Option A:** Use existing password: `Mali@5786`

**Option B:** Reset password:
1. Go to: https://app.supabase.com/project/umlfhlqnnohmtlwsytkn/settings/database
2. Click "Reset database password"
3. Generate new password
4. Update secret in GitHub

---

### **External APIs:**

**Resend API Key:**
- Already known: `re_W7a2mAvM_KLdtG8NTjY1VU8nQCAbjzTfr`
- Or get new: https://resend.com/api-keys

**Lead Intake API Key:**
- Custom key (make up a secure string)
- Current: `routehub_intake_2024_Mali5786_secure_xyz789`
- Or generate new random string

**Twilio (Optional):**
- Dashboard: https://console.twilio.com/
- Copy: Account SID, Auth Token, Phone Number

---

## 🧪 **TEST IF SECRETS ARE WORKING**

### **Option 1: Minimal Test Deployment**

```bash
# Make a tiny change
echo "# Test - $(date)" >> .github/test.txt

# Commit and push
git add .
git commit -m "Test: Verify GitHub Actions secrets"
git push origin main

# Watch: https://github.com/Dev-Workspace007/adsroutehub/actions
```

### **Option 2: Manual Workflow Trigger**

1. Go to: https://github.com/Dev-Workspace007/adsroutehub/actions
2. Click "Deploy Complete System"
3. Click "Run workflow" button
4. Select branch: `main`
5. Click "Run workflow"
6. Watch the jobs run

---

## ✅ **SUCCESS INDICATORS**

### **If Secrets are Correct:**

You'll see all jobs complete:
- ✅ Deploy Database Migrations (1-2 min)
- ✅ Deploy Edge Functions (2-3 min)
- ✅ Deploy Frontend (2-3 min)
- ✅ Run Tests (1-2 min)
- ✅ Notify Success (10 sec)

### **If Secrets are Missing/Wrong:**

You'll see errors like:
- ❌ "Required secret not found: SUPABASE_ACCESS_TOKEN"
- ❌ "Failed to link to Supabase project"
- ❌ "Your account does not have the necessary privileges"
- ❌ "Database connection failed"

**Fix:** Update the problematic secret and re-run workflow

---

## 🎯 **QUICK ACTION PLAN**

**Do this in order:**

1. **[ ] Generate NEW Supabase Access Token** (5 min)
   - https://supabase.com/dashboard/account/tokens
   - Select ALL permission scopes
   - Copy token

2. **[ ] Update GitHub Secret: SUPABASE_ACCESS_TOKEN** (1 min)
   - https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions
   - Click "Update" on existing or "New repository secret"
   - Paste new token

3. **[ ] Verify Other Supabase Secrets** (3 min)
   - Check SUPABASE_PROJECT_REF = `umlfhlqnnohmtlwsytkn`
   - Check SUPABASE_URL = `https://umlfhlqnnohmtlwsytkn.supabase.co`
   - Check SUPABASE_PUBLISHABLE_KEY (anon key)
   - Check VITE_* versions match

4. **[ ] Verify External API Keys** (2 min)
   - Check RESEND_API_KEY
   - Check LEAD_INTAKE_API_KEY
   - Check Twilio keys (if using SMS)

5. **[ ] Test Deployment** (10 min)
   - Push small change OR manually trigger workflow
   - Watch GitHub Actions
   - Verify all jobs pass

---

## 📊 **ESTIMATED TIME**

- **Collecting all keys:** 10-15 minutes
- **Adding to GitHub:** 5-10 minutes
- **Testing deployment:** 10 minutes
- **Total:** 25-35 minutes

---

## 🚨 **MOST COMMON ISSUE**

**95% of deployment failures are due to:**

**SUPABASE_ACCESS_TOKEN missing organization permissions**

**Fix:**
1. Generate NEW token
2. Check ALL permission boxes (especially organization access)
3. Update in GitHub
4. Re-run deployment

---

## 🎉 **AFTER SECRETS ARE VERIFIED**

Once all secrets are correct:

✅ **Push to main = Automatic deployment**  
✅ **5-10 minute deployment time**  
✅ **No manual steps needed**  
✅ **Complete system deployed automatically**  

---

**Ready to verify your secrets? Start with #1 (SUPABASE_ACCESS_TOKEN)!**

