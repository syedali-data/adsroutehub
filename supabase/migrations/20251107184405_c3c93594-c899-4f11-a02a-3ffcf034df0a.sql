-- Add structured refund data columns to refund_requests table
ALTER TABLE public.refund_requests 
ADD COLUMN reason_category text,
ADD COLUMN requested_by text,
ADD COLUMN requested_by_details text,
ADD COLUMN refund_scope text,
ADD COLUMN refund_amount numeric;