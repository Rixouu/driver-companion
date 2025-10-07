import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

// =====================================================
// GET /api/crew-tasks
// Fetch crew task schedule for date range
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const driverIdsParam = searchParams.get("driver_ids");
    const taskNumbersParam = searchParams.get("task_numbers");

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start_date and end_date are required" },
        { status: 400 }
      );
    }

    // Parse array parameters
    const driverIds = driverIdsParam
      ? driverIdsParam.split(",").filter(Boolean)
      : null;
    const taskNumbers = taskNumbersParam
      ? taskNumbersParam.split(",").map(Number).filter(n => !isNaN(n))
      : null;

    // Fetch tasks from crew_tasks table directly
    // Filter by date range (tasks that overlap with the date range)
    let query = supabase
      .from("crew_tasks")
      .select(`
        *,
        drivers!crew_tasks_driver_id_fkey (
          id,
          first_name,
          last_name
        )
      `);
    
    // Apply driver filter if provided
    if (driverIds && driverIds.length > 0) {
      query = query.in("driver_id", driverIds);
    }
    
    // Apply task number filter if provided
    if (taskNumbers && taskNumbers.length > 0) {
      query = query.in("task_number", taskNumbers);
    }
    
    const { data: tasksData, error } = await query;

    if (error) {
      console.error("Error fetching crew task schedule:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Also fetch bookings that haven't been converted to crew tasks yet
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        wp_id,
        driver_id,
        date,
        time,
        service_name,
        service_type,
        pickup_location,
        dropoff_location,
        customer_name,
        customer_phone,
        duration_hours,
        service_days,
        hours_per_day,
        status,
        price_amount,
        drivers!bookings_driver_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .eq("status", "confirmed");

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      // Continue with just crew tasks if bookings fetch fails
    }

    // Convert bookings to crew task format for display
    const bookingTasks = bookingsData?.map((booking: any) => ({
      id: `booking-${booking.id}`,
      task_number: 1,
      task_type: "charter",
      task_status: "scheduled",
      driver_id: booking.driver_id,
      start_date: booking.date,
      end_date: booking.date,
      start_time: booking.time,
      end_time: booking.time ? (() => {
        const [hours, minutes] = booking.time.split(':').map(Number);
        const durationHours = booking.duration_hours || booking.hours_per_day || 1;
        const endHour = hours + Math.floor(durationHours);
        const endMinute = minutes + ((durationHours % 1) * 60);
        return `${endHour.toString().padStart(2, '0')}:${Math.floor(endMinute).toString().padStart(2, '0')}`;
      })() : null,
      hours_per_day: booking.duration_hours || booking.hours_per_day || 1,
      total_hours: booking.duration_hours || booking.hours_per_day || 1,
      booking_id: booking.id,
      title: booking.service_name || "Booking",
      description: `${booking.service_type} service`,
      location: booking.pickup_location,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      priority: 1,
      notes: `From booking ${booking.wp_id}`,
      drivers: booking.drivers,
      is_booking: true, // Flag to identify this as a booking
      price_amount: booking.price_amount
    })) || [];

    // Combine crew tasks and booking tasks
    const allTasksData = [...(tasksData || []), ...bookingTasks];

    // Process and expand multi-day tasks
    const schedule: Record<string, any> = {};
    const expandedTasks: any[] = [];
    
    if (allTasksData && Array.isArray(allTasksData)) {
      // Expand multi-day tasks into individual days
      allTasksData.forEach((task: any) => {
        const taskStart = new Date(task.start_date);
        const taskEnd = new Date(task.end_date);
        const totalDays = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Generate tasks for each day
        for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
          const currentDate = new Date(taskStart);
          currentDate.setDate(currentDate.getDate() + dayOffset);
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Check if date is within requested range
          if (dateStr >= startDate && dateStr <= endDate) {
            expandedTasks.push({
              ...task,
              current_day: dayOffset + 1,
              task_date: dateStr,
              is_multi_day: totalDays > 1,
              is_first_day: dayOffset === 0,
              is_last_day: dayOffset === totalDays - 1,
            });
          }
        }
      });
      
      // Group by driver and date
      expandedTasks.forEach((task: any) => {
        const driverId = task.driver_id || 'unassigned'; // Use 'unassigned' as key for null driver_id
        const dateStr = task.task_date;
        
        if (!schedule[driverId]) {
          schedule[driverId] = {
            driver_id: task.driver_id,
            driver_name: task.drivers ? `${task.drivers.first_name} ${task.drivers.last_name}` : 'Unassigned',
            dates: {},
          };
        }
        
        if (!schedule[driverId].dates[dateStr]) {
          schedule[driverId].dates[dateStr] = {
            tasks: [],
            task_count: 0,
          };
        }
        
        schedule[driverId].dates[dateStr].tasks.push(task);
        schedule[driverId].dates[dateStr].task_count++;
      });
    }

    return NextResponse.json({
      success: true,
      data: Object.values(schedule),
      meta: {
        start_date: startDate,
        end_date: endDate,
        driver_count: Object.keys(schedule).length,
        total_tasks: expandedTasks.length,
      },
    });
  } catch (error: any) {
    console.error("Unexpected error in GET /api/crew-tasks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/crew-tasks
// Create a new crew task
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    // Validate required fields
    const {
      task_number,
      task_type = "regular",
      driver_id,
      start_date,
      end_date,
      start_time,
      end_time,
      hours_per_day,
      total_hours,
      title,
      description,
      location,
      customer_name,
      customer_phone,
      booking_id,
      color_override,
      priority = 0,
      notes,
    } = body;

    if (!task_number || !start_date || !end_date) {
      return NextResponse.json(
        {
          error: "task_number, start_date, and end_date are required",
        },
        { status: 400 }
      );
    }

    // Convert unassigned driver ID to null
    const actualDriverId = driver_id === "00000000-0000-0000-0000-000000000000" ? null : driver_id;

    // Check for conflicts only if driver_id is provided
    let conflicts = null;
    if (actualDriverId) {
      try {
        const { data: conflictsData, error: conflictsError } = await supabase
          .from("crew_tasks")
          .select("id, task_number, title, start_date, end_date, start_time, end_time")
          .eq("driver_id", actualDriverId)
          .not("task_status", "in", "(cancelled,completed)")
          .lte("start_date", end_date)
          .gte("end_date", start_date);
          
        if (conflictsError) {
          console.error('Error checking conflicts:', conflictsError);
          return NextResponse.json(
            { error: "Failed to check for conflicts" },
            { status: 500 }
          );
        }
          
        conflicts = conflictsData;
      } catch (error) {
        console.error('Error in conflict detection:', error);
        return NextResponse.json(
          { error: "Failed to check for conflicts" },
          { status: 500 }
        );
      }

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          {
            error: "Driver has conflicting tasks in this date/time range",
            conflicts,
          },
          { status: 409 }
        );
      }
    }

    // Get current user for created_by
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Insert the task
    const { data, error } = await supabase
      .from("crew_tasks")
      .insert({
        task_number,
        task_type,
        task_status: "scheduled",
        driver_id: actualDriverId,
        start_date,
        end_date,
        start_time: start_time || null,
        end_time: end_time || null,
        hours_per_day: hours_per_day || null,
        total_hours: total_hours || null,
        booking_id: booking_id || null,
        title: title || null,
        description: description || null,
        location: location || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        color_override: color_override || null,
        priority,
        notes: notes || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating crew task:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Task created successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error in POST /api/crew-tasks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

