/**
 * Form Encoding Utilities for Japanese and Thai Support
 * This module ensures proper UTF-8 encoding when handling form data
 */

/**
 * Safely encode form input values to prevent character corruption
 * This is especially important for Japanese and Thai characters
 */
export function safeEncodeFormValue(value: string | null | undefined): string {
  if (!value) return '';
  
  // Ensure the value is properly encoded as UTF-8
  try {
    // Decode any HTML entities that might have been introduced
    const decoded = value.replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/&nbsp;/g, ' ');
    
    // Normalize the string to ensure proper UTF-8 encoding
    return decoded.normalize('NFC');
  } catch (error) {
    console.warn('Form encoding issue detected:', error);
    return value;
  }
}

/**
 * Prepare form data for submission to ensure proper encoding
 */
export function prepareFormDataForSubmission(data: Record<string, any>): Record<string, any> {
  const prepared: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      prepared[key] = safeEncodeFormValue(value);
    } else {
      prepared[key] = value;
    }
  }
  
  return prepared;
}

/**
 * Handle form input change events to ensure proper encoding
 */
export function handleFormInputChange(
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setValue: (value: string) => void
): void {
  const { value } = event.target;
  
  // Ensure the input value is properly encoded
  const safeValue = safeEncodeFormValue(value);
  setValue(safeValue);
}

/**
 * Validate that form input contains valid characters for the specified language
 */
export function validateFormInput(
  value: string, 
  language?: 'en' | 'ja' | 'th' | 'auto'
): { isValid: boolean; errorMessage?: string } {
  if (!value) {
    return { isValid: true };
  }
  
  // Auto-detect language if not specified
  if (language === 'auto') {
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(value)) {
      language = 'ja';
    } else if (/[\u0E00-\u0E7F]/.test(value)) {
      language = 'th';
    } else {
      language = 'en';
    }
  }
  
  // Validate based on detected language
  switch (language) {
    case 'ja':
      // Allow Japanese characters, English, numbers, and common punctuation
      if (!/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF66-\uFF9F\w\s.,!?;:'"()-]+$/.test(value)) {
        return { 
          isValid: false, 
          errorMessage: 'Contains invalid characters for Japanese text' 
        };
      }
      break;
      
    case 'th':
      // Allow Thai characters, English, numbers, and common punctuation
      if (!/^[\u0E00-\u0E7F\w\s.,!?;:'"()-]+$/.test(value)) {
        return { 
          isValid: false, 
          errorMessage: 'Contains invalid characters for Thai text' 
        };
      }
      break;
      
    case 'en':
    default:
      // Allow English, numbers, and common punctuation
      if (!/^[\w\s.,!?;:'"()-]+$/.test(value)) {
        return { 
          isValid: false, 
          errorMessage: 'Contains invalid characters for English text' 
        };
      }
      break;
  }
  
  return { isValid: true };
}

/**
 * Create a form input wrapper that automatically handles encoding
 */
export function createEncodedInput(
  inputProps: React.InputHTMLAttributes<HTMLInputElement>,
  setValue: (value: string) => void,
  language?: 'en' | 'ja' | 'th' | 'auto'
) {
  return {
    ...inputProps,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFormInputChange(event, setValue);
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      // Validate on blur
      const validation = validateFormInput(event.target.value, language);
      if (!validation.isValid) {
        console.warn('Form validation error:', validation.errorMessage);
      }
    }
  };
}

/**
 * Create a form textarea wrapper that automatically handles encoding
 */
export function createEncodedTextarea(
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  setValue: (value: string) => void,
  language?: 'en' | 'ja' | 'th' | 'auto'
) {
  return {
    ...textareaProps,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleFormInputChange(event, setValue);
    },
    onBlur: (event: React.FocusEvent<HTMLTextAreaElement>) => {
      // Validate on blur
      const validation = validateFormInput(event.target.value, language);
      if (!validation.isValid) {
        console.warn('Form validation error:', validation.errorMessage);
      }
    }
  };
}

/**
 * Ensure proper encoding when copying text to clipboard
 */
export function copyToClipboardWithEncoding(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const safeText = safeEncodeFormValue(text);
      navigator.clipboard.writeText(safeText).then(resolve).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Debug function to check encoding of form values
 */
export function debugFormEncoding(formData: Record<string, any>): void {
  console.group('Form Encoding Debug');
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      console.log(`${key}:`, {
        original: value,
        encoded: safeEncodeFormValue(value),
        length: value.length,
        charCodes: Array.from(value).map(char => 
          `${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`
        )
      });
    }
  }
  
  console.groupEnd();
}
