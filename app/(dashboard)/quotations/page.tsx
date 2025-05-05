import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/loading-spinner';
import QuotationsTableClient from '@/app/(dashboard)/quotations/quotations-client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Quotation } from '@/types/quotations';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  const typedQuotations = (data || []) as unknown as Quotation[];
  return { quotations: typedQuotations, count: count || 0 };
}

export default async function QuotationsPage() {
  const { t } = await getDictionary();
  const { quotations, count } = await getQuotations();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('quotations.list')}
        description={t('quotations.listDescription')}
      >
        <Link href="/quotations/create">
          <Button variant="default">{t('quotations.create')}</Button>
        </Link>
      </PageHeader>
      
      <Separator className="my-6" />
      
      <Card>
        <Suspense fallback={<LoadingSpinner />}>
          <QuotationsTableClient initialQuotations={quotations} />
        </Suspense>
      </Card>
    </div>
  );
} 