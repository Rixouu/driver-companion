import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/server';
import { getSupabaseServerClient } from "@/lib/supabase/server";
import LoadingSpinner from '@/components/shared/loading-spinner';
import QuotationFormClient from '../../_components/quotation-form-client';
import { Quotation, QuotationItem, ServiceTypeInfo, PricingCategory, PricingItem } from '@/types/quotations';
import {
  getServerServiceTypes,
  getServerPricingCategories,
  getServerPricingItems
} from '@/lib/services/quotation-data';

// Define the types for dynamic params
type PageProps = {
  params: Promise<{ id: string }>
}

// Generate metadata for the page
export async function generateMetadata(
  { params: paramsPromise }: PageProps
): Promise<Metadata> {
  const params = await paramsPromise;
  // Access params directly
  const { id } = params;
  const { t } = await getDictionary();
  
  return {
    title: `${t('common.edit')} ${t('quotations.title')} #${id.substring(0, 8)}`,
    description: t('quotations.edit.description')
  };
}

export default async function EditQuotationPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise;
  const { id } = params;
  const { t } = await getDictionary();
  const supabase = await getSupabaseServerClient();
  
  // Check auth first - crucial for server components
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch the quotation and setup data in parallel
  const [quotationResult, serviceTypes, pricingCategories, pricingItems] = await Promise.all([
    supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (*)
      `)
      .eq('id', id)
      .single(),
    getServerServiceTypes(),
    getServerPricingCategories(),
    getServerPricingItems()
  ]);
  
  const { data, error } = quotationResult;
  
  if (error || !data) {
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
  
  // Attempt more specific typing
  const quotation = data as (Quotation & { quotation_items: QuotationItem[] });
  
  return (
    <div className="max-w-5xl mx-auto">
      <Suspense fallback={<LoadingSpinner />}>
        <QuotationFormClient 
          quotation={quotation} 
          serviceTypes={serviceTypes}
          pricingCategories={pricingCategories}
          pricingItems={pricingItems}
        />
      </Suspense>
    </div>
  );
} 