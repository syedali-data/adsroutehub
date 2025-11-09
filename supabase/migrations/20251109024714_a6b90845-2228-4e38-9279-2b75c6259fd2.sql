-- Add RLS policy to allow users to SELECT from buyers table if their email matches
-- This allows first-time buyer login to work (they can find their buyer record by email)
CREATE POLICY "Users can view buyers with matching email"
ON public.buyers
FOR SELECT
TO authenticated
USING (
  lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);