import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const supabaseAuth = await getSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && !session?.user && !supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      service_type_id, 
      vehicle_id, 
      duration_hours, 
      service_days = 1, 
      hours_per_day, 
      discount_percentage = 0,
      tax_percentage = 10, // Default 10% Japanese tax
      coupon_code = '',
      date_time
    } = await req.json();

    if (!service_type_id || !vehicle_id || !duration_hours) {
      return NextResponse.json(
        { error: "Missing required fields: service_type_id, vehicle_id, and duration_hours are required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get vehicle information
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .select(`
        id,
        brand,
        model,
        image_url,
        passenger_capacity,
        luggage_capacity,
        pricing_category_vehicles (
          category_id,
          pricing_categories (
            id,
            name
          )
        )
      `)
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicleData) {
      console.error('Vehicle not found:', vehicleError);
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    const vehicleCategory = vehicleData.pricing_category_vehicles?.[0]?.category_id;

    // Query pricing from database using the same logic as quotation system
    let query = supabase
      .from('pricing_items')
      .select(`
        price,
        currency,
        duration_hours,
        pricing_categories (
          name,
          id
        )
      `)
      .eq('service_type_id', service_type_id)
      .eq('vehicle_id', vehicle_id)
      .eq('duration_hours', duration_hours)
      .eq('is_active', true);

    // If vehicle category is provided, filter by it
    if (vehicleCategory) {
      query = query.eq('category_id', vehicleCategory);
    }

    const { data: pricingItems, error: pricingError } = await query;

    let baseAmount = 0;
    let priceSource = 'default';

    if (pricingError) {
      console.error('Pricing query error:', pricingError);
    }

    if (pricingItems && pricingItems.length > 0) {
      // Found exact pricing match
      baseAmount = Number(pricingItems[0].price);
      priceSource = 'database_exact_match';
    } else {
      // Try hourly rate
      let hourlyQuery = supabase
        .from('pricing_items')
        .select('price, currency')
        .eq('service_type_id', service_type_id)
        .eq('vehicle_id', vehicle_id)
        .eq('duration_hours', 1)
        .eq('is_active', true);

      if (vehicleCategory) {
        hourlyQuery = hourlyQuery.eq('category_id', vehicleCategory);
      }

      const { data: hourlyRates, error: hourlyError } = await hourlyQuery;

      if (hourlyRates && hourlyRates.length > 0) {
        const hourlyRate = Number(hourlyRates[0].price);
        priceSource = 'database_hourly_rate';
        
        // Calculate based on service type - use service_type_id to determine if it's charter
        // Charter services typically have service_type_id that includes 'charter' in the name
        // For now, we'll use a simple heuristic based on duration_hours and service_days
        if (service_days > 1 || (hours_per_day && hours_per_day > 1)) {
          // This looks like a charter service
          const effectiveHoursPerDay = hours_per_day || duration_hours;
          const dailyRate = hourlyRate * effectiveHoursPerDay;
          baseAmount = dailyRate * service_days;
        } else {
          // Single trip service
          baseAmount = hourlyRate * duration_hours;
        }
      } else {
        // Fallback pricing
        baseAmount = 32000; // Basic fallback
        priceSource = 'fallback';
      }
    }

    // Apply regular discount
    const regularDiscountAmount = baseAmount * (discount_percentage / 100);
    
    // Apply coupon discount if provided
    let couponDiscountAmount = 0;
    if (coupon_code && coupon_code.trim()) {
      // Query coupon from database
      const { data: couponData, error: couponError } = await supabase
        .from('pricing_promotions')
        .select(`
          id,
          name,
          code,
          discount_type,
          discount_value,
          is_active,
          start_date,
          end_date,
          maximum_discount,
          minimum_amount
        `)
        .eq('code', coupon_code.trim())
        .eq('is_active', true)
        .single();

      if (!couponError && couponData) {
        // Check if coupon is still valid
        const now = new Date();
        const validFrom = couponData.start_date ? new Date(couponData.start_date) : null;
        const validUntil = couponData.end_date ? new Date(couponData.end_date) : null;

        if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
          // Check minimum amount requirement
          if (!couponData.minimum_amount || baseAmount >= couponData.minimum_amount) {
            if (couponData.discount_type === 'percentage') {
              couponDiscountAmount = baseAmount * (couponData.discount_value / 100);
              if (couponData.maximum_discount && couponDiscountAmount > couponData.maximum_discount) {
                couponDiscountAmount = couponData.maximum_discount;
              }
            } else {
              couponDiscountAmount = Math.min(couponData.discount_value, baseAmount);
            }
          }
        }
      }
    }
    
    const totalDiscountAmount = regularDiscountAmount + couponDiscountAmount;
    const amountAfterDiscount = baseAmount - totalDiscountAmount;
    
    // Apply tax
    const taxAmount = amountAfterDiscount * (tax_percentage / 100);
    const totalAmount = amountAfterDiscount + taxAmount;

    return NextResponse.json({
      baseAmount,
      discountAmount: totalDiscountAmount,
      regularDiscountAmount,
      couponDiscountAmount,
      couponDiscountPercentage: couponDiscountAmount > 0 ? (couponDiscountAmount / baseAmount) * 100 : 0,
      taxAmount,
      totalAmount,
      currency: 'JPY',
      priceSource,
      category: vehicleData.pricing_category_vehicles?.[0]?.pricing_categories?.name || 'Standard',
      vehicle: {
        brand: vehicleData.brand || '',
        model: vehicleData.model || '',
        image_url: vehicleData.image_url || '',
        passenger_capacity: vehicleData.passenger_capacity || 0,
        luggage_capacity: vehicleData.luggage_capacity || 0
      }
    });

  } catch (error) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}
