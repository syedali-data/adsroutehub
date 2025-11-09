-- Add claim_status enum type
CREATE TYPE claim_status AS ENUM ('new', 'contacted', 'won', 'lost');

-- Add claim_status column to deliveries table
ALTER TABLE public.deliveries
ADD COLUMN claim_status claim_status NOT NULL DEFAULT 'new';

-- Migrate existing data based on current claim fields
UPDATE public.deliveries
SET claim_status = CASE
  WHEN won = true THEN 'won'::claim_status
  WHEN won = false AND (closed_at IS NOT NULL OR outcome_reason IS NOT NULL OR outcome_notes IS NOT NULL) THEN 'lost'::claim_status
  WHEN claimed = true AND contacted_at IS NOT NULL THEN 'contacted'::claim_status
  ELSE 'new'::claim_status
END;

-- Clean up bad data: deliveries marked as lost but with no actual claim data
UPDATE public.deliveries
SET claim_status = 'new'::claim_status,
    claimed = false,
    won = false
WHERE claim_status = 'lost'
  AND contacted_at IS NULL
  AND closed_at IS NULL
  AND outcome_reason IS NULL
  AND outcome_notes IS NULL;

-- Update default value for won column to NULL instead of false
ALTER TABLE public.deliveries
ALTER COLUMN won DROP DEFAULT;

-- Create index for better query performance
CREATE INDEX idx_deliveries_claim_status ON public.deliveries(claim_status);