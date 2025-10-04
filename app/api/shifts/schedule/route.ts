import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

export const dynamic = "force-dynamic";

interface ShiftScheduleParams {
  start_date: string;
  end_date: string;
  driver_ids?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const driverIdsParam = searchParams.getAll("driver_ids[]");
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: start_date and end_date" },
        { status: 400 }
      );
    }

    // Call the database function
    const { data, error } = await supabase.rpc("get_shift_schedule", {
      p_start_date: startDate,
      p_end_date: endDate,
      p_driver_ids: driverIdsParam.length > 0 ? driverIdsParam : null,
    });

    if (error) {
      console.error("Error fetching shift schedule:", error);
      return NextResponse.json(
        { error: "Failed to fetch shift schedule", details: error.message },
        { status: 500 }
      );
    }

    // Transform data for easier consumption
    const transformedData = await transformShiftData(data);

    return NextResponse.json({
      success: true,
      data: transformedData,
      meta: {
        start_date: startDate,
        end_date: endDate,
        driver_count: transformedData.drivers.length,
        date_count: transformedData.dates.length,
      },
    });
  } catch (error) {
    console.error("Unexpected error in shift schedule API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Transform raw shift data into a more structured format
 * This function also expands multi-day bookings across multiple days
 */
async function transformShiftData(rawData: any[]) {
  if (!rawData || rawData.length === 0) {
    return { drivers: [], dates: [], grid: {} };
  }

  // Extract unique drivers
  const driversMap = new Map();
  const datesSet = new Set<string>();

  rawData.forEach((row) => {
    // Add driver to map
    if (!driversMap.has(row.driver_id)) {
      driversMap.set(row.driver_id, {
        id: row.driver_id,
        name: row.driver_name,
      });
    }

    // Add date to set (convert to YYYY-MM-DD format)
    const dateStr = new Date(row.shift_date).toISOString().split('T')[0];
    datesSet.add(dateStr);
  });

  const drivers = Array.from(driversMap.values());
  const dates = Array.from(datesSet).sort();

  // Create grid structure: { driverId: { date: { shifts, bookings } } }
  const grid: Record<string, Record<string, any>> = {};

  // First, populate with existing data (but don't add bookings yet - we'll handle them in the expansion)
  rawData.forEach((row) => {
    if (!grid[row.driver_id]) {
      grid[row.driver_id] = {};
    }

    // Convert date to YYYY-MM-DD format (adjust for timezone)
    const date = new Date(row.shift_date);
    const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    // Initialize grid cell
    grid[row.driver_id][dateStr] = {
      shifts: row.shifts || [],
      bookings: [],
      booking_count: 0,
      total_hours: 0,
      total_revenue: 0,
    };
  });

  // Now expand multi-day bookings
  // First, we need to fetch additional booking data to get service_days and hours_per_day
  const bookingIds = new Set<string>();
  rawData.forEach((row) => {
    if (row.bookings && row.bookings.length > 0) {
      row.bookings.forEach((booking: any) => {
        bookingIds.add(booking.booking_id);
      });
    }
  });

  // Fetch additional booking data if we have bookings
  let bookingDetails: Record<string, any> = {};
  if (bookingIds.size > 0) {
    try {
      const supabase = createServiceClient();
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('id, service_days, hours_per_day, duration_hours')
        .in('id', Array.from(bookingIds));

      if (!error && bookingsData) {
        bookingsData.forEach((booking: any) => {
          bookingDetails[booking.id] = {
            service_days: booking.service_days || 1,
            hours_per_day: booking.hours_per_day || booking.duration_hours || 0,
          };
        });
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  }

  rawData.forEach((row) => {
    if (row.bookings && row.bookings.length > 0) {
      row.bookings.forEach((booking: any) => {
        // Get booking details
        const details = bookingDetails[booking.booking_id] || {};
        const serviceDays = details.service_days || 1;
        const hoursPerDay = details.hours_per_day || booking.duration_hours || 0;
        
        const startDate = new Date(row.shift_date);
        // Adjust for timezone offset to get the correct date
        const startDateStr = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        
        if (serviceDays > 1) {
          // Multi-day booking - expand across all days
          for (let day = 0; day < serviceDays; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            const currentDateStr = currentDate.toISOString().split('T')[0];
            
            // Add this date to our dates set
            datesSet.add(currentDateStr);
            
            // Initialize grid for this date if it doesn't exist
            if (!grid[row.driver_id][currentDateStr]) {
              grid[row.driver_id][currentDateStr] = {
                shifts: [],
                bookings: [],
                booking_count: 0,
                total_hours: 0,
                total_revenue: 0,
              };
            }
            
            // Create a booking entry for this day
            const dayBooking = {
              ...booking,
              duration_hours: hoursPerDay,
              price_amount: booking.price_amount / serviceDays,
              day_number: day + 1,
              service_days: serviceDays,
              hours_per_day: hoursPerDay,
            };
            
            // Add to the grid
            grid[row.driver_id][currentDateStr].bookings.push(dayBooking);
            grid[row.driver_id][currentDateStr].booking_count += 1;
            grid[row.driver_id][currentDateStr].total_hours += hoursPerDay;
            grid[row.driver_id][currentDateStr].total_revenue += dayBooking.price_amount;
          }
        } else {
          // Single-day booking - add to the original date
          const dayBooking = {
            ...booking,
            duration_hours: hoursPerDay,
            day_number: 1,
            service_days: 1,
            hours_per_day: hoursPerDay,
          };
          
          // Add to the grid
          grid[row.driver_id][startDateStr].bookings.push(dayBooking);
          grid[row.driver_id][startDateStr].booking_count += 1;
          grid[row.driver_id][startDateStr].total_hours += hoursPerDay;
          grid[row.driver_id][startDateStr].total_revenue += booking.price_amount;
        }
      });
    }
  });

  // Update the dates array with the expanded dates
  const finalDates = Array.from(datesSet).sort();

  return { drivers, dates: finalDates, grid };
}

