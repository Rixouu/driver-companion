import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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
  { params }: Props
): Promise<Metadata> {
  // Make sure to await the params
  const { id } = await params;
  const { t } = await getDictionary();
  
  return {
    title: `${t('quotations.details.title')} #${id.substring(0, 8)}`,
    description: t('quotations.details.description')
  };
}

export default async function QuotationDetailsPage({ params }: Props) {
  // Make sure to await the params
  const { id } = await params;
  const { t } = await getDictionary();
  
  // Create the Supabase client with properly awaited cookies
  const supabase = await createServerSupabaseClient();
  
  // Check if the user is authenticated and part of the organization
  const { data: { session } } = await supabase.auth.getSession();
  const isOrganizationMember = session?.user?.email?.endsWith(`@${ORGANIZATION_DOMAIN}`);
  
  // Get the quotation with expanded selection to include billing details
  const { data, error } = await supabase
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
    .eq('id', id)
    .single();
  
  // Add better logging
  if (error) {
    console.error('[QUOTATION DEBUG] Error fetching quotation:', error);
    notFound();
  }

  if (!data) {
    console.error('[QUOTATION DEBUG] No quotation data found for ID:', id);
    notFound();
  }

  // Log the received data to debug
  console.log(`[QUOTATION DEBUG] Retrieved quotation with ID ${id}`);
  console.log('[QUOTATION DEBUG] Quotation data preview:', {
    id: data.id,
    title: data.title,
    items_count: data.quotation_items?.length || 0
  });

  if (data.quotation_items && data.quotation_items.length > 0) {
    console.log('[QUOTATION DEBUG] First item preview:', data.quotation_items[0]);
  } else {
    console.log('[QUOTATION DEBUG] No quotation items found in the database query');
  }

  // Use a type assertion - we know this format works with our component
  const quotation = data as any;

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