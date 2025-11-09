-- Drop and recreate the admin policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Admins manage all buyers" ON public.buyers;

-- Create policy with both USING and WITH CHECK for all operations
CREATE POLICY "Admins manage all buyers"
ON public.buyers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));