"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface ShiftStatisticsProps {
  startDate: string;
  endDate: string;
  driverIds?: string[];
}

interface Statistics {
  total_drivers: number;
  total_bookings: number;
  assigned_bookings: number;
  unassigned_bookings: number;
  completed_bookings: number;
  total_hours: number;
  total_revenue: number;
  assignment_rate: number;
  completion_rate: number;
}

export function ShiftStatistics({
  startDate,
  endDate,
  driverIds,
}: ShiftStatisticsProps) {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate, driverIds]);

  async function fetchStatistics() {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Fetch booking statistics
      let query = supabase
        .from("bookings")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);

      if (driverIds && driverIds.length > 0) {
        query = query.in("driver_id", driverIds);
      }

      const { data: bookings, error: bookingsError } = await query;
      if (bookingsError) throw bookingsError;

      // Fetch driver count
      const { count: driverCount, error: driverError } = await supabase
        .from("drivers")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      if (driverError) throw driverError;

      // Calculate statistics
      const totalBookings = bookings?.length || 0;
      const assignedBookings = bookings?.filter(b => b.driver_id !== null).length || 0;
      const unassignedBookings = totalBookings - assignedBookings;
      const completedBookings = bookings?.filter(b => b.status === "completed").length || 0;
      const totalHours = bookings?.reduce((sum, b) => sum + (b.duration_hours || 0), 0) || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.price_amount || 0), 0) || 0;
      const assignmentRate = totalBookings > 0 ? (assignedBookings / totalBookings) * 100 : 0;
      const completionRate = assignedBookings > 0 ? (completedBookings / assignedBookings) * 100 : 0;

      setStats({
        total_drivers: driverCount || 0,
        total_bookings: totalBookings,
        assigned_bookings: assignedBookings,
        unassigned_bookings: unassignedBookings,
        completed_bookings: completedBookings,
        total_hours: totalHours,
        total_revenue: totalRevenue,
        assignment_rate: assignmentRate,
        completion_rate: completionRate,
      });
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch statistics");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Bookings */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold mt-2">{stats.total_bookings}</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        </Card>

        {/* Active Drivers */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Drivers</p>
              <p className="text-2xl font-bold mt-2">{stats.total_drivers}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        </Card>

        {/* Total Hours */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold mt-2">{stats.total_hours.toFixed(1)}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold mt-2">
                ¥{stats.total_revenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        </Card>
      </div>

      {/* Assignment & Completion */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Assignment Rate */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Assignment Rate</p>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.assignment_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.assigned_bookings} of {stats.total_bookings} assigned
                </p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(stats.assignment_rate, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Completion Rate */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.completion_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.completed_bookings} of {stats.assigned_bookings} completed
                </p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(stats.completion_rate, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Booking Breakdown</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-green-900">Assigned</p>
              <p className="text-2xl font-bold text-green-600">{stats.assigned_bookings}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-yellow-900">Unassigned</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.unassigned_bookings}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-900">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completed_bookings}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

