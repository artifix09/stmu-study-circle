-- Fix RLS policy to allow service role to create notifications for users
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Service role can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);