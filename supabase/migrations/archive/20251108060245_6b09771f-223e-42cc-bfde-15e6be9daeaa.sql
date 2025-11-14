-- Security hardening: Fix RLS policies on all sensitive tables

-- Settings table (CRITICAL)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins only manage settings" ON public.settings;
  DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.settings;
END $$;

CREATE POLICY "Admins only manage settings"
  ON public.settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Buyers table
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins manage all buyers" ON public.buyers;
  DROP POLICY IF EXISTS "Authenticated users can manage buyers" ON public.buyers;
END $$;

CREATE POLICY "Admins manage all buyers"
  ON public.buyers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Deliveries table
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins manage all deliveries" ON public.deliveries;
  DROP POLICY IF EXISTS "Authenticated users can manage deliveries" ON public.deliveries;
  DROP POLICY IF EXISTS "Buyers update own deliveries" ON public.deliveries;
END $$;

CREATE POLICY "Admins manage all deliveries"
  ON public.deliveries FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers update own deliveries"
  ON public.deliveries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM buyer_users
      WHERE buyer_users.buyer_id = deliveries.buyer_id
        AND buyer_users.id = auth.uid()
    )
  );

-- Campaigns table
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins manage campaigns" ON public.campaigns;
  DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON public.campaigns;
  DROP POLICY IF EXISTS "All can view campaigns" ON public.campaigns;
END $$;

CREATE POLICY "Admins manage campaigns"
  ON public.campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "All can view campaigns"
  ON public.campaigns FOR SELECT
  USING (true);

-- Refund requests table
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins manage refund requests" ON public.refund_requests;
  DROP POLICY IF EXISTS "Authenticated users can manage refund requests" ON public.refund_requests;
  DROP POLICY IF EXISTS "Buyers view own refund requests" ON public.refund_requests;
END $$;

CREATE POLICY "Admins manage refund requests"
  ON public.refund_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers view own refund requests"
  ON public.refund_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buyer_users
      WHERE buyer_users.buyer_id = refund_requests.buyer_id
        AND buyer_users.id = auth.uid()
    )
  );

-- Stripe tables
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins manage stripe_charges" ON public.stripe_charges;
  DROP POLICY IF EXISTS "Authenticated users can manage Stripe charges" ON public.stripe_charges;
END $$;

CREATE POLICY "Admins manage stripe_charges"
  ON public.stripe_charges FOR ALL
  USING (has_role(auth.uid(), 'admin'));

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins manage stripe_customers" ON public.stripe_customers;
  DROP POLICY IF EXISTS "Authenticated users can manage Stripe customers" ON public.stripe_customers;
END $$;

CREATE POLICY "Admins manage stripe_customers"
  ON public.stripe_customers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins manage stripe_subscriptions" ON public.stripe_subscriptions;
  DROP POLICY IF EXISTS "Authenticated users can manage Stripe subscriptions" ON public.stripe_subscriptions;
END $$;

CREATE POLICY "Admins manage stripe_subscriptions"
  ON public.stripe_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));