/**
 * Utility functions for generating beautiful quotation URLs
 */

/**
 * Generate a beautiful quotation URL using quote number instead of UUID
 * @param quotation - The quotation object with id and quote_number
 * @returns The beautiful URL path
 */
export function getQuotationUrl(quotation: { id: string; quote_number?: number }): string {
  if (quotation.quote_number) {
    return `/quotations/QUO-JPDR-${quotation.quote_number.toString().padStart(6, '0')}`;
  }
  // Fallback to UUID if quote_number is not available
  return `/quotations/${quotation.id}`;
}

/**
 * Generate a beautiful quotation edit URL using quote number instead of UUID
 * @param quotation - The quotation object with id and quote_number
 * @returns The beautiful edit URL path
 */
export function getQuotationEditUrl(quotation: { id: string; quote_number?: number }): string {
  if (quotation.quote_number) {
    return `/quotations/QUO-JPDR-${quotation.quote_number.toString().padStart(6, '0')}/edit`;
  }
  // Fallback to UUID if quote_number is not available
  return `/quotations/${quotation.id}/edit`;
}

/**
 * Generate a beautiful quotation duplicate URL using quote number instead of UUID
 * @param quotation - The quotation object with id and quote_number
 * @returns The beautiful duplicate URL path
 */
export function getQuotationDuplicateUrl(quotation: { id: string; quote_number?: number }): string {
  if (quotation.quote_number) {
    return `/quotations/create?duplicate=QUO-JPDR-${quotation.quote_number.toString().padStart(6, '0')}`;
  }
  // Fallback to UUID if quote_number is not available
  return `/quotations/create?duplicate=${quotation.id}`;
}

/**
 * Generate a beautiful quotation magic link URL using quote number instead of UUID
 * @param quotation - The quotation object with id and quote_number
 * @returns The beautiful magic link URL path
 */
export function getQuotationMagicLinkUrl(quotation: { id: string; quote_number?: number }): string {
  if (quotation.quote_number) {
    return `/quote-access/QUO-JPDR-${quotation.quote_number.toString().padStart(6, '0')}`;
  }
  // Fallback to UUID if quote_number is not available
  return `/quote-access/${quotation.id}`;
}
