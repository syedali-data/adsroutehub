-- Add claim tracking columns to deliveries table
ALTER TABLE public.deliveries
ADD COLUMN IF NOT EXISTS contacted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS outcome_reason text,
ADD COLUMN IF NOT EXISTS outcome_notes text;

-- Insert claim handler settings
INSERT INTO public.settings (key, value, description)
VALUES 
  ('USE_N8N_CLAIMS', 'false', 'Enable n8n webhook for claim updates'),
  ('N8N_CLAIM_WEBHOOK_URL', '', 'n8n webhook URL for claim handler')
ON CONFLICT (key) DO NOTHING;