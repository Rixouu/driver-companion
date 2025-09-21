-- Fix quotation status and test PDF generation
-- 1. Update quotation status to approved since approved_at exists
UPDATE quotations 
SET status = 'approved' 
WHERE id = '8677fc05-006a-4287-923c-43341c83f8a7' 
AND approved_at IS NOT NULL
AND status = 'sent';

-- 2. Add approval activity record
INSERT INTO quotation_activities (
  quotation_id,
  user_id,
  action,
  details,
  created_at
) VALUES (
  '8677fc05-006a-4287-923c-43341c83f8a7',
  '1050a5cd-9caa-4737-b83e-9b4ed69a5cc7',
  'approved',
  '{"notes": "Status corrected - quotation was approved but status not updated", "approved_via": "admin_correction"}',
  NOW()
);

-- 3. Verify the fix
SELECT id, status, quote_number, customer_name, approved_at, approved_by, updated_at 
FROM quotations 
WHERE id = '8677fc05-006a-4287-923c-43341c83f8a7';
