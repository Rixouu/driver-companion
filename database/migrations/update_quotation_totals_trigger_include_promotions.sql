-- Update quotation totals logic - DISABLE TRIGGER APPROACH
-- This migration disables the automatic trigger and lets the application handle all calculations

-- Drop the existing triggers that interfere with promotion discount calculations
DROP TRIGGER IF EXISTS quotation_items_update_totals ON quotation_items;
DROP TRIGGER IF EXISTS calculate_quotation_total_amount_trigger ON quotations;
DROP TRIGGER IF EXISTS update_quotation_price_trigger ON quotations;

-- Comment: We've disabled the trigger entirely and will handle all quotation total calculations
-- in the application layer to ensure promotion discounts are applied correctly.

-- The trigger function is kept for potential future use but not actively used
CREATE OR REPLACE FUNCTION update_quotation_totals_trigger()
RETURNS TRIGGER AS $$
DECLARE
    calculated_amount NUMERIC DEFAULT 0;
    calculated_total NUMERIC DEFAULT 0;
    discount_amount NUMERIC DEFAULT 0;
    extra_discount NUMERIC DEFAULT 0;
    tax_amount NUMERIC DEFAULT 0;
    subtotal_amount NUMERIC DEFAULT 0;
    quotation_discount NUMERIC DEFAULT 0;
    quotation_tax NUMERIC DEFAULT 0;
    quotation_promotion_discount NUMERIC DEFAULT 0;
    quotation_package_discount NUMERIC DEFAULT 0;
BEGIN
    -- This trigger is currently DISABLED - all calculations handled in application
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON FUNCTION update_quotation_totals_trigger() IS 'DISABLED - Quotation calculations now handled in application layer to ensure correct promotion discount handling';

-- Note: Trigger is intentionally NOT created to allow application-level calculation control
-- If you need to re-enable automatic calculations, uncomment the following:
-- CREATE TRIGGER quotation_items_update_totals
--     AFTER INSERT OR UPDATE OR DELETE ON quotation_items
--     FOR EACH ROW
--     EXECUTE FUNCTION update_quotation_totals_trigger();