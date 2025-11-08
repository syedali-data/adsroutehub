-- Create a security definer function to check if buyer email exists
-- This allows login validation without exposing buyer data
CREATE OR REPLACE FUNCTION public.buyer_email_exists(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.buyers
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(_email))
  );
$$;