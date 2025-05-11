export const dynamic = 'force-dynamic'

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
  
  // Organization domain for access control
  const ORGANIZATION_DOMAIN = 'japandriver.com';
  
  // Check if user is from the organization
  const isOrganizationMember = session.user.email?.endsWith(`@${ORGANIZATION_DOMAIN}`);
  
  // Build query based on user type
  let query = supabase
    .from('quotations')
    .select('*', { count: 'exact' });
  
  // If not org member, only show quotations linked to this user by email
  if (!isOrganizationMember && session.user.email) {
    // Only filter by customer_email since customer_user_id doesn't exist
    query = query.eq('customer_email', session.user.email);
  }
  
  // Execute the query with ordering
  const { data, error, count } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching quotations:', error);
    return { quotations: [], count: 0, isOrganizationMember };
  }
  
  // Cast the fetched data to align with the expected Quotation[] type
  const typedQuotations = (data || []) as unknown as Quotation[];
  return { quotations: typedQuotations, count: count || 0, isOrganizationMember };
}

export default async function QuotationsPage() {
  const { t } = await getDictionary();
  const { quotations, count, isOrganizationMember } = await getQuotations();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('quotations.list')}
        description={t('quotations.listDescription')}
      >
        {isOrganizationMember && (
          <Link href="/quotations/create">
            <Button variant="default">{t('quotations.create')}</Button>
          </Link>
        )}
      </PageHeader>
      
      <Separator className="my-6" />
      
      <Card>
        <Suspense fallback={<LoadingSpinner />}>
          <QuotationsTableClient 
            initialQuotations={quotations} 
            isOrganizationMember={isOrganizationMember}
          />
        </Suspense>
      </Card>
    </div>
  );
} 