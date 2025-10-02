-- Clean up email partials - keep only PDF document partials (quotation and invoice)
-- Email partials should remain in the existing @email-partials.ts system

-- Remove email-specific partials that were mistakenly added
DELETE FROM partial_templates WHERE name LIKE '%Email%';

-- Keep only the original PDF template partials:
-- - Japan Quotation Header
-- - Thailand Invoice Footer  
-- - Universal Header
-- And any other PDF document partials (quotation/invoice headers and footers)
