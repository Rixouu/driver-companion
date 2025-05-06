import { redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import QuotationFormClient from '../_components/quotation-form-client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Quotation, QuotationItem } from '@/types/quotations';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CreateQuotationPage({ searchParams }: PageProps) {
  // Use the updated Supabase client that handles cookies properly in Next.js 15
  const supabase = await createServerSupabaseClient();
  
  const { t } = await getDictionary();
  
  // Check auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // In Next.js 15, searchParams should be awaited before using its properties
  const params = await searchParams;
  
  // Get duplicate ID more safely
  const duplicateId = typeof params?.duplicate === "string" ? params.duplicate : undefined;
  
  // If duplicating, fetch the original quotation
  let duplicateFrom: (Quotation & { quotation_items?: QuotationItem[] }) | null = null;
  
  if (duplicateId) {
    try {
      // Fetch the quotation AND any associated items to fully duplicate
      const { data: quotationData, error } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_items (*)
        `)
        .eq('id', duplicateId)
        .single();
      
      if (error) {
        console.error('Error fetching quotation to duplicate:', error);
      } else if (quotationData) {
        // Log success to help debug
        console.log('Successfully fetched quotation to duplicate:', duplicateId);
        
        // Log the quotation_items specifically for debugging
        if (quotationData.quotation_items) {
          console.log('Quotation items found:', quotationData.quotation_items.length);
          console.log('First item sample:', quotationData.quotation_items[0]);
        } else {
          console.warn('No quotation_items found in the data from Supabase');
        }
        
        duplicateFrom = quotationData as unknown as Quotation & { quotation_items?: QuotationItem[] };
      }
    } catch (error) {
      console.error('Error fetching quotation to duplicate:', error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={duplicateFrom ? t('quotations.duplicate') : t('quotations.create')}
      />
      
      <Separator className="my-6" />
      
      <QuotationFormClient duplicateFrom={duplicateFrom} />
    </div>
  );
} 