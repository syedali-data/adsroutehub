-- CRITICAL: Fix settings table - prevent buyers from accessing system configuration
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.settings;

CREATE POLICY "Admins only manage settings"
  ON public.settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Fix buyers table - prevent competitor data exposure
DROP POLICY IF EXISTS "Authenticated users can manage buyers" ON public.buyers;

CREATE POLICY "Admins manage all buyers"
  ON public.buyers FOR ALL
  USING (has_role(auth.uid(), 'admin'));
-- Note: buyer_can_view_own_buyer and buyer_can_update_own_buyer policies already exist and are good

-- Fix deliveries table
DROP POLICY IF EXISTS "Authenticated users can manage deliveries" ON public.deliveries;

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
-- Note: buyer_can_view_own_deliveries policy already exists for SELECT

-- Fix campaigns table
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON public.campaigns;

CREATE POLICY "Admins manage campaigns"
  ON public.campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "All can view campaigns"
  ON public.campaigns FOR SELECT
  USING (true);
-- Campaigns must be publicly readable for lead-intake function

-- Fix refund_requests table
DROP POLICY IF EXISTS "Authenticated users can manage refund requests" ON public.refund_requests;

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

-- Fix Stripe tables - admin only access
DROP POLICY IF EXISTS "Authenticated users can manage Stripe charges" ON public.stripe_charges;
DROP POLICY IF EXISTS "Authenticated users can manage Stripe customers" ON public.stripe_customers;
DROP POLICY IF EXISTS "Authenticated users can manage Stripe subscriptions" ON public.stripe_subscriptions;

CREATE POLICY "Admins manage stripe_charges"
  ON public.stripe_charges FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage stripe_customers"
  ON public.stripe_customers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage stripe_subscriptions"
  ON public.stripe_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));