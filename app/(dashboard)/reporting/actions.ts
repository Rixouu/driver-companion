'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { DateRange } from 'react-day-picker';
import { revalidatePath } from 'next/cache';

// Match the interface in ReportingPageContent.tsx
interface CustomReportOptions {
  name: string;
  reportType: string;
  includeVehicles: boolean;
  includeMaintenance: boolean;
  includeFuel: boolean;
  includeCosts: boolean;
}

// Match the interface in ReportingPageContent.tsx (or page.tsx)
interface RecentReportServerData {
  id: string;
  name: string;
  type: string;
  created_at: string;
  downloadUrl: string | null;
}

export async function createCustomReportAction(
  options: CustomReportOptions,
  dateRange: DateRange | undefined
): Promise<{ success: boolean; report?: RecentReportServerData; error?: string }> {
  const supabase = await getSupabaseServerClient();

  if (!dateRange || !dateRange.from || !dateRange.to) {
    return { success: false, error: 'Date range is required for custom reports.' };
  }

  try {
    // 1. Placeholder for actual report generation logic
    // This could involve complex queries, calling a Supabase DB function, or other services.
    // For now, we'll assume it generates a file and returns a (mocked) URL.
    console.log('Server Action: Generating custom report with options:', options);
    console.log('Server Action: Date range:', dateRange);
    const mockDownloadUrl = `/reports/custom/${options.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;

    // 2. Save metadata to generated_reports table
    const { data: newReport, error: insertError } = await supabase
      .from('generated_reports')
      .insert({
        name: options.name,
        type: options.reportType, // Or a more generic type like 'custom'
        // created_at will be set by default by Supabase
        download_url: mockDownloadUrl, // Use the actual URL once generation logic is in place
        // You might want to store the options or dateRange used to generate it as well
        // metadata: { options, dateRange } // Example
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting generated report:', insertError);
      return { success: false, error: insertError.message };
    }

    if (!newReport) {
      return { success: false, error: 'Failed to save report metadata.' };
    }
    
    // Revalidate the reporting page to show the new report in the recent list
    revalidatePath('/reporting'); // Adjust path if your reporting page is different

    return {
      success: true,
      report: {
        id: newReport.id,
        name: newReport.name,
        type: newReport.type,
        created_at: newReport.created_at,
        downloadUrl: newReport.download_url,
      },
    };
  } catch (e: any) {
    console.error('Error in createCustomReportAction:', e);
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
} 