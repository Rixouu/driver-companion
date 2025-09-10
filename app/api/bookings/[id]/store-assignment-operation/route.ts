import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { 
      operationType, 
      previousVehicleId, 
      newVehicleId, 
      driverId, 
      priceDifference, 
      paymentAmount, 
      couponCode, 
      refundAmount, 
      customerEmail, 
      bccEmail 
    } = await request.json();
    const { id: bookingId } = await params;

    if (!operationType || !newVehicleId || !driverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get vehicle category names
    let previousCategoryName = null;
    let newCategoryName = null;

    if (previousVehicleId) {
      const { data: previousVehicle } = await supabase
        .from('vehicles')
        .select(`
          pricing_category_vehicles!inner(
            pricing_categories!inner(name)
          )
        `)
        .eq('id', previousVehicleId)
        .single();
      
      previousCategoryName = previousVehicle?.pricing_category_vehicles?.[0]?.pricing_categories?.name;
    }

    const { data: newVehicle } = await supabase
      .from('vehicles')
      .select(`
        pricing_category_vehicles!inner(
          pricing_categories!inner(name)
        )
      `)
      .eq('id', newVehicleId)
      .single();
    
    newCategoryName = newVehicle?.pricing_category_vehicles?.[0]?.pricing_categories?.name;

    // Store the operation
    const { data: operation, error: operationError } = await supabase
      .from('vehicle_assignment_operations')
      .insert({
        booking_id: bookingId,
        operation_type: operationType,
        previous_vehicle_id: previousVehicleId,
        new_vehicle_id: newVehicleId,
        previous_category_name: previousCategoryName,
        new_category_name: newCategoryName,
        driver_id: driverId,
        price_difference: priceDifference || 0,
        payment_amount: paymentAmount,
        coupon_code: couponCode,
        refund_amount: refundAmount,
        customer_email: customerEmail,
        bcc_email: bccEmail,
        status: 'completed'
      })
      .select()
      .single();

    if (operationError) {
      console.error('Error storing assignment operation:', operationError);
      return NextResponse.json(
        { error: 'Failed to store assignment operation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      operationId: operation.id,
      message: 'Assignment operation stored successfully'
    });

  } catch (error) {
    console.error('Error storing assignment operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
