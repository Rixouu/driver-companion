import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { vehicleId, driverId } = await request.json();
    const { id: bookingId } = await params;

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles!bookings_vehicle_id_fkey(
          id,
          brand,
          model,
          plate_number,
          pricing_category_vehicles(
            pricing_categories(
              id,
              name,
              sort_order
            )
          )
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get the new vehicle details
    const { data: newVehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select(`
        id,
        brand,
        model,
        plate_number,
        pricing_category_vehicles(
          pricing_categories(
            id,
            name,
            sort_order
          )
        )
      `)
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !newVehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Get current and new pricing categories
    const currentCategory = booking.vehicles?.pricing_category_vehicles?.[0]?.pricing_categories;
    const newCategory = newVehicle.pricing_category_vehicles?.[0]?.pricing_categories;

    if (!currentCategory || !newCategory) {
      return NextResponse.json(
        { error: 'Pricing category information not found' },
        { status: 400 }
      );
    }

    // Determine assignment type
    let assignmentType: 'update' | 'upgrade' | 'downgrade' = 'update';
    let priceDifference = 0;

    if (newCategory.sort_order < currentCategory.sort_order) {
      assignmentType = 'upgrade';
    } else if (newCategory.sort_order > currentCategory.sort_order) {
      assignmentType = 'downgrade';
    }

    // Calculate price difference if needed
    if (assignmentType !== 'update') {
      // Get pricing for both vehicles for the same service
      const { data: currentPricing } = await supabase
        .from('pricing_items')
        .select('price')
        .eq('vehicle_id', booking.vehicle_id)
        .eq('service_type_id', booking.service_type)
        .eq('duration_hours', booking.duration_hours || 1)
        .eq('is_active', true)
        .single();

      const { data: newPricing } = await supabase
        .from('pricing_items')
        .select('price')
        .eq('vehicle_id', vehicleId)
        .eq('service_type_id', booking.service_type)
        .eq('duration_hours', booking.duration_hours || 1)
        .eq('is_active', true)
        .single();

      if (currentPricing && newPricing) {
        priceDifference = Number(newPricing.price) - Number(currentPricing.price);
      }
    }

    // Update the booking with new vehicle
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        vehicle_id: vehicleId,
        driver_id: driverId || booking.driver_id,
        updated_at: new Date().toISOString(),
        meta: {
          ...booking.meta,
          assigned_at: new Date().toISOString(),
          vehicle_assignment_type: assignmentType,
          previous_vehicle_id: booking.vehicle_id,
          new_vehicle_id: vehicleId,
          previous_vehicle_category: currentCategory.name,
          new_vehicle_category: newCategory.name,
          price_difference: priceDifference
        }
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Handle different assignment types
    let result: any = {
      success: true,
      assignmentType,
      priceDifference,
      message: 'Vehicle assigned successfully'
    };

    if (assignmentType === 'upgrade' && priceDifference > 0) {
      // Generate payment link for upgrade
      result.paymentRequired = true;
      result.paymentAmount = priceDifference;
      result.message = `Vehicle upgraded! Additional payment of ¥${priceDifference.toLocaleString()} required.`;
    } else if (assignmentType === 'downgrade' && priceDifference < 0) {
      // Generate coupon for downgrade
      const couponCode = `DOWNGRADE-${bookingId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      
      const { error: couponError } = await supabase
        .from('pricing_promotions')
        .insert({
          name: `Vehicle Downgrade Refund - ${booking.wp_id}`,
          description: `Refund for vehicle downgrade from ${currentCategory.name} to ${newCategory.name}`,
          code: couponCode,
          discount_type: 'fixed',
          discount_value: Math.abs(priceDifference),
          is_active: true,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          usage_limit: 1,
          applicable_service: [booking.service_name],
          created_at: new Date().toISOString()
        });

      if (!couponError) {
        result.couponGenerated = true;
        result.couponCode = couponCode;
        result.refundAmount = Math.abs(priceDifference);
        result.message = `Vehicle downgraded! Coupon code ${couponCode} generated for ¥${Math.abs(priceDifference).toLocaleString()} refund.`;
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error assigning vehicle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
