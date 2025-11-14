-- Add SMS fields to buyers table
ALTER TABLE public.buyers 
ADD COLUMN sms_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN sms_phone text NULL;

-- Insert Twilio settings with descriptions
INSERT INTO public.settings (key, value, description) VALUES
  ('ENABLE_SMS_DELIVERY', 'false', 'Global toggle for SMS delivery to buyers (true/false)'),
  ('TWILIO_ACCOUNT_SID', '', 'Twilio Account SID for SMS API'),
  ('TWILIO_AUTH_TOKEN', '', 'Twilio Auth Token for SMS API'),
  ('TWILIO_FROM_NUMBER', '', 'Twilio phone number to send SMS from (E.164 format, e.g. +15551234567)')
ON CONFLICT (key) DO NOTHING;