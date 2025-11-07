-- Create buyer_users mapping table
CREATE TABLE IF NOT EXISTS public.buyer_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(buyer_id)
);

-- Enable RLS on buyer_users
ALTER TABLE public.buyer_users ENABLE ROW LEVEL SECURITY;

-- Buyer users can view their own mapping
CREATE POLICY "buyer_users_can_view_own"
  ON public.buyer_users FOR SELECT
  USING (id = auth.uid());

-- RLS policies for buyers table (buyer portal access)
CREATE POLICY "buyer_can_view_own_buyer"
  ON public.buyers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.buyer_users bu
      WHERE bu.id = auth.uid()
        AND bu.buyer_id = buyers.id
    )
  );

CREATE POLICY "buyer_can_update_own_buyer"
  ON public.buyers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.buyer_users bu
      WHERE bu.id = auth.uid()
        AND bu.buyer_id = buyers.id
    )
  );

-- RLS policies for deliveries (buyer portal access)
CREATE POLICY "buyer_can_view_own_deliveries"
  ON public.deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.buyer_users bu
      WHERE bu.id = auth.uid()
        AND deliveries.buyer_id = bu.buyer_id
    )
  );