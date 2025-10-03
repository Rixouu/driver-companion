# Step-by-Step Guide to Fix Thai and Japanese Character Encoding

## Overview
This guide will help you resolve the Thai and Japanese character encoding issues in your quotations system. The problem is likely occurring at multiple levels, so we'll fix them systematically.

## Step 1: Run the Comprehensive Database Migration

### 1.1 Open Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to the SQL Editor

### 1.2 Run the Migration
Copy and paste the entire contents of this file into the SQL Editor:
```
database/migrations/fix_quotation_character_encoding_comprehensive.sql
```

### 1.3 Verify the Migration
After running the SQL, you should see:
- ✅ Function `clean_quotation_text_comprehensive` created
- ✅ Trigger `quotation_text_comprehensive_cleaning_trigger` created
- ✅ Existing data cleaned
- ✅ Test results showing proper encoding

## Step 2: Test the Character Encoding

### 2.1 Visit the Debug Page
Navigate to: `/encoding-debug`

### 2.2 Use the Character Encoding Test
- Click "Japanese Sample" to test Japanese text
- Click "Thai Sample" to test Thai text
- Verify that the encoded text matches the original

### 2.3 Check Form Encoding
- Type Japanese text in the Japanese input field
- Type Thai text in the Thai input field
- Open browser console to see encoding details

## Step 3: Test with Real Data

### 3.1 Create a Test Quotation
- Go to your quotations page
- Create a new quotation with Japanese/Thai text
- Fill in billing address with Japanese or Thai characters

### 3.2 Check Database Storage
- Verify the text is stored correctly in the database
- Check that no HTML entities appear

### 3.3 Generate PDF
- Generate a quotation PDF
- Verify Japanese/Thai characters display correctly

## Step 4: If Issues Persist

### 4.1 Check Database Connection
Run this SQL to verify encoding:
```sql
SELECT 
  current_setting('server_encoding') as server_encoding,
  current_setting('client_encoding') as client_encoding,
  current_setting('lc_collate') as lc_collate,
  current_setting('lc_ctype') as lc_ctype;
```

Expected result:
- `server_encoding`: UTF8
- `client_encoding`: UTF8

### 4.2 Check for Remaining Issues
Run this to find any remaining encoding problems:
```sql
SELECT * FROM check_quotation_encoding_issues();
```

### 4.3 Verify Trigger is Working
Test the trigger by updating a quotation:
```sql
UPDATE quotations 
SET customer_name = '株式会社ドライバー・タイランド'
WHERE id = 'your-quotation-id';

-- Check if the text was cleaned
SELECT customer_name FROM quotations WHERE id = 'your-quotation-id';
```

## Step 5: Application-Level Fixes

### 5.1 Check Form Components
Ensure your quotation forms use the encoding utilities:
```typescript
import { safeEncodeFormValue, validateFormInput } from '@/lib/utils/form-encoding'

// Use in form inputs
<Input
  value={value}
  onChange={(e) => {
    const safeValue = safeEncodeFormValue(e.target.value);
    setValue(safeValue);
  }}
/>
```

### 5.2 Check PDF Generators
Verify all PDF generation code uses `safeEncodeText`:
```typescript
import { safeEncodeText } from '@/lib/utils/character-encoding'

// Use in HTML generation
`<p>${safeEncodeText(quotation.customer_name)}</p>`
```

### 5.3 Check API Routes
Ensure your API routes handle UTF-8 properly:
```typescript
// In your API route
export async function POST(request: Request) {
  const data = await request.json();
  
  // Clean the data before processing
  const cleanedData = prepareFormDataForSubmission(data);
  
  // Process the cleaned data
  // ...
}
```

## Step 6: Browser and Font Issues

### 6.1 Check Browser Console
- Open developer tools
- Look for encoding-related errors
- Check if fonts are loading properly

### 6.2 Verify Font Loading
Ensure your fonts support Japanese and Thai:
```css
/* In your CSS */
@font-face {
  font-family: 'Noto Sans';
  src: url('/fonts/NotoSansJP-Regular.woff2') format('woff2');
  unicode-range: U+4E00-9FAF, U+3040-309F, U+30A0-30FF, U+0E00-0E7F;
}
```

## Step 7: Testing Checklist

### 7.1 Database Level
- [ ] Migration SQL executed successfully
- [ ] Functions created without errors
- [ ] Triggers created without errors
- [ ] Existing data cleaned
- [ ] New data automatically cleaned

### 7.2 Application Level
- [ ] Forms accept Japanese/Thai input
- [ ] Data stored correctly in database
- [ ] PDF generation works with special characters
- [ ] No HTML entities in stored data
- [ ] Characters display correctly in UI

### 7.3 Browser Level
- [ ] No console errors
- [ ] Fonts load properly
- [ ] Characters render correctly
- [ ] Form submission works

## Common Issues and Solutions

### Issue: Characters still corrupted after migration
**Solution**: Check if the migration actually ran. Look for the functions and triggers in your database.

### Issue: New entries still have encoding problems
**Solution**: Verify the database trigger is working. Test by inserting new data.

### Issue: PDF generation fails with special characters
**Solution**: Check font loading and ensure Puppeteer is properly configured.

### Issue: Form submission corrupts characters
**Solution**: Use the form encoding utilities in your form components.

## Verification Commands

### Check Database Functions
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%quotation%encoding%';
```

### Check Database Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%quotation%encoding%';
```

### Test the Cleaning Function
```sql
SELECT 
  clean_quotation_text_comprehensive('&amp;Test&amp; Company') as test_result,
  clean_quotation_text_comprehensive('株式会社ドライバー') as japanese_test,
  clean_quotation_text_comprehensive('บริษัท ไดรเวอร์') as thai_test;
```

## Final Notes

1. **Run the migration first** - This fixes the database-level issues
2. **Test systematically** - Use the debug page to verify each component
3. **Check the console** - Browser errors often reveal the root cause
4. **Verify triggers** - Ensure automatic cleaning is working
5. **Test with real data** - Create actual quotations with Japanese/Thai text

If you still have issues after following this guide, the problem might be in:
- Database connection configuration
- Font loading issues
- Browser-specific problems
- API route encoding

Use the debug page at `/encoding-debug` to isolate where the problem is occurring.
