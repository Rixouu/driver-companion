import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { currentVehicleId, newVehicleId, serviceType } = await request.json();
    const { id: bookingId } = await params;

    if (!currentVehicleId || !newVehicleId) {
      return NextResponse.json(
        { error: 'Both current and new vehicle IDs are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get pricing for both vehicles - try multiple service types
    const serviceTypes = [serviceType, 'Airport Transfer', 'airport transfer', 'Airport Transfer Haneda'];
    const { data: pricingData, error: pricingError } = await supabase
      .from('pricing_items')
      .select(`
        vehicle_id,
        price,
        currency,
        service_type,
        pricing_categories!inner(
          name,
          sort_order
        )
      `)
      .in('vehicle_id', [currentVehicleId, newVehicleId])
      .in('service_type', serviceTypes)
      .eq('is_active', true);

    if (pricingError) {
      console.error('Error fetching pricing data:', pricingError);
      return NextResponse.json(
        { error: 'Failed to fetch pricing data' },
        { status: 500 }
      );
    }

    // Separate current and new vehicle pricing
    const currentVehiclePricing = pricingData?.find(p => p.vehicle_id === currentVehicleId);
    const newVehiclePricing = pricingData?.find(p => p.vehicle_id === newVehicleId);

    // If no pricing found, try to get any pricing for these vehicles
    let currentPrice = currentVehiclePricing?.price || 0;
    let newPrice = newVehiclePricing?.price || 0;

    if (!currentPrice || !newPrice) {
      console.log('No specific pricing found, trying to get any pricing for vehicles');
      const { data: fallbackPricing } = await supabase
        .from('pricing_items')
        .select('vehicle_id, price, currency')
        .in('vehicle_id', [currentVehicleId, newVehicleId])
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(2);

      if (fallbackPricing) {
        const currentFallback = fallbackPricing.find(p => p.vehicle_id === currentVehicleId);
        const newFallback = fallbackPricing.find(p => p.vehicle_id === newVehicleId);
        
        if (currentFallback) currentPrice = currentFallback.price;
        if (newFallback) newPrice = newFallback.price;
      }
    }

    // Calculate price difference
    const priceDifference = Number(newPrice) - Number(currentPrice);

    console.log('Pricing calculation:', {
      currentVehicleId,
      newVehicleId,
      currentPrice: Number(currentPrice),
      newPrice: Number(newPrice),
      priceDifference: Number(priceDifference)
    });

    return NextResponse.json({
      success: true,
      currentPrice: Number(currentPrice),
      newPrice: Number(newPrice),
      priceDifference: Number(priceDifference),
      currentCategory: currentVehiclePricing?.pricing_categories?.name,
      newCategory: newVehiclePricing?.pricing_categories?.name,
      currency: currentVehiclePricing?.currency || 'JPY'
    });

  } catch (error) {
    console.error('Error getting vehicle pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
