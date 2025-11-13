# 🔐 Supabase Keys Collection Checklist

**Project:** ADS RouteHub Production
**Date:** November 13, 2024

---

## ✅ **Keys to Collect (Check off as you go)**

### **1. SUPABASE PROJECT REF**
- [ ] **Where:** Top of your Supabase dashboard URL
- [ ] **Example:** `https://app.supabase.com/project/YOUR_PROJECT_REF`
- [ ] **Your Value:** `___________________________`

---

### **2. SUPABASE_URL (Project URL)**
- [ ] **Where:** Settings → API → "Project URL"
- [ ] **Format:** `https://[project-ref].supabase.co`
- [ ] **Your Value:** `___________________________`

---

### **3. SUPABASE_PUBLISHABLE_KEY (Anon Key)**
- [ ] **Where:** Settings → API → "Project API keys" → "anon" / "public"
- [ ] **Starts with:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] **Your Value:** `___________________________`

---

### **4. SUPABASE_SERVICE_ROLE_KEY** ⚠️ KEEP SECRET
- [ ] **Where:** Settings → API → "Project API keys" → "service_role" (click "Reveal")
- [ ] **Starts with:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] **Your Value:** `___________________________`

---

### **5. SUPABASE_DB_PASSWORD**
- [ ] **Where:** Settings → Database → "Database Password"
- [ ] **Note:** This is the password you set when creating the project
- [ ] **If forgotten:** Click "Reset Database Password"
- [ ] **Your Value:** `___________________________`

---

### **6. SUPABASE_ACCESS_TOKEN** (for CLI/GitHub Actions)
- [ ] **Where:** https://supabase.com/dashboard/account/tokens
- [ ] **Action:** Click "Generate new token"
- [ ] **Name it:** "GitHub Actions CI/CD"
- [ ] **Copy immediately:** (only shown once!)
- [ ] **Your Value:** `___________________________`

---

## 📋 **Keys You Already Have**

### **7. NETLIFY_AUTH_TOKEN**
- [x] Already in GitHub Secrets ✅

### **8. NETLIFY_SITE_ID**
- [x] Already in GitHub Secrets ✅

### **9. VITE_SUPABASE_URL**
- [ ] **Same as #2 above** (SUPABASE_URL)

### **10. VITE_SUPABASE_PUBLISHABLE_KEY**
- [ ] **Same as #3 above** (SUPABASE_PUBLISHABLE_KEY)

---

## 🔐 **External API Keys**

### **11. RESEND_API_KEY**
- [ ] **Where:** https://resend.com/api-keys
- [ ] **Already configured in Lovable?** Check if you have this
- [ ] **Your Value:** `___________________________`

### **12. TWILIO_ACCOUNT_SID**
- [ ] **Where:** https://console.twilio.com/
- [ ] **Location:** Dashboard → Account Info
- [ ] **Your Value:** `___________________________`

### **13. TWILIO_AUTH_TOKEN**
- [ ] **Where:** https://console.twilio.com/
- [ ] **Location:** Dashboard → Account Info (click "Reveal")
- [ ] **Your Value:** `___________________________`

### **14. TWILIO_FROM_NUMBER**
- [ ] **Where:** Twilio Console → Phone Numbers
- [ ] **Format:** `+1234567890` (with country code)
- [ ] **Your Value:** `___________________________`

### **15. LEAD_INTAKE_API_KEY** (Custom)
- [ ] **Option A:** Use existing from Lovable backend
- [ ] **Option B:** Generate new secure string
- [ ] **Example:** `routehub_intake_2024_secure_abc123xyz`
- [ ] **Your Value:** `___________________________`

---

## 🎯 **Quick Collection Order**

**Do these in order for fastest collection:**

1. **In Supabase Dashboard:**
   - Settings → API → Copy all 3 keys (URL, anon, service_role)
   - Settings → Database → Confirm/reset password
   - Account → Tokens → Generate new token

2. **In Resend Dashboard:**
   - API Keys → Copy your key

3. **In Twilio Dashboard:**
   - Dashboard → Copy SID, Auth Token, Phone Number

4. **Create Custom:**
   - Lead Intake API Key (make up a secure string)

---

## 📤 **After Collection - Add to GitHub**

1. Go to: https://github.com/Dev-Workspace007/adsroutehub/settings/secrets/actions
2. Click "New repository secret" for each key
3. Use these EXACT names (case-sensitive):

```
SUPABASE_PROJECT_REF
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY (not VITE_SUPABASE_PUBLISHABLE_KEY)
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD
SUPABASE_ACCESS_TOKEN
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
LEAD_INTAKE_API_KEY
```

---

## ⏱️ **Estimated Time:** 10-15 minutes

---

**Ready? Start with #1 and work your way down!** ✅

