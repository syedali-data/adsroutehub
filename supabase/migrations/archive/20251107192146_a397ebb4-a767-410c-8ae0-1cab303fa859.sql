-- Add partial unique index to prevent multiple active refund requests per delivery
CREATE UNIQUE INDEX refund_requests_one_active_per_delivery
ON refund_requests (delivery_id)
WHERE status IN ('pending', 'approved');

-- Add refund window days setting with default of 14 days
INSERT INTO settings (key, value, description)
VALUES (
  'REFUND_WINDOW_DAYS',
  '14',
  'Number of days after delivery creation within which refund requests can be submitted'
)
ON CONFLICT (key) DO NOTHING;