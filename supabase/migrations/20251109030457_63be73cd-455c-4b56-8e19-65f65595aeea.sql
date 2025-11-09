-- Drop the problematic policy that tries to access auth.users directly
DROP POLICY IF EXISTS "Users can view buyers with matching email" ON public.buyers;

-- Create a safer version that uses auth.jwt() to get email from the JWT token
-- This works because the email is in the JWT payload, not requiring a query to auth.users
CREATE POLICY "Users can view buyers with matching email"
ON public.buyers
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(COALESCE(
    current_setting('request.jwt.claims', true)::json->>'email',
    ''
  ))
);