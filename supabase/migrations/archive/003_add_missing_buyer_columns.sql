-- ============================================================================
-- Add Missing Buyer Columns
-- ============================================================================
-- These columns exist in the original Lovable schema but were missing
-- from our initial migration
-- ============================================================================

ALTER TABLE buyers 
ADD COLUMN IF NOT EXISTS daily_sent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS shared_cap integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS free_leads_left integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate decimal(5, 2) DEFAULT 0;

-- Add index for daily_sent (used for tracking daily delivery counts)
CREATE INDEX IF NOT EXISTS idx_buyers_daily_sent ON buyers(daily_sent);

-- Add comment
COMMENT ON COLUMN buyers.daily_sent IS 'Number of leads sent to this buyer today';
COMMENT ON COLUMN buyers.shared_cap IS 'Maximum shared leads per day';
COMMENT ON COLUMN buyers.free_leads_left IS 'Number of free leads remaining';
COMMENT ON COLUMN buyers.response_rate IS 'Buyer response rate (0-100%)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added missing buyer columns successfully!';
END $$;


