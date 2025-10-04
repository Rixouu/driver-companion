import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

import OptimizedQuotationDetailsPage from './optimized-page';
import { QuotationDetailsSkeleton } from '@/components/quotations/quotation-details-skeleton';
import { Quotation, QuotationItem } from '@/types/quotations';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

// Organization domain for access control
const ORGANIZATION_DOMAIN = 'japandriver.com';

// Define the types for dynamic params
type Props = {
  params: Promise<{ id: string }>;
}

// Generate metadata for the page
export async function generateMetadata(
  { params: awaitedParams }: Props
): Promise<Metadata> {
  const params = await awaitedParams;
  const { id } = params;
  const { t } = await getDictionary();
  
  return {
    title: `${t('quotations.details.title')} #${id.substring(0, 8)}`,
    description: t('quotations.details.description')
  };
}

export default async function QuotationDetailsPageOptimized({ params: awaitedParams }: Props) {
  const params = await awaitedParams;
  const { id } = params;
  const { t } = await getDictionary();
  
  // Create the Supabase client with properly awaited cookies
  const supabase = await getSupabaseServerClient();
  
  // Check if the user is authenticated and part of the organization
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login'); 
  }
  
  const isOrganizationMember = user?.email?.endsWith(`@${ORGANIZATION_DOMAIN}`);
  
  // Determine if the ID is a quote number (QUO-JPDR-XXXXXX) or UUID
  const isQuoteNumber = id.startsWith('QUO-JPDR-');
  let actualQuotationId = id;
  
  // If it's a quote number, extract the number and find the corresponding UUID
  if (isQuoteNumber) {
    const quoteNumber = parseInt(id.replace('QUO-JPDR-', ''));
    if (!isNaN(quoteNumber)) {
      const { data: quotationData } = await supabase
        .from('quotations')
        .select('id')
        .eq('quote_number', quoteNumber)
        .single();
      
      if (quotationData) {
        actualQuotationId = quotationData.id;
      } else {
        notFound();
      }
    } else {
      notFound();
    }
  }
  
  // Get the quotation with expanded selection to include billing details
  let queryBuilder = supabase
    .from('quotations')
    .select(`
      *,
      quotation_items (
        *,
        id,
        quotation_id,
        description,
        quantity,
        unit_price,
        total_price,
        sort_order,
        service_type_id,
        service_type_name,
        vehicle_type,
        vehicle_category,
        duration_hours,
        service_days,
        hours_per_day,
        is_service_item
      ),
      customers:customer_id (*)
    `)
    .eq('id', actualQuotationId);
    
  // If user is not an organization member, only allow access to their own quotations
  if (!isOrganizationMember) {
    queryBuilder = queryBuilder.eq('customer_email', user.email as string);
  }
  
  const { data, error } = await queryBuilder.single();
  
  if (error || !data) {
    notFound();
  }

  // Get creator information from profiles table
  let creatorInfo = null;
  if (data.created_by) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', data.created_by)
      .single();
    
    if (profileData) {
      creatorInfo = {
        id: profileData.id,
        full_name: profileData.full_name,
        email: profileData.email
      };
    }
  }

  // Type the quotation data properly
  const quotation = data as Quotation & { 
    quotation_items: QuotationItem[], 
    customers: any
  };

  // Add creator info to the quotation object
  const quotationWithCreator = {
    ...quotation,
    creator: creatorInfo
  };

  return (
    <Suspense fallback={<QuotationDetailsSkeleton />}>
      <OptimizedQuotationDetailsPage 
        initialQuotation={quotationWithCreator}
        isOrganizationMember={isOrganizationMember}
      />
    </Suspense>
  );
}
