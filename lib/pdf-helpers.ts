import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

/**
 * Sets up font configuration for the PDF document
 * This function uses the standard built-in helvetica font in jsPDF
 * which is available without needing custom font files
 * 
 * @param doc jsPDF document instance
 * @returns the document with font configuration
 */
export async function embedWorkSansFont(doc: jsPDF): Promise<jsPDF> {
  try {
    // Use the default built-in fonts in jsPDF
    // The default is already "helvetica" so no need to set it
    
    // Optional: Set specific font variants for use in the document
    doc.setFont("helvetica"); // normal
    
    // Note: We don't use addFont() which requires VFS loaded fonts
    
    return doc;
  } catch (error) {
    console.error('Error setting up font:', error);
    // Return the original document if font setup fails
    return doc;
  }
}

/**
 * Formats currency to match the design in the screenshot
 * @param amount number to format
 * @param currency currency code (default: JPY)
 * @returns formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'JPY'): string {
  if (!amount) return currency === 'JPY' ? `¥0` : `${currency} 0`;
  return currency === 'JPY'
    ? `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Creates fixed header for quotation PDFs with the red line and logo
 * @param doc jsPDF document
 * @param logoBase64 Base64 encoded logo image
 */
export function createQuotationHeader(doc: jsPDF, logoBase64: string): void {
  // Add red border at top
  doc.setDrawColor(255, 38, 0); // #FF2600
  doc.setLineWidth(1);
  doc.line(10, 10, 200, 10);
  
  // Add company logo
  try {
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 15, 25, 40, 12);
    }
  } catch (logoError) {
    console.error('Error adding logo to PDF:', logoError);
  }
} 