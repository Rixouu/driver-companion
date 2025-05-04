"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

  // Prepare a modified version of the duplicated quotation if needed
  const preparedQuotation = duplicateFrom 
    ? {
        ...duplicateFrom,
        id: undefined, // Remove ID to create a new quotation
        status: 'draft' as const,
        title: `${duplicateFrom.title} (${t('common.copy')})`,
        created_at: undefined,
        updated_at: undefined,
        reference_code: undefined,
        quote_number: undefined,
        expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
      }
    : quotation;

  const handleSuccess = (quotation: Quotation) => {
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
      quotation={preparedQuotation as Quotation}
      onSuccess={handleSuccess}
    />
  );
} 