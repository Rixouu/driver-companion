import { getSupabaseServerClient } from '@/lib/supabase/server';
import ReportingPageContent from '@/components/reporting/reporting-page-content';
import { CostPerKmChart } from '@/components/reporting/cost-per-km-chart';
import { addMonths, format, parseISO, differenceInDays, eachMonthOfInterval } from 'date-fns';
import { DateRange } from 'react-day-picker';

export const dynamic = "force-dynamic"; // Ensure dynamic rendering

// Define CostPerKmDataPoint for server-side fetching and client-side chart
export interface CostPerKmDataPoint {
  name: string; // Typically vehicle name
  fuelCostPerKm: number;
  maintenanceCostPerKm: number;
  // totalCostPerKm?: number; // Optional: Can be calculated or fetched
  // distance?: number; // Optional: Raw distance for context
}

// Define RecentReport type for server-side fetching clarity
interface RecentReportServerData {
  id: string;
  name: string;
  type: string;
  created_at: string; // Supabase typically returns ISO string for timestamps
  downloadUrl: string | null; // Assuming downloadUrl can be null
}

async function getCostPerKmData(supabase: any, dateRange: DateRange): Promise<CostPerKmDataPoint[]> {
  if (!dateRange.from || !dateRange.to) return [];

  const fromISO = dateRange.from.toISOString();
  const toISO = dateRange.to.toISOString();

  try {
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, name');

    if (vehiclesError) throw vehiclesError;
    if (!vehicles) return [];

    const { data: fuelEntries, error: fuelError } = await supabase
      .from('fuel_entries')
      .select('vehicle_id, fuel_cost, odometer_reading, date')
      .gte('date', fromISO)
      .lte('date', toISO);

    if (fuelError) throw fuelError;

    const { data: mileageEntries, error: mileageError } = await supabase
      .from('mileage_entries')
      .select('vehicle_id, reading, date')
      .gte('date', fromISO)
      .lte('date', toISO)
      .order('date');

    if (mileageError) throw mileageError;

    const { data: maintenanceLogs, error: maintenanceError } = await supabase
      .from('maintenance_tasks')
      .select('vehicle_id, cost, completed_date')
      .gte('completed_date', fromISO)
      .lte('completed_date', toISO);

    if (maintenanceError) throw maintenanceError;

    const costDataPromises = vehicles.map(async (vehicle) => {
      const vehicleFuelEntries = (fuelEntries || []).filter(entry => entry.vehicle_id === vehicle.id);
      const fuelCost = vehicleFuelEntries.reduce((sum, entry) => {
        const cost = typeof entry.fuel_cost === 'string' ? parseFloat(entry.fuel_cost) : entry.fuel_cost;
        return sum + (cost || 0);
      }, 0);

      let distance = 0;
      const vehicleMileageEntries = (mileageEntries || [])
        .filter(entry => entry.vehicle_id === vehicle.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (vehicleMileageEntries.length >= 2) {
        const firstReading = vehicleMileageEntries[0].reading;
        const lastReading = vehicleMileageEntries[vehicleMileageEntries.length - 1].reading;
        distance = lastReading - firstReading;
      }

      if (distance <= 0) {
        const vehicleFuelEntriesWithOdometer = vehicleFuelEntries
          .filter(entry => entry.odometer_reading)
          .sort((a, b) => (a.odometer_reading || 0) - (b.odometer_reading || 0));
        
        if (vehicleFuelEntriesWithOdometer.length >= 2) {
          const firstReading = vehicleFuelEntriesWithOdometer[0].odometer_reading;
          const lastReading = vehicleFuelEntriesWithOdometer[vehicleFuelEntriesWithOdometer.length - 1].odometer_reading;
          if (firstReading != null && lastReading != null) {
            distance = lastReading - firstReading;
          }
        }
      }

      const vehicleMaintenanceLogs = (maintenanceLogs || []).filter(log => log.vehicle_id === vehicle.id);
      const maintenanceCost = vehicleMaintenanceLogs.reduce((sum, log) => {
        const cost = typeof log.cost === 'string' ? parseFloat(log.cost) : log.cost;
        return sum + (cost || 0);
      }, 0);

      const fuelCostPerKm = distance > 0 ? Math.round((fuelCost / distance) * 100) / 100 : 0;
      const maintenanceCostPerKm = distance > 0 ? Math.round((maintenanceCost / distance) * 100) / 100 : 0;
      
      return {
        name: vehicle.name,
        fuelCostPerKm,
        maintenanceCostPerKm,
      };
    });

    const resolvedCostData = (await Promise.all(costDataPromises)).filter(v => (v.fuelCostPerKm > 0 || v.maintenanceCostPerKm > 0));
    return resolvedCostData;

  } catch (error) {
    console.error("Error fetching cost per km data:", error);
    return [];
  }
}

async function getReportingData(supabase: any, dateRange: DateRange) {
  let recentReportsData: RecentReportServerData[] = [];

  // When the 'generated_reports' table is available and typed, uncomment and adjust the Supabase query below.
  /* // Commenting out due to issues with 'generated_reports' table
  if (dateRange.from && dateRange.to) {
    const fromISO = format(dateRange.from, 'yyyy-MM-ddTHH:mm:ssXXX'); // Use format for consistency
    const toISO = format(dateRange.to, 'yyyy-MM-ddTHH:mm:ssXXX');   // Use format for consistency

    const { data, error } = await supabase
      .from('generated_reports') // Assuming this table name is correct
      .select('id, name, type, created_at, download_url') // Ensure download_url is the correct column name
      .gte('created_at', fromISO)
      .lte('created_at', toISO)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching recent reports:", error);
    } else if (data) {
      recentReportsData = data.map(report => ({
        ...report,
        downloadUrl: report.download_url // Ensure mapping from snake_case if needed
      }));
    }
  }
  */
  
  // Fetch Cost Per Km Data
  const costPerKmData = await getCostPerKmData(supabase, dateRange);

  return { recentReportsData, costPerKmData }; // Return both
}

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
  const supabase = await getSupabaseServerClient();
  
  // Await searchParams before accessing its properties
  const awaitedSearchParams = await searchParams;
  const lang = awaitedSearchParams.lang || 'en';
  // TODO: Integrate lang with i18n context if necessary server-side

  const fromDate = awaitedSearchParams.from ? parseISO(awaitedSearchParams.from) : addMonths(new Date(), -1);
  const toDate = awaitedSearchParams.to ? parseISO(awaitedSearchParams.to) : new Date();
  const initialDateRange: DateRange = { from: fromDate, to: toDate };

  const { recentReportsData, costPerKmData } = await getReportingData(supabase, initialDateRange); // Pass supabase

  return (
    <ReportingPageContent
      initialDateRange={initialDateRange}
      initialRecentReports={recentReportsData}
      initialCostPerKmData={costPerKmData} // Pass new data
    />
  );
}