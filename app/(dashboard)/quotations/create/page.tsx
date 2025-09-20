export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/server';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import QuotationFormClient from '../_components/quotation-form-client';
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Quotation, QuotationItem, ServiceTypeInfo, PricingCategory, PricingItem } from '@/types/quotations';
import {
  getServerServiceTypes,
  getServerPricingCategories,
  getServerPricingItems
} from '@/lib/services/quotation-data';
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

interface CreateQuotationPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CreateQuotationPage({ searchParams: searchParamsPromise }: CreateQuotationPageProps) {
  // Use the updated Supabase client that handles cookies properly in Next.js 15
  const supabase = await getSupabaseServerClient();
  
  const { t } = await getDictionary();
  
  // Await searchParams before accessing its properties
  const searchParams = await searchParamsPromise;
  
  // Check auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }
  
  // Fetch setup data
  const [serviceTypes, pricingCategories, pricingItems] = await Promise.all([
    getServerServiceTypes(),
    getServerPricingCategories(),
    getServerPricingItems() // Fetch all items initially, or pass categoryId if needed later
  ]);
  
  // Access searchParams with the awaited value
  const duplicateId = typeof searchParams.duplicate === "string" ? searchParams.duplicate : undefined;
  
  // If duplicating, fetch the original quotation
  let duplicateFrom: (Quotation & { quotation_items?: QuotationItem[] }) | null = null;
  
  if (duplicateId) {
    try {
      // Check if duplicateId is a beautiful URL format (QUO-JPDR-XXXXXX)
      let actualQuotationId = duplicateId;
      if (duplicateId.startsWith('QUO-JPDR-')) {
        const quoteNumber = parseInt(duplicateId.replace('QUO-JPDR-', ''));
        if (!isNaN(quoteNumber)) {
          const { data: quotationData } = await supabase
            .from('quotations')
            .select('id')
            .eq('quote_number', quoteNumber)
            .single();
          
          if (quotationData) {
            actualQuotationId = quotationData.id;
          } else {
            console.error('Quotation not found for quote number:', quoteNumber);
            actualQuotationId = ''; // This will cause the fetch to fail gracefully
          }
        }
      }
      
      // Fetch the quotation AND any associated items to fully duplicate
      const { data: quotationData, error } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_items (*)
        `)
        .eq('id', actualQuotationId)
        .single();
      
      if (error) {
        // console.error('Error fetching quotation to duplicate:', error);
      } else if (quotationData) {
        // console.log('Successfully fetched quotation to duplicate:', duplicateId);
        
        // if (quotationData.quotation_items) {
        //   console.log('Quotation items found:', quotationData.quotation_items.length);
        //   console.log('First item sample:', quotationData.quotation_items[0]);
        // } else {
        //   console.warn('No quotation_items found in the data from Supabase');
        // }
        
        duplicateFrom = quotationData as unknown as Quotation & { quotation_items?: QuotationItem[] };
      }
    } catch (error) {
      // console.error('Error fetching quotation to duplicate:', error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={duplicateFrom ? t('quotations.duplicate') : t('quotations.create')}
      />
      
      <Separator className="my-6" />
      
      <QuotationFormClient 
        duplicateFrom={duplicateFrom} 
        serviceTypes={serviceTypes}
        pricingCategories={pricingCategories}
        pricingItems={pricingItems}
      />
    </div>
  );
} 