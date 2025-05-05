import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import LoadingSpinner from '@/components/shared/loading-spinner';
import QuotationForm from '@/components/quotations/quotation-form';
import { Quotation, QuotationItem } from '@/types/quotations';

// Define the types for dynamic params
type Props = {
  params: { id: string }
}

// Generate metadata for the page
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  // Get quotation ID from params - no need to await in Next.js 15
  const id = params.id;
  const { t } = await getDictionary();
  
  return {
    title: `${t('common.edit')} ${t('quotations.title')} #${id.substring(0, 8)}`,
    description: t('quotations.edit.description')
  };
}

export default async function EditQuotationPage({ params }: Props) {
  // Get quotation ID from params - no need to await in Next.js 15
  const id = params.id;
  const { t } = await getDictionary();
  const supabase = await createServerSupabaseClient();
  
  // Fetch the quotation from the database
  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_items (*)
    `)
    .eq('id', id)
    .single();
  
  if (error || !data) {
    console.error('Error fetching quotation:', error);
    notFound();
  }
  
  // Only allow editing of draft or sent quotations
  if (!['draft', 'sent'].includes(data.status)) {
    // Redirect to view page if not editable
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-muted p-4 rounded-md text-center">
          <h2 className="text-lg font-medium">{t('quotations.edit.notEditable')}</h2>
          <p className="text-muted-foreground mt-2">
            {t('quotations.edit.notEditableDescription')}
          </p>
        </div>
      </div>
    );
  }
  
  // Type assertion for the quotation
  const quotation = data as unknown as Quotation & {
    quotation_items: QuotationItem[];
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <Suspense fallback={<LoadingSpinner />}>
        <QuotationForm initialData={quotation} mode="edit" />
      </Suspense>
    </div>
  );
} 