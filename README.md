# ADS RouteHub

A lead routing platform that automatically sends each incoming service lead to the right local buyers, matching on city, service type, capacity and price. It also tracks deliveries, refunds and revenue.

> **Status:** Working prototype built in November 2025 for Analyticals Data Services. Not currently hosted. See [Run locally](#run-locally).

## What it does

- **Lead intake API:** web forms post leads to a secure endpoint, which checks an API key and validates the input.
- **Automatic routing:** each lead goes to active buyers that match its city and service, taking into account daily caps, shared vs. exclusive leads, response-rate ranking, free-lead credits and per-lead pricing.
- **6-tier fallback routing:** when there is no perfect match, the router tries nearby cities, then related services, then extended capacity, then a 24-hour retry queue, and finally alerts an admin. No lead is wasted.
- **Notifications:** buyers get an email (Resend) and an optional SMS (Twilio) with a link to unlock the lead.
- **Admin dashboard:** KPIs, revenue and delivery charts, buyer performance, campaigns, refunds and settings. A routing test page shows why each buyer would or would not receive a lead.
- **Buyer portal:** buyers sign in to see their leads and deliveries.

## How it works

```
Lead form ──► lead-intake (Supabase Edge Function)
                    │
                    ▼
        Routing engine (router.ts / router-v2.ts)
        city + service match, caps, pricing, fallback tiers
                    │
                    ▼
   deliveries ──► email (Resend) / SMS (Twilio) ──► unlock-delivery
                    │
                    ▼
        Admin dashboard + Buyer portal (React)
```

## Tech stack

| Layer | Tools |
|---|---|
| Front end | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| Back end | Supabase (PostgreSQL, Auth, Edge Functions in Deno) |
| Messaging | Resend (email), Twilio (SMS) |
| Deployment | GitHub Actions to Netlify |

## Project structure

```
src/pages/                    Admin pages, buyer portal, sign-in
src/components/               Dashboard charts, buyer / lead / campaign dialogs
supabase/functions/           lead-intake, unlock-delivery, test-lead-routing, test-sms
supabase/functions/_shared/   Routing engine (router.ts, router-v2.ts)
supabase/migrations/          Database schema: leads, buyers, deliveries, cities, routing audit
docs/                         Build notes, deployment guides, routing flowchart
scripts/                      Deployment and routing test scripts
```

## Run locally

```bash
npm install
cp .env.example .env    # add your Supabase URL, publishable key and project ID
npm run dev
```

The edge functions need a Supabase project with these secrets set: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LEAD_INTAKE_API_KEY` and `RESEND_API_KEY`. Add Twilio credentials if you want SMS.

## How it was built

I started the front end in Lovable (an AI app builder), then extended it in my own commits. Those added the 6-tier fallback routing engine, the Supabase database with Ontario city data, and the GitHub Actions pipeline that deploys to Netlify.
