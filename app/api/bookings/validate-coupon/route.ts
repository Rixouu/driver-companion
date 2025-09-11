import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

export async function POST(request: NextRequest) {
  try {
    const { couponCode, bookingId } = await request.json();

    if (!couponCode) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Find the coupon in vehicle_assignment_operations
    const { data: operation, error: operationError } = await supabase
      .from('vehicle_assignment_operations')
      .select(`
        id,
        booking_id,
        operation_type,
        coupon_code,
        refund_amount,
        currency,
        status,
        created_at,
        previous_vehicle_id,
        new_vehicle_id,
        previous_category_name,
        new_category_name
      `)
      .eq('coupon_code', couponCode)
      .eq('status', 'completed')
      .single();

    if (operationError || !operation) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is expired (30 days from creation)
    const createdAt = new Date(operation.created_at);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCreation > 30) {
      return NextResponse.json({
        valid: false,
        message: 'Coupon has expired (valid for 30 days)'
      });
    }

    // Check if coupon is for the same booking (optional validation)
    if (bookingId && operation.booking_id !== bookingId) {
      return NextResponse.json({
        valid: false,
        message: 'Coupon is not valid for this booking'
      });
    }

    // Get vehicle details for display
    let previousVehicle = null;
    let newVehicle = null;

    if (operation.previous_vehicle_id) {
      const { data: prevVehicle } = await supabase
        .from('vehicles')
        .select('name, brand, model')
        .eq('id', operation.previous_vehicle_id)
        .single();
      previousVehicle = prevVehicle;
    }

    if (operation.new_vehicle_id) {
      const { data: newVeh } = await supabase
        .from('vehicles')
        .select('name, brand, model')
        .eq('id', operation.new_vehicle_id)
        .single();
      newVehicle = newVeh;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: operation.id,
        code: operation.coupon_code,
        refundAmount: operation.refund_amount,
        currency: operation.currency,
        operationType: operation.operation_type,
        previousCategory: operation.previous_category_name,
        newCategory: operation.new_category_name,
        previousVehicle,
        newVehicle,
        createdAt: operation.created_at,
        daysRemaining: 30 - daysSinceCreation
      },
      message: 'Coupon is valid'
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
