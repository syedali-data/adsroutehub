-- Fix PUBLIC_DATA_EXPOSURE: Restrict audit_logs and rejections to admin-only access

-- Drop overly permissive policies that allow any authenticated user to view sensitive data
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can view rejections" ON public.rejections;

-- Create admin-only policies for audit_logs
CREATE POLICY "Admins view all audit logs"
  ON public.audit_logs 
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create admin-only policies for rejections
CREATE POLICY "Admins view all rejections"
  ON public.rejections 
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));