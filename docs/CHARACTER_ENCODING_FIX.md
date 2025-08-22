# Character Encoding Fix for Japanese and Thai Characters

## Problem Description

Japanese and Thai characters were not displaying properly in quotations, appearing as corrupted text or missing characters. This issue affected:

- Customer names with Japanese/Thai characters
- Company names in billing addresses
- Address fields with local language text
- Tax numbers and other business information

## Root Cause Analysis

The issue was caused by **character encoding problems** during data processing:

1. **HTML Entity Corruption**: Text containing Japanese/Thai characters was being converted to HTML entities (`&amp;`, `&lt;`, etc.)
2. **UTF-8 Encoding Issues**: Characters were not being properly handled during PDF generation
3. **Inconsistent Processing**: Different components handled text encoding differently
4. **Database Storage**: Some characters might have been corrupted during storage/retrieval

## Solution Implemented

### 1. Character Encoding Utility Functions

Created `lib/utils/character-encoding.ts` with comprehensive text processing functions:

```typescript
// Main function for safe text encoding
export function safeEncodeText(text: string | null | undefined): string

// Language detection
export function detectLanguage(text: string): 'en' | 'ja' | 'th' | 'other'

// Character validation
export function containsJapanese(text: string): boolean
export function containsThai(text: string): boolean

// Text cleaning and normalization
export function cleanTextForDatabase(text: string | null | undefined): string | null
export function normalizeText(text: string): string
```

### 2. Updated PDF Generators

Modified all quotation PDF generation components to use the safe encoding function:

- **Main PDF Generator**: `lib/html-pdf-generator.ts`
- **Invoice PDF Generator**: `app/api/quotations/generate-invoice-pdf/route.ts`
- **Client-side Generator**: `components/quotations/quotation-pdf-button.tsx`

### 3. Database Migration

Created `database/migrations/fix_quotation_character_encoding.sql` to:

- Clean existing corrupted data
- Create automatic text cleaning triggers
- Ensure future data is properly encoded

### 4. Test Component

Added `components/quotations/character-encoding-test.tsx` for:

- Testing character encoding functionality
- Debugging encoding issues
- Verifying Japanese/Thai character support

## Files Modified

### Core Files
- `lib/utils/character-encoding.ts` - **NEW** - Character encoding utilities
- `lib/html-pdf-generator.ts` - Updated billing address section
- `app/api/quotations/generate-invoice-pdf/route.ts` - Updated billing address section
- `components/quotations/quotation-pdf-button.tsx` - Updated customer info section

### Database
- `database/migrations/fix_quotation_character_encoding.sql` - **NEW** - Database migration

### Testing
- `components/quotations/character-encoding-test.tsx` - **NEW** - Test component
- `app/character-encoding-test/page.tsx` - **NEW** - Test page

## How the Fix Works

### 1. Text Processing Pipeline

```
Raw Text → HTML Entity Decoding → UTF-8 Validation → Safe Output
```

### 2. HTML Entity Decoding

The `safeEncodeText()` function decodes common HTML entities:

```typescript
// Before: &amp; &lt; &gt; &quot; &#39;
// After:  &   <   >   "   '
```

### 3. Character Range Support

Supports full Unicode ranges for:

- **Japanese**: Hiragana (U+3040-U+309F), Katakana (U+30A0-U+30FF), Kanji (U+4E00-U+9FAF)
- **Thai**: Thai script (U+0E00-U+0E7F)
- **CJK**: Unified Ideographs (U+4E00-U+9FFF)

### 4. Automatic Database Cleaning

Database triggers automatically clean text data:

- Remove null bytes and invalid characters
- Normalize whitespace
- Validate UTF-8 encoding
- Apply consistent formatting

## Usage Examples

### Basic Text Encoding

```typescript
import { safeEncodeText } from '@/lib/utils/character-encoding'

// Japanese company name
const companyName = '株式会社ドライバー・タイランド'
const safeName = safeEncodeText(companyName)
// Result: 株式会社ドライバー・タイランド (properly encoded)

// Thai address
const address = '580/17 ซอยรามคำแหง 39 แขวงวังทองหลาง'
const safeAddress = safeEncodeText(address)
// Result: 580/17 ซอยรามคำแหง 39 แขวงวังทองหลาง (properly encoded)
```

