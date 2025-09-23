-- Fix quotation status - set to approved if approved_at exists
UPDATE quotations 
SET status = 'approved' 
WHERE id = '8677fc05-006a-4287-923c-43341c83f8a7' 
AND approved_at IS NOT NULL
AND status = 'sent';

-- Also fix any other quotations that have approved_at but wrong status
UPDATE quotations 
SET status = 'approved' 
WHERE approved_at IS NOT NULL 
AND status = 'sent';
