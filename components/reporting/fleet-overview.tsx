// No longer a client component
// "use client"

import { getDictionary } from "@/lib/i18n/server"; // For server-side translations
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server"; // For server-side Supabase client
import { FleetPieChart } from "./fleet-pie-chart"; // Import the new client component
import { DatabaseError } from "@/lib/errors/app-error";

interface FleetStats {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
}

const PIE_CHART_COLORS = ['#10B981', '#F59E0B', '#6B7280', '#EF4444']; // Keep colors defined

async function fetchFleetStats(): Promise<FleetStats> {
  const supabase = await getSupabaseServerClient();
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('status');

  if (error) {
    console.error('Error fetching fleet stats:', error);
    // In a real app, throw a custom error to be caught by an error boundary or Next.js error handling
    throw new DatabaseError('Failed to fetch fleet statistics', error.stack);
  }
  if (!vehicles) {
    return { total: 0, active: 0, maintenance: 0, inactive: 0 };
  }

  const stats = vehicles.reduce(
    (acc, vehicle) => {
      acc.total++;
      switch (vehicle.status) {
        case 'active':
          acc.active++;
          break;
        case 'maintenance':
          acc.maintenance++;
          break;
        case 'inactive': // Assuming 'inactive' is a valid status from your DB
        default: // Handle any other statuses as inactive or a new category
          acc.inactive++;
          break;
      }
      return acc;
    },
    { total: 0, active: 0, maintenance: 0, inactive: 0 } as FleetStats
  );
  return stats;
}

export async function FleetOverview() {
  const { t } = await getDictionary(); // Fetch translations on the server
  let stats: FleetStats;
  let fetchError = false;

  try {
    stats = await fetchFleetStats();
  } catch (error) {
    console.error("[FleetOverview] Error fetching stats:", error);
    stats = { total: 0, active: 0, maintenance: 0, inactive: 0 }; // Default stats on error
    fetchError = true;
    // Optionally, re-throw or handle to show a specific error message in UI
  }

  const chartData = [
    { name: t('vehicles.status.active'), value: stats.active },
    { name: t('vehicles.status.maintenance'), value: stats.maintenance },
    { name: t('vehicles.status.inactive'), value: stats.inactive },
  ];

  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reporting.sections.fleetOverview.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{t('errors.dataLoadingError') || 'Could not load fleet overview data.'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reporting.sections.fleetOverview.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.fleetOverview.totalVehicles')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.fleetOverview.activeVehicles')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.fleetOverview.inMaintenance')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.fleetOverview.inactive')}
              </p>
            </CardContent>
          </Card>
        </div>
        <FleetPieChart data={chartData} colors={PIE_CHART_COLORS} />
      </CardContent>
    </Card>
  );
} 