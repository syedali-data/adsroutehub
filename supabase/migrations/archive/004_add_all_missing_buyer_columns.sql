-- ============================================================================
-- Add ALL Missing Buyer Columns
-- ============================================================================
-- Complete list of columns needed by the AddBuyerDialog form
-- ============================================================================

ALTER TABLE buyers 
-- Identification
ADD COLUMN IF NOT EXISTS external_code text,

-- Service & Pricing
ADD COLUMN IF NOT EXISTS services_csv text,
ADD COLUMN IF NOT EXISTS pricing_mode text DEFAULT 'both' CHECK (pricing_mode IN ('shared', 'exclusive', 'both')),
ADD COLUMN IF NOT EXISTS price_shared numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_exclusive numeric(10, 2) DEFAULT 0,

-- Caps & Limits (if not already added)
ADD COLUMN IF NOT EXISTS daily_sent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS shared_cap integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS free_leads_left integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate decimal(5, 2) DEFAULT 0,

-- SMS Delivery
ADD COLUMN IF NOT EXISTS sms_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_phone text;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_buyers_external_code ON buyers(external_code) WHERE external_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyers_daily_sent ON buyers(daily_sent);
CREATE INDEX IF NOT EXISTS idx_buyers_sms_enabled ON buyers(sms_enabled) WHERE sms_enabled = true;

-- Add comments
COMMENT ON COLUMN buyers.external_code IS 'External identifier for integration';
COMMENT ON COLUMN buyers.services_csv IS 'Comma-separated list of services';
COMMENT ON COLUMN buyers.pricing_mode IS 'Pricing mode: shared, exclusive, or both';
COMMENT ON COLUMN buyers.price_shared IS 'Price for shared leads';
COMMENT ON COLUMN buyers.price_exclusive IS 'Price for exclusive leads';
COMMENT ON COLUMN buyers.daily_sent IS 'Number of leads sent today';
COMMENT ON COLUMN buyers.shared_cap IS 'Maximum shared leads per day';
COMMENT ON COLUMN buyers.free_leads_left IS 'Free leads remaining';
COMMENT ON COLUMN buyers.response_rate IS 'Buyer response rate (0-1)';
COMMENT ON COLUMN buyers.sms_enabled IS 'Enable SMS notifications';
COMMENT ON COLUMN buyers.sms_phone IS 'Phone number for SMS (E.164 format)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL MISSING BUYER COLUMNS ADDED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Buyers table is now fully compatible with the app';
END $$;


