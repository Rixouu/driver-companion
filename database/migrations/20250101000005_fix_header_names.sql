-- Fix header names to be clearer - add "PDF" to make it obvious these are for PDF documents
UPDATE partial_templates 
SET name = CASE 
  WHEN name = 'Japan Invoice Header' THEN 'Japan Invoice PDF Header'
  WHEN name = 'Thailand Invoice Header' THEN 'Thailand Invoice PDF Header'
  WHEN name = 'Japan Quotation Header' THEN 'Japan Quotation PDF Header'
  WHEN name = 'Universal Header' THEN 'Universal Quotation PDF Header'
END
WHERE name IN ('Japan Invoice Header', 'Thailand Invoice Header', 'Japan Quotation Header', 'Universal Header');
