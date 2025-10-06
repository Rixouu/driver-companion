"use client";

import { lazy, useState } from 'react';

// Lazy load PDF generation components to reduce initial bundle size
export const PDFGenerator = lazy(() => 
  import('./pdf-generator').then(mod => ({ default: mod.PDFGenerator }))
);

export const InvoiceGenerator = lazy(() => 
  import('./invoice-generator').then(mod => ({ default: mod.InvoiceGenerator }))
);

export const QuotationPDFGenerator = lazy(() => 
  import('./quotation-pdf-generator').then(mod => ({ default: mod.QuotationPDFGenerator }))
);

export const ReportPDFGenerator = lazy(() => 
  import('./report-pdf-generator').then(mod => ({ default: mod.ReportPDFGenerator }))
);

export const BookingPDFGenerator = lazy(() => 
  import('./booking-pdf-generator').then(mod => ({ default: mod.BookingPDFGenerator }))
);

// PDF loading skeleton component
export function PDFSkeleton() {
  return (
    <div className="animate-pulse bg-muted rounded-lg p-6">
      <div className="space-y-4">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
        <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
        <div className="h-32 bg-muted-foreground/20 rounded" />
      </div>
    </div>
  );
}

// PDF error boundary component
export function PDFErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="text-destructive text-sm mb-2">Failed to generate PDF</div>
      <div className="text-xs text-muted-foreground mb-4">
        {error.message || 'An unexpected error occurred'}
      </div>
      <button 
        onClick={resetError}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        Try again
      </button>
    </div>
  );
}

// Hook for PDF generation with loading states
export function usePDFGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generatePDF = async (generator: () => Promise<void>) => {
    try {
      setIsGenerating(true);
      setError(null);
      await generator();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('PDF generation failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const resetError = () => setError(null);

  return {
    isGenerating,
    error,
    generatePDF,
    resetError
  };
}
