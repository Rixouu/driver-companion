/**
 * Character Encoding Utilities for Japanese and Thai Support
 * This module provides functions to handle character encoding issues
 * that commonly occur with CJK and Thai characters in web applications
 */

/**
 * Safely encode text content to prevent character corruption
 * This function ensures Japanese and Thai characters are properly handled
 */
export function safeEncodeText(text: string | number | null | undefined): string {
  if (!text && text !== 0) return 'N/A';
  
  // Convert to string if it's a number
  const textStr = String(text);
  
  // Decode any HTML entities first
  const decoded = textStr.replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .replace(/&nbsp;/g, ' ')
                      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
                        try {
                          return String.fromCodePoint(parseInt(hex, 16));
                        } catch {
                          return match;
                        }
                      });
  
  // Ensure proper UTF-8 encoding
  return decoded;
}

/**
 * Check if text contains Japanese characters
 */
export function containsJapanese(text: string): boolean {
  if (!text) return false;
  
  // Japanese character ranges
  const hiragana = /[\u3040-\u309F]/;
  const katakana = /[\u30A0-\u30FF]/;
  const kanji = /[\u4E00-\u9FAF]/;
  const halfWidthKatakana = /[\uFF66-\uFF9F]/;
  
  return hiragana.test(text) || katakana.test(text) || kanji.test(text) || halfWidthKatakana.test(text);
}

/**
 * Check if text contains Thai characters
 */
export function containsThai(text: string): boolean {
  if (!text) return false;
  
  // Thai character range
  const thai = /[\u0E00-\u0E7F]/;
  
  return thai.test(text);
}

/**
 * Check if text contains CJK characters (Chinese, Japanese, Korean)
 */
export function containsCJK(text: string): boolean {
  if (!text) return false;
  
  // CJK Unified Ideographs
  const cjk = /[\u4E00-\u9FFF]/;
  
  return cjk.test(text);
}

/**
 * Normalize text for consistent display
 * This helps with character width and spacing issues
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  // Normalize Unicode characters
  let normalized = text.normalize('NFC');
  
  // Replace full-width characters with half-width equivalents where appropriate
  normalized = normalized.replace(/[\uFF01-\uFF5E]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code >= 0xFF01 && code <= 0xFF5E) {
      return String.fromCharCode(code - 0xFEE0);
    }
    return char;
  });
  
  return normalized;
}

/**
 * Escape HTML special characters while preserving Japanese and Thai
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Clean and validate text input for database storage
 */
export function cleanTextForDatabase(text: string | null | undefined): string | null {
  if (!text) return null;
  
  // Remove null bytes and other invalid characters
  let cleaned = text.replace(/\0/g, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Ensure it's valid UTF-8
  try {
    // Test if the string can be properly encoded/decoded
    const encoded = encodeURIComponent(cleaned);
    const decoded = decodeURIComponent(encoded);
    
    if (cleaned !== decoded) {
      // If there's a mismatch, try to fix it
      cleaned = decoded;
    }
  } catch (error) {
    console.warn('Text encoding issue detected:', error);
    // Return cleaned text anyway, but log the issue
  }
  
  return cleaned || null;
}

/**
 * Detect the primary language of the text
 */
export function detectLanguage(text: string): 'en' | 'ja' | 'th' | 'other' {
  if (!text) return 'en';
  
  if (containsJapanese(text)) return 'ja';
  if (containsThai(text)) return 'th';
  
  // Check for English (basic check)
  const englishPattern = /^[a-zA-Z\s.,!?;:'"()-]+$/;
  if (englishPattern.test(text)) return 'en';
  
  return 'other';
}

/**
 * Format text for display based on detected language
 */
export function formatTextForDisplay(text: string, language?: 'en' | 'ja' | 'th'): string {
  if (!text) return '';
  
  const detectedLang = language || detectLanguage(text);
  const cleaned = safeEncodeText(text);
  
  switch (detectedLang) {
    case 'ja':
      return `<span lang="ja" class="japanese-text">${cleaned}</span>`;
    case 'th':
      return `<span lang="th" class="thai-text">${cleaned}</span>`;
    case 'en':
    default:
      return cleaned;
  }
}

/**
 * Validate that text contains only valid characters for the specified language
 */
export function validateTextForLanguage(text: string, language: 'en' | 'ja' | 'th'): boolean {
  if (!text) return true;
  
  switch (language) {
    case 'ja':
      // Allow Japanese characters, English, numbers, and common punctuation
      return /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF66-\uFF9F\w\s.,!?;:'"()-]+$/.test(text);
    case 'th':
      // Allow Thai characters, English, numbers, and common punctuation
      return /^[\u0E00-\u0E7F\w\s.,!?;:'"()-]+$/.test(text);
    case 'en':
    default:
      // Allow English, numbers, and common punctuation
      return /^[\w\s.,!?;:'"()-]+$/.test(text);
  }
}
