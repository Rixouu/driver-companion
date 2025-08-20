// Base64 encoded fonts for reliable PDF generation
// These fonts are embedded directly to avoid loading issues

export const FONTS_BASE64 = {
  // Noto Sans JP Regular - Japanese font
  'Noto Sans JP': {
    regular: 'data:font/woff2;base64,d09GMgABAAAAA...', // This would be the full base64 string
    weight: 400,
    style: 'normal',
    unicodeRange: 'U+3000-303F, U+3040-309F, U+30A0-30FF, U+FF00-FFEF, U+4E00-9FAF'
  },
  
  // Noto Sans Thai Regular - Thai font  
  'Noto Sans Thai': {
    regular: 'data:font/woff2;base64,d09GMgABAAAAA...', // This would be the full base64 string
    weight: 400,
    style: 'normal',
    unicodeRange: 'U+0E00-0E7F'
  }
};

// For now, let's use a simpler approach with Google Fonts CDN
export const FONT_IMPORTS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+Thai:wght@400;500;700&display=swap');
`;

export const FONT_FACES = `
  /* Force font loading with preload */
  @font-face {
    font-family: 'Noto Sans JP';
    src: url('https://fonts.gstatic.com/s/notosansjp/v52/-F62fjtqLzI2JPCgQBnw7HFowAIO2lZ9hgI2.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: block;
    unicode-range: U+3000-303F, U+3040-309F, U+30A0-30FF, U+FF00-FFEF, U+4E00-9FAF;
  }
  
  @font-face {
    font-family: 'Noto Sans Thai';
    src: url('https://fonts.gstatic.com/s/notosansthai/v17/iJWQBXyNgD8MJ0R0J-syqEYtqYb9Zgw.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: block;
    unicode-range: U+0E00-0E7F;
  }
  
  /* Preload critical fonts */
  link[rel="preload"][href*="notosansjp"] {
    font-display: block;
  }
  
  link[rel="preload"][href*="notosansthai"] {
    font-display: block;
  }
`;
