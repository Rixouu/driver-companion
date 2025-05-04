import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/loading-spinner';
import QuotationsTableClient from '@/app/(dashboard)/quotations/quotations-client';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { Quotation } from '@/types/quotations';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getQuotations() {
  // Use the updated Supabase client that handles cookies properly in Next.js 15
  const supabase = await createServerSupabaseClient();
  
  // Check auth - redirect to login if not authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get quotations with count
  const { data, error, count } = await supabase
    .from('quotations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching quotations:', error);
    return { quotations: [], count: 0 };
  }
  
  // Cast the fetched data to align with the expected Quotation[] type
  const typedQuotations = (data || []) as Quotation[];
  return { quotations: typedQuotations, count: count || 0 };
}

export default async function QuotationsPage() {
  const { t } = await getDictionary();
  const { quotations, count } = await getQuotations();

  return (
    <div className="container py-6 max-w-full">
      <PageHeader
        title={t('quotations.title')}
        description={t('quotations.description')}
      />
      
      <Separator className="my-6" />
      
      <Suspense fallback={
        <Card className="w-full p-8 flex justify-center">
          <LoadingSpinner size={32} />
        </Card>
      }>
        <QuotationsTableClient initialQuotations={quotations} />
      </Suspense>
    </div>
  );
} 