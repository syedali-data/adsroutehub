-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE lead_status AS ENUM ('new', 'routed', 'delivered', 'refunded', 'rejected', 'archived');
CREATE TYPE buyer_status AS ENUM ('active', 'paused', 'test');
CREATE TYPE pricing_mode AS ENUM ('shared', 'exclusive', 'both');
CREATE TYPE delivery_channel AS ENUM ('email', 'api', 'sms');
CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected', 'auto_approved');
CREATE TYPE campaign_status AS ENUM ('active', 'paused');

-- Campaigns table
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    service_type TEXT NOT NULL,
    city TEXT NOT NULL,
    status campaign_status NOT NULL DEFAULT 'active'
);

-- Buyers table
CREATE TABLE public.buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    external_code TEXT,
    business_name TEXT NOT NULL,
    city TEXT NOT NULL,
    email TEXT NOT NULL,
    services_csv TEXT NOT NULL,
    pricing_mode pricing_mode NOT NULL DEFAULT 'both',
    price_shared NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_exclusive NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shared_cap INTEGER NOT NULL DEFAULT 3,
    daily_cap INTEGER NOT NULL DEFAULT 10,
    daily_sent INTEGER NOT NULL DEFAULT 0,
    free_leads_left INTEGER NOT NULL DEFAULT 0,
    response_rate NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    status buyer_status NOT NULL DEFAULT 'active'
);

-- Leads table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    campaign_id UUID REFERENCES public.campaigns(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    service_type TEXT NOT NULL,
    budget_raw TEXT,
    notes TEXT,
    exclusivity pricing_mode NOT NULL DEFAULT 'shared',
    price_per_buyer NUMERIC(10, 2) NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'website-form',
    hash_24h TEXT,
    status lead_status NOT NULL DEFAULT 'new'
);

-- Deliveries table
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id),
    channel delivery_channel NOT NULL DEFAULT 'email',
    charge_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    won BOOLEAN NOT NULL DEFAULT FALSE,
    refunded BOOLEAN NOT NULL DEFAULT FALSE,
    refund_reason TEXT,
    refund_ts TIMESTAMPTZ,
    source TEXT NOT NULL DEFAULT 'internal'
);

-- Refund requests table
CREATE TABLE public.refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.buyers(id),
    reason TEXT NOT NULL,
    status refund_status NOT NULL DEFAULT 'pending',
    auto_decision BOOLEAN NOT NULL DEFAULT FALSE,
    handled_by TEXT,
    handled_ts TIMESTAMPTZ
);

-- Rejections / fraud logs table
CREATE TABLE public.rejections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT NOT NULL,
    ip_address TEXT,
    payload JSONB
);

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type TEXT NOT NULL,
    metadata JSONB
);

-- Stripe customers table
CREATE TABLE public.stripe_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    current_plan TEXT
);

-- Stripe subscriptions table
CREATE TABLE public.stripe_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stripe_customer_id TEXT REFERENCES public.stripe_customers(stripe_customer_id),
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    stripe_price_id TEXT,
    trial_end TIMESTAMPTZ
);

-- Stripe charges table
CREATE TABLE public.stripe_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_id UUID REFERENCES public.deliveries(id),
    buyer_id UUID REFERENCES public.buyers(id),
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
);

-- Settings table for n8n integration and other configs
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT
);

-- Insert default settings for n8n integration
INSERT INTO public.settings (key, value, description) VALUES
    ('USE_N8N_ROUTER', 'false', 'Enable/disable n8n router webhook'),
    ('N8N_ROUTER_WEBHOOK_URL', '', 'n8n webhook URL for lead routing'),
    ('USE_N8N_REFUNDS', 'false', 'Enable/disable n8n refund webhook'),
    ('N8N_REFUND_WEBHOOK_URL', '', 'n8n webhook URL for refund processing'),
    ('ENABLE_STRIPE_BILLING', 'false', 'Enable/disable Stripe billing');

-- Create indexes for performance
CREATE INDEX idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_hash_24h ON public.leads(hash_24h);
CREATE INDEX idx_buyers_city ON public.buyers(city);
CREATE INDEX idx_buyers_status ON public.buyers(status);
CREATE INDEX idx_deliveries_lead_id ON public.deliveries(lead_id);
CREATE INDEX idx_deliveries_buyer_id ON public.deliveries(buyer_id);
CREATE INDEX idx_deliveries_created_at ON public.deliveries(created_at);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin access (authenticated users can do everything for now)
CREATE POLICY "Authenticated users can manage campaigns" ON public.campaigns FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage buyers" ON public.buyers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage leads" ON public.leads FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage deliveries" ON public.deliveries FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage refund requests" ON public.refund_requests FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view rejections" ON public.rejections FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage Stripe customers" ON public.stripe_customers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage Stripe subscriptions" ON public.stripe_subscriptions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage Stripe charges" ON public.stripe_charges FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage settings" ON public.settings FOR ALL USING (auth.uid() IS NOT NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for settings table
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();