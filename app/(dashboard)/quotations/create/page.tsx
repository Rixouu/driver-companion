import { redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import QuotationFormClient from '../_components/quotation-form-client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Quotation } from '@/types/quotations';

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
  
  // Get duplicate ID more safely
  const duplicateId = typeof searchParams?.duplicate === "string" ? searchParams.duplicate : undefined;
  
  // If duplicating, fetch the original quotation
  let duplicateFrom: Quotation | null = null;
  
  if (duplicateId) {
    try {
      // Fetch the quotation AND any associated items to fully duplicate
      const { data: quotationData, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', duplicateId)
        .single();
      
      if (error) {
        console.error('Error fetching quotation to duplicate:', error);
      } else if (quotationData) {
        // Log success to help debug
        console.log('Successfully fetched quotation to duplicate:', duplicateId);
        duplicateFrom = quotationData as unknown as Quotation;
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