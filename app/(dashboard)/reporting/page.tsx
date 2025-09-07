import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ComprehensiveReportingPage } from '@/components/reporting/comprehensive-reporting-page';
import { addMonths, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Metadata } from 'next';

export const dynamic = "force-dynamic"; // Ensure dynamic rendering

export const metadata: Metadata = {
  title: "Reporting",
  description: "Comprehensive reporting and analytics"
};

interface ReportingPageServerProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    lang?: string;
  }>;
}

export default async function ReportingPageServer({
  searchParams,
}: ReportingPageServerProps) {
  // Await searchParams before accessing its properties
  const awaitedSearchParams = await searchParams;
  const lang = awaitedSearchParams.lang || 'en';

  const fromDate = awaitedSearchParams.from ? parseISO(awaitedSearchParams.from) : addMonths(new Date(), -1);
  const toDate = awaitedSearchParams.to ? parseISO(awaitedSearchParams.to) : new Date();
  const initialDateRange: DateRange = { from: fromDate, to: toDate };

  return (
    <ComprehensiveReportingPage
      initialDateRange={initialDateRange}
    />
  );
}