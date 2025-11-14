-- Fix leads table RLS to prevent customer data exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON public.leads;

-- Admins can do everything with leads
CREATE POLICY "Admins manage all leads"
  ON public.leads
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Buyers can only view leads that were delivered to them
CREATE POLICY "Buyers view their delivered leads"
  ON public.leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      JOIN buyer_users bu ON bu.buyer_id = d.buyer_id
      WHERE d.lead_id = leads.id
        AND bu.id = auth.uid()
    )
  );