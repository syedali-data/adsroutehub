-- Create helper function to verify if a user's email matches a buyer
CREATE OR REPLACE FUNCTION public.user_email_matches_buyer(
  _user_id uuid,
  _buyer_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    INNER JOIN public.buyers b ON b.email = u.email
    WHERE u.id = _user_id
      AND b.id = _buyer_id
  )
$$;

-- Allow users to insert their own buyer_users mapping IF their email matches the buyer
CREATE POLICY "Users can create their own buyer mapping if email matches"
ON public.buyer_users
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid() 
  AND public.user_email_matches_buyer(auth.uid(), buyer_id)
);

-- Allow users to insert ONLY 'buyer' role for themselves IF they have a matching buyer
CREATE POLICY "Users can create their own buyer role if they have matching buyer"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'buyer'::app_role
  AND EXISTS (
    SELECT 1
    FROM public.buyers b
    INNER JOIN auth.users u ON u.email = b.email
    WHERE u.id = auth.uid()
  )
);