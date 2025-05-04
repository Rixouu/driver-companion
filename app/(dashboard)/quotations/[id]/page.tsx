import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

import { QuotationDetails } from './quotation-details';
import LoadingSpinner from '@/components/shared/loading-spinner';

// Define the types for dynamic params
type Props = {
  params: { id: string }
}

// Fix the metadata generation to properly await params
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const id = await params.id;
  const { t } = await getDictionary();
  
  return {
    title: `${t('quotations.details.title')} #${id.substring(0, 8)}`,
  };
}

export default async function QuotationDetailsPage({ params }: Props) {
  const id = await params.id;
  const { t } = await getDictionary();
  const supabase = await createServerSupabaseClient();
  
  // Get the quotation with expanded selection to include billing details
  const { data: quotation, error } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_items (*),
      customers:customer_id (*)
    `)
    .eq('id', id)
    .single();
  
  if (error || !quotation) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingSpinner />}>
        <QuotationDetails quotation={quotation} />
      </Suspense>
    </div>
  );
} 