-- Fix quotation total amounts by recalculating from quotation_items
-- This migration addresses the database synchronization issue for quotation totals

-- First, create a function to recalculate quotation totals
CREATE OR REPLACE FUNCTION recalculate_quotation_totals()
RETURNS void AS $$
DECLARE
    quotation_record RECORD;
    calculated_amount NUMERIC DEFAULT 0;
    calculated_total NUMERIC DEFAULT 0;
    discount_amount NUMERIC DEFAULT 0;
    tax_amount NUMERIC DEFAULT 0;
    subtotal_amount NUMERIC DEFAULT 0;
BEGIN
    -- Loop through all quotations that have items
    FOR quotation_record IN 
        SELECT DISTINCT q.id, q.discount_percentage, q.tax_percentage
        FROM quotations q
        INNER JOIN quotation_items qi ON q.id = qi.quotation_id
    LOOP
        -- Calculate base amount from quotation items
        SELECT COALESCE(SUM(qi.total_price), 0)
        INTO calculated_amount
        FROM quotation_items qi
        WHERE qi.quotation_id = quotation_record.id;
        
        -- Calculate discount amount
        discount_amount := calculated_amount * COALESCE(quotation_record.discount_percentage, 0) / 100;
        
        -- Calculate subtotal after discount
        subtotal_amount := calculated_amount - discount_amount;
        
        -- Calculate tax amount
        tax_amount := subtotal_amount * COALESCE(quotation_record.tax_percentage, 0) / 100;
        
        -- Calculate final total
        calculated_total := subtotal_amount + tax_amount;
        
        -- Update the quotation with calculated amounts
        UPDATE quotations 
        SET 
            amount = calculated_amount,
            total_amount = calculated_total,
            updated_at = NOW()
        WHERE id = quotation_record.id
        AND (amount != calculated_amount OR total_amount != calculated_total);
        
        -- Log the update
        RAISE NOTICE 'Updated quotation % - Amount: % -> %, Total: % -> %', 
            quotation_record.id, 
            (SELECT amount FROM quotations WHERE id = quotation_record.id), 
            calculated_amount,
            (SELECT total_amount FROM quotations WHERE id = quotation_record.id), 
            calculated_total;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the recalculation
SELECT recalculate_quotation_totals();

-- Create a trigger function to automatically update quotation totals when items change
CREATE OR REPLACE FUNCTION update_quotation_totals_trigger()
RETURNS TRIGGER AS $$
DECLARE
    calculated_amount NUMERIC DEFAULT 0;
    calculated_total NUMERIC DEFAULT 0;
    discount_amount NUMERIC DEFAULT 0;
    tax_amount NUMERIC DEFAULT 0;
    subtotal_amount NUMERIC DEFAULT 0;
    quotation_discount NUMERIC DEFAULT 0;
    quotation_tax NUMERIC DEFAULT 0;
BEGIN
    -- Get quotation discount and tax percentages
    SELECT COALESCE(discount_percentage, 0), COALESCE(tax_percentage, 0)
    INTO quotation_discount, quotation_tax
    FROM quotations
    WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);
    
    -- Calculate base amount from all quotation items
    SELECT COALESCE(SUM(qi.total_price), 0)
    INTO calculated_amount
    FROM quotation_items qi
    WHERE qi.quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id);
    
    -- Calculate discount amount
    discount_amount := calculated_amount * quotation_discount / 100;
    
    -- Calculate subtotal after discount
    subtotal_amount := calculated_amount - discount_amount;
    
    -- Calculate tax amount
    tax_amount := subtotal_amount * quotation_tax / 100;
    
    -- Calculate final total
    calculated_total := subtotal_amount + tax_amount;
    
    -- Update the quotation with calculated amounts
    UPDATE quotations 
    SET 
        amount = calculated_amount,
        total_amount = calculated_total,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS quotation_items_update_totals ON quotation_items;

-- Create trigger on quotation_items table
CREATE TRIGGER quotation_items_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON quotation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quotation_totals_trigger();

-- Add comment
COMMENT ON FUNCTION recalculate_quotation_totals() IS 'Recalculates quotation totals from quotation_items to fix synchronization issues';
COMMENT ON FUNCTION update_quotation_totals_trigger() IS 'Trigger function to automatically update quotation totals when items change';

-- Clean up the one-time function (optional)
-- DROP FUNCTION IF EXISTS recalculate_quotation_totals(); 