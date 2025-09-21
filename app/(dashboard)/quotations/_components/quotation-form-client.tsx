"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import QuotationFormRefactored from '@/components/quotations/quotation-form-refactored';
import { GoogleMapsProvider } from '@/components/providers/google-maps-provider';
import { Quotation, QuotationItem, ServiceTypeInfo, PricingCategory, PricingItem } from '@/types/quotations';

interface QuotationFormClientProps {
  quotation?: Quotation;
  duplicateFrom?: (Quotation & { quotation_items?: QuotationItem[] }) | null;
  serviceTypes: ServiceTypeInfo[];
  pricingCategories: PricingCategory[];
  pricingItems: PricingItem[];
}

export default function QuotationFormClient({
  quotation,
  duplicateFrom,
  serviceTypes,
  pricingCategories,
  pricingItems
}: QuotationFormClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the prepared quotation immediately if duplicating
  const initialPreparedQuotation = duplicateFrom ? prepareDuplicateQuotation(duplicateFrom, t) : quotation;
  const [preparedQuotation, setPreparedQuotation] = useState<Quotation & { quotation_items?: QuotationItem[] } | undefined>(initialPreparedQuotation);

  // Helper function to prepare the duplicate data
  function prepareDuplicateQuotation(source: Quotation & { quotation_items?: QuotationItem[] }, t: any) {
    // Create a new object with only the properties we want to keep
    const duplicate: any = {
      // Copy all properties except the ones we want to reset
      ...JSON.parse(JSON.stringify(source)),
      // Reset unique identifiers
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      reference_code: undefined,
      quote_number: undefined,
      // Set as draft and update title to indicate it's a copy
      status: 'draft',
      title: `${source.title || ''} (${t('common.copy')})`,
      // Reset expiry date to 48 hours from now
      expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    };
    
    // Preserve quotation_items if present, but reset their IDs and quotation_id
    if (source.quotation_items && Array.isArray(source.quotation_items)) {
      duplicate.quotation_items = source.quotation_items.map((item: QuotationItem) => ({
        ...item,
        id: undefined,
        quotation_id: undefined,
        created_at: undefined,
        updated_at: undefined
      }));
    }
    
    return duplicate;
  }

  // Enhanced debugging on component mount to see the incoming data
  useEffect(() => {
    // console.log('QuotationFormClient mounted with duplicateFrom:', duplicateFrom); // Removed console.log
    // console.log('Original quotation items present?', duplicateFrom?.quotation_items ? `Yes, count: ${duplicateFrom.quotation_items.length}` : 'No'); // Removed console.log
    // console.log('Initial preparedQuotation:', preparedQuotation); // Removed console.log
    // console.log('preparedQuotation items present?', preparedQuotation?.quotation_items ? `Yes, count: ${preparedQuotation.quotation_items.length}` : 'No'); // Removed console.log
  }, []);

  const handleSuccess = (quotation: Quotation) => {
    // Use beautiful URL format if quote_number is available, otherwise fallback to UUID
    const beautifulUrl = quotation.quote_number 
      ? `/quotations/QUO-JPDR-${quotation.quote_number.toString().padStart(6, '0')}`
      : `/quotations/${quotation.id}`;
    
    // Use a simple string for Next.js 14+ router.push
    // Type assertion to any to bypass strict typing
    router.push(beautifulUrl as any);
    
    toast({
      title: t(
        quotation.status === 'sent'
          ? 'quotations.notifications.sendSuccess'
          : 'quotations.notifications.createSuccess'
      ),
    });
  };

  return (
    <GoogleMapsProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
      libraries={['places']}
    >
      <QuotationFormRefactored
        initialData={preparedQuotation}
        onSuccess={handleSuccess}
        serviceTypes={serviceTypes}
        pricingCategories={pricingCategories}
        pricingItems={pricingItems}
      />
    </GoogleMapsProvider>
  );
} 