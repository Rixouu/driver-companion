import { redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import QuotationFormClient from '../_components/quotation-form-client';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { Quotation } from '@/types/quotations';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
  
  // Await searchParams before accessing properties
  const params = await searchParams;
  
  // If duplicating, fetch the original quotation
  let duplicateFrom: Quotation | null = null;
  
  // Get duplicate ID more safely
  const duplicateId = typeof params?.duplicate === "string" ? params.duplicate : undefined;
  
  if (duplicateId) {
    try {
      const { data } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', duplicateId)
        .single();
      
      if (data) {
        duplicateFrom = data as unknown as Quotation;
      }
    } catch (error) {
      console.error('Error fetching duplicate quotation:', error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('quotations.create')}
      />
      
      <Separator className="my-6" />
      
      <QuotationFormClient duplicateFrom={duplicateFrom} />
    </div>
  );
} 