"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import QuotationForm from '@/components/quotations/quotation-form';
import { Quotation } from '@/types/quotations';

interface QuotationFormClientProps {
  quotation?: Quotation;
  duplicateFrom?: Quotation | null;
}

export default function QuotationFormClient({
  quotation,
  duplicateFrom
}: QuotationFormClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preparedQuotation, setPreparedQuotation] = useState<Quotation | undefined>(quotation);

  // Process the duplicate data when it changes
  useEffect(() => {
    if (duplicateFrom) {
      console.log('Preparing duplicated quotation data:', duplicateFrom);
      
      // Create a new object with only the properties we want to keep
      const duplicate: Partial<Quotation> = {
        // Copy all properties except the ones we want to reset
        ...JSON.parse(JSON.stringify(duplicateFrom)),
        // Reset unique identifiers
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        reference_code: undefined,
        quote_number: undefined,
        // Set as draft and update title to indicate it's a copy
        status: 'draft',
        title: `${duplicateFrom.title || ''} (${t('common.copy')})`,
        // Reset expiry date to 48 hours from now
        expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };
      
      console.log('Prepared duplicate data:', duplicate);
      setPreparedQuotation(duplicate as Quotation);
    }
  }, [duplicateFrom, t]);

  const handleSuccess = (quotation: Quotation) => {
    // Use a simple string for Next.js 14+ router.push
    router.push(`/quotations/${quotation.id}`);
    
    toast({
      title: t(
        quotation.status === 'sent'
          ? 'quotations.notifications.sendSuccess'
          : 'quotations.notifications.createSuccess'
      ),
    });
  };

  return (
    <QuotationForm
      initialData={preparedQuotation}
      onSuccess={handleSuccess}
    />
  );
} 