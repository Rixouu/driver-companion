-- Trigger function to handle automatic status transitions
CREATE OR REPLACE FUNCTION handle_dispatch_status_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is changed, update related data
  IF OLD.status != NEW.status THEN
    -- Log the status change
    RAISE NOTICE 'Dispatch status changed from % to % for booking %', OLD.status, NEW.status, NEW.booking_id;
    
    -- If status is changed to in_transit, ensure it's visible across the system
    IF NEW.status = 'in_transit' THEN
      -- Update the booking status to reflect the trip is in transit
      UPDATE bookings 
      SET status = 'confirmed', 
          updated_at = NOW()
      WHERE id = NEW.booking_id;
      
      RAISE NOTICE 'Updated booking % status to confirmed for in_transit dispatch', NEW.booking_id;
    END IF;
    
    -- If status is changed to completed, update the booking status too
    IF NEW.status = 'completed' THEN
      UPDATE bookings 
      SET status = 'completed',
          updated_at = NOW()
      WHERE id = NEW.booking_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the dispatch_entries table
DROP TRIGGER IF EXISTS trigger_dispatch_status_updates ON public.dispatch_entries;
CREATE TRIGGER trigger_dispatch_status_updates
AFTER UPDATE ON public.dispatch_entries
FOR EACH ROW
EXECUTE FUNCTION handle_dispatch_status_updates();

-- Add an explicit index for performance
CREATE INDEX IF NOT EXISTS idx_dispatch_entries_booking_id_status 
ON public.dispatch_entries(booking_id, status); 