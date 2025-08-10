import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

import { QuotationDetails } from './quotation-details';
import LoadingSpinner from '@/components/shared/loading-spinner';
import { Quotation, QuotationItem } from '@/types/quotations';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

// Organization domain for access control
const ORGANIZATION_DOMAIN = 'japandriver.com';

// Define the types for dynamic params
type Props = {
  params: { id: string }
}

// Generate metadata for the page
export async function generateMetadata(
  { params: awaitedParams }: Props
): Promise<Metadata> {
  const params = await awaitedParams;
  // Access params directly
  const { id } = params;
  const { t } = await getDictionary();
  
  return {
    title: `${t('quotations.details.title')} #${id.substring(0, 8)}`,
    description: t('quotations.details.description')
  };
}

export default async function QuotationDetailsPage({ params: awaitedParams }: Props) {
  const params = await awaitedParams;
  // Access params directly
  const { id } = params;
  const { t } = await getDictionary();
  
  // Create the Supabase client with properly awaited cookies
  const supabase = await getSupabaseServerClient();
  
  // Check if the user is authenticated and part of the organization
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    // Handle error, maybe redirect or show an error message
    // For now, let's log it and potentially redirect or show notFound
    // console.error("Error fetching user:", userError); // Removed console.error
    // Depending on the error, you might want to redirect to login or show a generic error
    // For simplicity, if there's a user error, we might notFound() or redirect('/auth/login')
    // For now, we'll allow it to proceed to check !user next, which handles the redirect
  }

  if (!user) {
    // If no user session, redirect to login
    // This also covers the case where userError was null but user was also null
    redirect('/auth/login'); 
  }
  
  const isOrganizationMember = user?.email?.endsWith(`@${ORGANIZATION_DOMAIN}`);
  
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
    .eq('id', id);
    
  // If user is not an organization member, only allow access to their own quotations
  if (!isOrganizationMember) {
    queryBuilder = queryBuilder.eq('customer_email', user.email);
  }
  
  const { data, error } = await queryBuilder.single();
  
  // Add better logging
  if (error) {
    // console.error('[QUOTATION DEBUG] Error fetching quotation:', error); // Removed console.error
    notFound();
  }

  if (!data) {
    // console.error('[QUOTATION DEBUG] No quotation data found for ID:', id); // Removed console.error
    notFound();
  }

  // Log the received data to debug - All console.logs removed from here down
  // console.log(`[QUOTATION DEBUG] Retrieved quotation with ID ${id}`);
  // console.log('[QUOTATION DEBUG] Quotation data preview:', {
  //   id: data.id,
  //   title: data.title,
  //   items_count: data.quotation_items?.length || 0
  // });

  // if (data.quotation_items && data.quotation_items.length > 0) {
  //   console.log('[QUOTATION DEBUG] First item preview:', data.quotation_items[0]);
  // } else {
  //   console.log('[QUOTATION DEBUG] No quotation items found in the database query');
  // }

  // Attempt to use proper typing instead of 'as any'
  const quotation = data as Quotation & { quotation_items: QuotationItem[], customers: any }; // More specific typing

  // Use the same QuotationDetails component for both organization and non-organization members,
  // but pass the isOrganizationMember flag to control permissions and actions
  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingSpinner />}>
        <QuotationDetails 
          quotation={quotation}
          isOrganizationMember={isOrganizationMember}
        />
      </Suspense>
    </div>
  );
} 