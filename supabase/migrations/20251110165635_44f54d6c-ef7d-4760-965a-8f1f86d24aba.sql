-- Add unlock tracking to deliveries table
ALTER TABLE public.deliveries 
ADD COLUMN unlocked boolean NOT NULL DEFAULT false,
ADD COLUMN unlocked_at timestamptz NULL;

-- Create index for faster queries on unlocked status
CREATE INDEX idx_deliveries_unlocked ON public.deliveries(unlocked, buyer_id);

-- Add policy to allow buyers to unlock their own deliveries
CREATE POLICY "Buyers can unlock their own deliveries"
ON public.deliveries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM buyer_users
    WHERE buyer_users.buyer_id = deliveries.buyer_id
    AND buyer_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM buyer_users
    WHERE buyer_users.buyer_id = deliveries.buyer_id
    AND buyer_users.id = auth.uid()
  )
);