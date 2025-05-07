import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

import { QuotationDetails } from './quotation-details';
import LoadingSpinner from '@/components/shared/loading-spinner';
import { Quotation, QuotationItem } from '@/types/quotations';

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
      quotation_items (*),
      customers:customer_id (*)
    `)
    .eq('id', id)
    .single();
  
  if (error || !data) {
    notFound();
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