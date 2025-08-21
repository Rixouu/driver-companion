#!/usr/bin/env python3

# Read the base64 content
with open('public/fonts/NotoSans-Regular.base64.txt', 'r') as f:
    base64_content = f.read().strip()

# Create the TypeScript file content
ts_content = f'''// Base64 encoded Noto Sans font for Japanese and Thai support
// This single font supports both Japanese and Thai characters efficiently

export const base64Fonts = {{
  // Noto Sans Regular - Supports both Japanese and Thai characters
  // This is the most efficient single-font solution for both languages
  notoSansRegular: `data:font/woff2;base64,{base64_content}`,
}};

// Font CSS template with base64 font
export function generateFontCSS(): string {{
  return `
    /* OPTIMIZED MULTI-LANGUAGE FONT SYSTEM WITH BASE64 */
    /* Noto Sans Base64 - Supports Japanese and Thai characters */
    @font-face {{
      font-family: 'Noto Sans';
      src: url('${{base64Fonts.notoSansRegular}}') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }}
    
    /* Apply Noto Sans to all text for consistent multi-language support */
    body {{
      font-family: 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                   'Helvetica Neue', Arial, sans-serif;
    }}
    
    /* Ensure proper rendering for Japanese and Thai text */
    .japanese-text, .thai-text {{
      font-family: 'Noto Sans', sans-serif;
    }}
  `;
}}

// Font loading utility
export function loadNotoSansFont(): Promise<void> {{
  return new Promise((resolve) => {{
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'data:text/css;base64,' + btoa(generateFontCSS());
    link.onload = () => resolve();
    document.head.appendChild(link);
  }});
}}
'''

# Write the TypeScript file
with open('lib/base64-fonts.ts', 'w') as f:
    f.write(ts_content)

print("✅ Generated lib/base64-fonts.ts with Noto Sans base64 font")
print("📝 This font supports both Japanese and Thai characters")
print("🚀 Use loadNotoSansFont() to dynamically load the font")
