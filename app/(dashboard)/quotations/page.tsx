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

const ITEMS_PER_PAGE = 10;

async function getQuotations({ 
  query: searchTerm, 
  status: statusFilter,
  page = 1,
  dateFrom,
  dateTo,
  amountMin,
  amountMax
}: { 
  query?: string; 
  status?: string;
  page?: number;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}) {
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

  // Apply search filter
  if (searchTerm) {
    queryBuilder = queryBuilder.or(
      `quote_number.ilike.%${searchTerm}%,` +
      `title.ilike.%${searchTerm}%,` +
      `customers.name.ilike.%${searchTerm}%,` +
      `customers.email.ilike.%${searchTerm}%`
    );
  }

  // Apply status filter
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

  // Apply date range filter
  if (dateFrom) {
    // Ensure the date is set to start of day for proper comparison
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    console.log('Date From Filter:', { original: dateFrom, processed: fromDate.toISOString() });
    queryBuilder = queryBuilder.gte('created_at', fromDate.toISOString());
  }
  if (dateTo) {
    // Ensure the date is set to end of day for proper comparison
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    console.log('Date To Filter:', { original: dateTo, processed: toDate.toISOString() });
    queryBuilder = queryBuilder.lte('created_at', toDate.toISOString());
  }

  // Apply amount range filter - use total_amount if available, otherwise fall back to amount
  if (amountMin !== undefined) {
    console.log('Amount Min Filter:', amountMin);
    // Use a simpler approach: just filter by total_amount for now
    queryBuilder = queryBuilder.gte('total_amount', amountMin);
  }
  if (amountMax !== undefined) {
    console.log('Amount Max Filter:', amountMax);
    // Use a simpler approach: just filter by total_amount for now
    queryBuilder = queryBuilder.lte('total_amount', amountMax);
  }
  
  if (!isOrganizationMember && user.email) {
    queryBuilder = queryBuilder.eq('customer_email', user.email);
  }
  
  // Apply pagination
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  
  console.log('Final query parameters:', {
    searchTerm,
    statusFilter,
    page,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    from,
    to
  });
  
  const { data, error, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error) {
    console.error('Error fetching quotations:', error);
    return { quotations: [], count: 0, isOrganizationMember, totalPages: 0 };
  }
  
  console.log('Query results:', { count, dataLength: data?.length });
  
  const typedQuotations = (data || []) as unknown as Quotation[];
  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
  
  return { quotations: typedQuotations, count: count || 0, isOrganizationMember, totalPages };
}

interface QuotationsPageProps {
  searchParams: { 
    query?: string;
    status?: string;
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: string;
    amountMax?: string;
  };
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const { t } = await getDictionary();
  
  const resolvedSearchParams = await searchParams;
  const pageQuery = resolvedSearchParams.query ? String(resolvedSearchParams.query) : undefined;
  const pageStatus = resolvedSearchParams.status ? String(resolvedSearchParams.status) : undefined;
  const page = resolvedSearchParams.page ? parseInt(String(resolvedSearchParams.page)) : 1;
  const dateFrom = resolvedSearchParams.dateFrom ? String(resolvedSearchParams.dateFrom) : undefined;
  const dateTo = resolvedSearchParams.dateTo ? String(resolvedSearchParams.dateTo) : undefined;
  const amountMin = resolvedSearchParams.amountMin ? parseFloat(String(resolvedSearchParams.amountMin)) : undefined;
  const amountMax = resolvedSearchParams.amountMax ? parseFloat(String(resolvedSearchParams.amountMax)) : undefined;

  console.log('Received search params:', {
    pageQuery,
    pageStatus,
    page,
    dateFrom,
    dateTo,
    amountMin,
    amountMax
  });
  
  const { quotations, count, isOrganizationMember, totalPages } = await getQuotations({ 
    query: pageQuery, 
    status: pageStatus,
    page,
    dateFrom,
    dateTo,
    amountMin,
    amountMax
  });
  
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
            totalPages={totalPages}
            currentPage={page}
            isOrganizationMember={isOrganizationMember}
            filterParams={{
              query: pageQuery,
              status: pageStatus,
              dateFrom,
              dateTo,
              amountMin,
              amountMax
            }}
          />
        </Suspense>
      </Card>
    </div>
  );
} 