### Language Detection

```typescript
import { detectLanguage, containsJapanese, containsThai } from '@/lib/utils/character-encoding'

const text1 = '株式会社ドライバー'
console.log(detectLanguage(text1)) // 'ja'
console.log(containsJapanese(text1)) // true

const text2 = 'บริษัท ไดรเวอร์ ประเทศไทย'
console.log(detectLanguage(text2)) // 'th'
console.log(containsThai(text2)) // true
```

### Database Text Cleaning

```typescript
import { cleanTextForDatabase } from '@/lib/utils/character-encoding'

const dirtyText = '  株式会社ドライバー  \n\n  '
const cleanText = cleanTextForDatabase(dirtyText)
// Result: '株式会社ドライバー' (cleaned and normalized)
```

## Testing the Fix

### 1. Access Test Page

Visit `/character-encoding-test` to test the encoding functionality.

### 2. Test Sample Texts

Use the provided sample texts:
- **Japanese**: Company name and address in Japanese
- **Thai**: Company name and address in Thai
- **Mixed**: Combination of English, Japanese, and Thai
- **English**: Standard English text

### 3. Verify Results

Check that:
- Original text matches encoded text
- Language detection works correctly
- Character codes are properly displayed
- Preview shows correct formatting

## Database Migration

### 1. Run Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Run the migration file
-- database/migrations/fix_quotation_character_encoding.sql
```

### 2. Verify Changes

Check that:
- Text cleaning function is created
- Trigger is active on quotations table
- Existing data is cleaned
- New data is automatically processed

### 3. Monitor Performance

The migration includes:
- Automatic text cleaning on insert/update
- Performance monitoring queries
- Data validation checks

## Font System

The solution works with the existing font system:

- **Noto Sans**: Primary font with full CJK and Thai support
- **Base64 Encoding**: Embedded fonts for reliable PDF generation
- **Fallback Fonts**: System fonts for maximum compatibility

## Browser Compatibility

The solution supports:
- **Modern Browsers**: Full Unicode support
- **PDF Generation**: Proper character rendering
- **Email Templates**: Consistent text display
- **Mobile Devices**: Responsive character handling

## Performance Impact

- **Minimal Overhead**: Text processing is lightweight
- **Caching**: Fonts are cached for repeated use
- **Efficient**: Only processes text when needed
- **Scalable**: Handles large amounts of text efficiently

## Troubleshooting

### Common Issues

1. **Characters Still Not Displaying**
   - Check if fonts are properly loaded
   - Verify database encoding is UTF-8
   - Test with the encoding test component

2. **PDF Generation Fails**
   - Ensure Puppeteer is properly configured
   - Check font loading in PDF generation
   - Verify HTML output is valid

3. **Database Errors**
   - Run the migration in Supabase SQL Editor
   - Check trigger creation
   - Verify function permissions

### Debug Steps

1. **Use Test Component**: Test specific text samples
2. **Check Console**: Look for encoding warnings
3. **Verify Database**: Check text field contents
4. **Test PDF Generation**: Generate test quotations

## Future Enhancements

### Planned Improvements

1. **Real-time Validation**: Client-side character validation
2. **Auto-correction**: Automatic text fixing suggestions
3. **Language Detection**: Improved language identification
4. **Performance Optimization**: Faster text processing

### Monitoring

- Track encoding success rates
- Monitor PDF generation performance
- Log character processing issues
- Measure user satisfaction improvements

## Conclusion

This comprehensive fix addresses the root cause of Japanese and Thai character display issues in quotations by:

1. **Implementing robust text processing** with proper encoding handling
2. **Adding automatic database cleaning** to prevent future corruption
3. **Providing testing tools** for ongoing validation
4. **Ensuring consistency** across all quotation components

The solution maintains backward compatibility while significantly improving the user experience for international customers using Japanese and Thai characters.

## Support

For issues or questions:
1. Check the test component at `/character-encoding-test`
2. Review the database migration logs
3. Test with sample texts in different languages
4. Verify font loading and PDF generation
