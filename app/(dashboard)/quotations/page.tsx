export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import { redirect, useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/loading-spinner';
import QuotationsTableClient from '@/app/(dashboard)/quotations/quotations-client';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Quotation } from '@/types/quotations';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getQuotations({ query: searchTerm, status: statusFilter }: { query?: string; status?: string }) {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/auth/login');
  }
  
  const ORGANIZATION_DOMAIN = 'japandriver.com';
  const isOrganizationMember = user.email?.endsWith(`@${ORGANIZATION_DOMAIN}`);
  
  let queryBuilder = supabase
    .from('quotations')
    .select(`
      *,
      customers(name, email),
      quotation_items(
        id,
        unit_price,
        total_price,
        quantity,
        service_days,
        time_based_adjustment
      )
    `, { count: 'exact' });

  if (searchTerm) {
    queryBuilder = queryBuilder.or(
      `quote_number.ilike.%${searchTerm}%,` +
      `title.ilike.%${searchTerm}%,` +
      `customers.name.ilike.%${searchTerm}%,` +
      `customers.email.ilike.%${searchTerm}%`
    );
  }
  if (statusFilter) {
    if (statusFilter === 'expired') {
      // For expired filter, get quotations that are either:
      // 1. Explicitly marked as expired, OR
      // 2. Have draft/sent status but are past expiry date (2 days from creation)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      queryBuilder = queryBuilder.or(
        `status.eq.expired,and(status.in.(draft,sent),created_at.lt.${twoDaysAgo.toISOString()})`
      );
    } else {
      queryBuilder = queryBuilder.eq('status', statusFilter);
    }
  }
  
  if (!isOrganizationMember && user.email) {
    queryBuilder = queryBuilder.eq('customer_email', user.email);
  }
  
  const { data, error, count } = await queryBuilder.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching quotations:', error);
    return { quotations: [], count: 0, isOrganizationMember };
  }
  
  const typedQuotations = (data || []) as unknown as Quotation[];
  return { quotations: typedQuotations, count: count || 0, isOrganizationMember };
}

interface QuotationsPageProps {
  searchParams: { 
    query?: string;
    status?: string; 
  };
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const { t } = await getDictionary();
  
  const resolvedSearchParams = await searchParams;
  const pageQuery = resolvedSearchParams.query ? String(resolvedSearchParams.query) : undefined;
  const pageStatus = resolvedSearchParams.status ? String(resolvedSearchParams.status) : undefined;

  const { quotations, count, isOrganizationMember } = await getQuotations({ query: pageQuery, status: pageStatus });
  
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
            totalCount={count || 0}
            isOrganizationMember={isOrganizationMember}
          />
        </Suspense>
      </Card>
    </div>
  );
} 