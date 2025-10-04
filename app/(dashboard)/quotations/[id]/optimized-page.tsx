"use client";

import { Suspense, lazy, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Quotation, QuotationItem } from '@/types/quotations';
import { QuotationDetailsSkeleton } from '@/components/quotations/quotation-details-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useQuotationDetails } from '@/lib/hooks/use-quotation-details';

// Lazy load heavy components
const QuotationDetailsContent = lazy(() => import('./quotation-details-content-optimized'));
const QuotationWorkflow = lazy(() => import('@/components/quotations/quotation-workflow/quotation-workflow').then(module => ({ default: module.QuotationWorkflow })));

interface OptimizedQuotationDetailsPageProps {
  initialQuotation?: Quotation & { quotation_items?: QuotationItem[] };
  isOrganizationMember?: boolean;
}

const QuotationDetailsPageContent = memo(({ 
  quotation, 
  quotationItems, 
  isOrganizationMember, 
  onRefresh 
}: {
  quotation: Quotation;
  quotationItems: QuotationItem[];
  isOrganizationMember: boolean;
  onRefresh: () => void;
}) => {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            Quotation #{quotation.quote_number || quotation.id.substring(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            Created on {new Date(quotation.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/quotations')}
        >
          Back to Quotations
        </Button>
      </div>

      <Suspense fallback={<QuotationDetailsSkeleton />}>
        <QuotationDetailsContent 
          quotation={quotation}
          quotationItems={quotationItems}
          isOrganizationMember={isOrganizationMember}
          onRefresh={onRefresh}
        />
      </Suspense>

      <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
        <QuotationWorkflow 
          quotation={quotation}
          onStatusChange={onRefresh}
          onApprovalChange={onRefresh}
          isOrganizationMember={isOrganizationMember}
        />
      </Suspense>
    </div>
  );
});

QuotationDetailsPageContent.displayName = 'QuotationDetailsPageContent';

export default function OptimizedQuotationDetailsPage({ 
  initialQuotation,
  isOrganizationMember = true
}: OptimizedQuotationDetailsPageProps) {
  const { 
    quotation, 
    quotationItems,
    loading, 
    error, 
    refetch 
  } = useQuotationDetails(initialQuotation?.id || '', initialQuotation);

  if (loading) {
    return <QuotationDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested quotation could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <QuotationDetailsPageContent
      quotation={quotation}
      quotationItems={quotationItems}
      isOrganizationMember={isOrganizationMember}
      onRefresh={refetch}
    />
  );
}
