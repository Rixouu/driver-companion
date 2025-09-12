-- Migration: Add scheduled notification types for quotation expiry and booking reminders
-- Date: 2025-01-12
-- Description: Extends notification system with scheduled notification types

-- First, drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with all notification types including scheduled ones
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'booking_created',
  'booking_confirmed', 
  'booking_cancelled',
  'booking_completed',
  'booking_reminder_24h',
  'booking_reminder_2h',
  'quotation_created',
  'quotation_sent',
  'quotation_approved',
  'quotation_rejected',
  'quotation_expired',
  'quotation_expiring_24h',
  'quotation_expiring_2h',
  'quotation_converted',
  'payment_received',
  'payment_failed',
  'dispatch_assigned',
  'dispatch_completed',
  'maintenance_due',
  'inspection_due',
  'inspection_completed'
));

-- Create index for scheduled notification queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_lookup 
ON notifications (type, related_id, created_at) 
WHERE type IN ('booking_reminder_24h', 'booking_reminder_2h', 'quotation_expiring_24h', 'quotation_expiring_2h', 'quotation_expired');

-- Create index for quotation expiry queries
CREATE INDEX IF NOT EXISTS idx_quotations_expiry_lookup 
ON quotations (status, expiry_date, converted_to_booking_id) 
WHERE status = 'sent' AND converted_to_booking_id IS NULL;

-- Create index for booking reminder queries
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_lookup 
ON bookings (status, date, time) 
WHERE status IN ('confirmed', 'pending');

-- Add comment to track scheduled notification types
COMMENT ON CONSTRAINT notifications_type_check ON notifications IS 
'Notification types including scheduled reminders for quotations and bookings. Updated 2025-01-12 to include booking_reminder_24h, booking_reminder_2h, quotation_expiring_24h, quotation_expiring_2h';

-- Create a function to clean up old processed notifications (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications 
    WHERE is_read = true 
      AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the cleanup function
COMMENT ON FUNCTION cleanup_old_notifications() IS 
'Cleanup function to remove old read notifications. Can be called periodically to maintain database performance.';

-- Insert test data for development (only if we have test quotations/bookings)
-- This will help test the notification system

-- Migration completed successfully
-- Added scheduled notification types: booking_reminder_24h, booking_reminder_2h, quotation_expiring_24h, quotation_expiring_2h
-- Created performance indexes for scheduled notification queries
