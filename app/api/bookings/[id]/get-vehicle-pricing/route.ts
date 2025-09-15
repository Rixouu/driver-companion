import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { currentVehicleId, newVehicleId, serviceType, serviceDays, hoursPerDay, durationHours } = await request.json();
    const { id: bookingId } = await params;

    if (!currentVehicleId || !newVehicleId) {
      return NextResponse.json(
        { error: 'Both current and new vehicle IDs are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get the service type ID from the service name
    const { data: serviceTypeData } = await supabase
      .from('service_types')
      .select('id')
      .eq('name', serviceType)
      .single();

    const serviceTypeId = serviceTypeData?.id;

    if (!serviceTypeId) {
      console.error('Service type not found:', serviceType);
      return NextResponse.json(
        { error: 'Service type not found' },
        { status: 400 }
      );
    }

    // Check if this is a Charter Service
    const isCharterService = serviceType?.toLowerCase().includes('charter');
    
    let currentPrice = 0;
    let newPrice = 0;
    let currentCategory = '';
    let newCategory = '';
    let currency = 'JPY';

    if (isCharterService) {
      // For Charter Services, use the actual database pricing structure
      // The database has specific pricing for different duration_hours (1, 4, 6, 8, 10, 12)
      console.log('Calculating Charter Service pricing from database:', {
        serviceDays,
        hoursPerDay,
        durationHours,
        currentVehicleId,
        newVehicleId
      });

      // For Charter Services, we need to find the daily rate (hours_per_day) and multiply by service_days
      const effectiveHoursPerDay = hoursPerDay || durationHours || 1;
      const effectiveServiceDays = serviceDays || 1;

      console.log('Charter Service duration calculation:', {
        effectiveHoursPerDay,
        effectiveServiceDays,
        note: 'Will find pricing for hours_per_day and multiply by service_days'
      });

      // Get all pricing entries for both vehicles
      const { data: allPricing, error: pricingError } = await supabase
        .from('pricing_items')
        .select(`
          vehicle_id,
          price,
          currency,
          duration_hours,
          pricing_categories!inner(
            name,
            sort_order
          )
        `)
        .in('vehicle_id', [currentVehicleId, newVehicleId])
        .eq('service_type_id', serviceTypeId)
        .eq('is_active', true)
        .order('duration_hours', { ascending: true });

      if (pricingError) {
        console.error('Error fetching Charter Service pricing:', pricingError);
        return NextResponse.json(
          { error: 'Failed to fetch Charter Service pricing' },
          { status: 500 }
        );
      }

      // Find pricing for each vehicle
      const currentVehiclePricing = allPricing?.filter(p => p.vehicle_id === currentVehicleId);
      const newVehiclePricing = allPricing?.filter(p => p.vehicle_id === newVehicleId);

      if (!currentVehiclePricing?.length || !newVehiclePricing?.length) {
        console.error('Could not find pricing for vehicles:', {
          currentVehicleId,
          newVehicleId,
          currentPricingCount: currentVehiclePricing?.length || 0,
          newPricingCount: newVehiclePricing?.length || 0
        });
        return NextResponse.json(
          { error: 'Could not find pricing for vehicles' },
          { status: 400 }
        );
      }

      // Function to find the daily rate for Charter Services
      const findDailyRate = (pricingEntries: any[], targetHoursPerDay: number) => {
        // First try to find exact match for the hours per day
        let exactMatch = pricingEntries.find(p => p.duration_hours === targetHoursPerDay);
        if (exactMatch) return exactMatch;

        // If no exact match, find the closest duration that's >= targetHoursPerDay
        let closestMatch = pricingEntries
          .filter(p => p.duration_hours >= targetHoursPerDay)
          .sort((a, b) => a.duration_hours - b.duration_hours)[0];

        if (closestMatch) return closestMatch;

        // If no match >= targetHoursPerDay, use the highest available duration and scale it
        const highestDuration = pricingEntries
          .sort((a, b) => b.duration_hours - a.duration_hours)[0];

        if (highestDuration) {
          // Scale the price based on the duration ratio
          const scaleFactor = targetHoursPerDay / highestDuration.duration_hours;
          return {
            ...highestDuration,
            price: (Number(highestDuration.price) * scaleFactor).toString(),
            duration_hours: targetHoursPerDay // Mark as scaled
          };
        }

        return null;
      };

      // Find daily rates for current and new vehicles
      const currentDailyRate = findDailyRate(currentVehiclePricing, effectiveHoursPerDay);
      const newDailyRate = findDailyRate(newVehiclePricing, effectiveHoursPerDay);

      if (!currentDailyRate || !newDailyRate) {
        console.error('Could not find daily rates for vehicles:', {
          effectiveHoursPerDay,
          currentDailyRate: !!currentDailyRate,
          newDailyRate: !!newDailyRate
        });
        return NextResponse.json(
          { error: 'Could not find daily rates for the requested hours per day' },
          { status: 400 }
        );
      }

      // Calculate total prices: daily rate × service days
      const currentDailyPrice = Number(currentDailyRate.price);
      const newDailyPrice = Number(newDailyRate.price);
      
      currentPrice = currentDailyPrice * effectiveServiceDays;
      newPrice = newDailyPrice * effectiveServiceDays;
      currentCategory = currentDailyRate.pricing_categories?.name || '';
      newCategory = newDailyRate.pricing_categories?.name || '';
      currency = currentDailyRate.currency || 'JPY';

      console.log('Charter Service pricing calculation:', {
        effectiveHoursPerDay,
        effectiveServiceDays,
        currentDailyRate: {
          duration_hours: currentDailyRate.duration_hours,
          daily_price: currentDailyPrice,
          category: currentCategory
        },
        newDailyRate: {
          duration_hours: newDailyRate.duration_hours,
          daily_price: newDailyPrice,
          category: newCategory
        },
        totalPrices: {
          current: currentPrice,
          new: newPrice
        }
      });
    } else {
      // For non-Charter Services, use the original logic
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_items')
        .select(`
          vehicle_id,
          price,
          currency,
          service_type_id,
          pricing_categories!inner(
            name,
            sort_order
          )
        `)
        .in('vehicle_id', [currentVehicleId, newVehicleId])
        .eq('service_type_id', serviceTypeId)
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
      currentPrice = currentVehiclePricing?.price || 0;
      newPrice = newVehiclePricing?.price || 0;

      if (!currentPrice || !newPrice) {
        console.log('No specific pricing found, trying to get any pricing for vehicles with service type:', serviceType);
        const { data: fallbackPricing } = await supabase
          .from('pricing_items')
          .select('vehicle_id, price, currency')
          .in('vehicle_id', [currentVehicleId, newVehicleId])
          .eq('service_type_id', serviceTypeId)
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

      currentCategory = currentVehiclePricing?.pricing_categories?.name || '';
      newCategory = newVehiclePricing?.pricing_categories?.name || '';
      currency = currentVehiclePricing?.currency || 'JPY';
    }

    // Calculate price difference
    const priceDifference = Number(newPrice) - Number(currentPrice);

    console.log('Pricing calculation:', {
      serviceType,
      serviceTypeId,
      currentVehicleId,
      newVehicleId,
      currentPrice: Number(currentPrice),
      newPrice: Number(newPrice),
      priceDifference: Number(priceDifference),
      pricingDataFound: 'Debug info logged'
    });

    return NextResponse.json({
      success: true,
      currentPrice: Number(currentPrice),
      newPrice: Number(newPrice),
      priceDifference: Number(priceDifference),
      currentCategory,
      newCategory,
      currency,
      pricingDataFound: isCharterService ? 'Charter Service pricing calculated' : 'Standard pricing used'
    });

  } catch (error) {
    console.error('Error getting vehicle pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
