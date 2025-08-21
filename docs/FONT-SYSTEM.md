# Noto Sans Font System - Japanese & Thai Support

## Overview

This project now uses **Noto Sans** as a single font solution that supports both Japanese (日本語) and Thai (ภาษาไทย) characters efficiently. The font is embedded as base64 data to eliminate external loading dependencies.

## Why Noto Sans?

- **Single Font Solution**: One font file handles both Japanese and Thai characters
- **Excellent Language Support**: Comprehensive coverage for both writing systems
- **Optimized Performance**: Base64 embedded for instant loading
- **Consistent Rendering**: Uniform appearance across all supported languages
- **Google Fonts Quality**: Professional typography designed for readability

## Implementation

### 1. Font Files

- **Location**: `lib/base64-fonts.ts`
- **Format**: WOFF2 (Base64 encoded)
- **Weight**: 400 (Regular)
- **Size**: Optimized for web use

### 2. Font Loading

The font is automatically loaded via the `FontProvider` component:

```tsx
import { FontProvider } from '@/components/providers/font-provider';

// In your layout
<FontProvider>
  <YourApp />
</FontProvider>
```

### 3. CSS Integration

The font is automatically applied to all text:

```css
body {
  font-family: 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               'Helvetica Neue', Arial, sans-serif;
}
```

## Usage Examples

### Japanese Text
```tsx
<p>こんにちは、世界！これは日本語のテキストです。</p>
```

### Thai Text
```tsx
<p>สวัสดีชาวโลก! นี่คือข้อความภาษาไทย</p>
```

### Mixed Language
```tsx
<p>English text with 日本語 (Japanese) and ภาษาไทย (Thai)</p>
```

## Testing

Visit `/font-test` to see the font in action with various language combinations.

## Benefits

1. **Performance**: No external font requests
2. **Reliability**: Font always available, even offline
3. **Consistency**: Uniform rendering across all devices
4. **Efficiency**: Single font file for multiple languages
5. **Accessibility**: Proper support for both writing systems

## Technical Details

- **Font Format**: WOFF2 (Web Open Font Format 2.0)
- **Encoding**: Base64 for inline CSS
- **Loading Strategy**: Dynamic CSS injection
- **Fallbacks**: System fonts for graceful degradation
- **Browser Support**: Modern browsers with WOFF2 support

## Maintenance

To update the font:

1. Download new Noto Sans WOFF2 file
2. Convert to base64: `base64 -i font.woff2 > font.base64.txt`
3. Update `lib/base64-fonts.ts`
4. Test with Japanese and Thai text

## Troubleshooting

### Font Not Loading
- Check browser console for errors
- Verify `FontProvider` is included in layout
- Ensure base64 data is valid

### Text Not Displaying Properly
- Confirm font-family is applied
- Check if text contains proper Unicode characters
- Verify font loading completed

### Performance Issues
- Base64 font is loaded once and cached
- Font display is set to 'block' for optimal performance
- Consider font subsetting for very large fonts

## Future Enhancements

- Add additional font weights (Medium, Bold)
- Implement font loading optimization
- Add font preloading strategies
- Consider variable font support
