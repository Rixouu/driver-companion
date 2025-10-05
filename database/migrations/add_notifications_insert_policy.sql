-- Add INSERT policy for notifications table to allow service role to create notifications
CREATE POLICY "Service role can insert notifications" ON notifications
FOR INSERT TO service_role
WITH CHECK (true);

-- Also allow authenticated users to insert notifications (for manual creation)
CREATE POLICY "Authenticated users can insert notifications" ON notifications
FOR INSERT TO authenticated
WITH CHECK (true);
