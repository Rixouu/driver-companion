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
      date_time,
      pickup_date,
      pickup_time
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

    // Apply time-based pricing adjustment if pickup date and time are provided
    let timeBasedAdjustment = 0;
    let appliedTimeBasedRule = null;
    
    if (pickup_date && pickup_time) {
      try {
        // Create a date object from pickup_date and pickup_time
        const pickupDateTime = new Date(`${pickup_date}T${pickup_time}`);
        
        // Get the day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = pickupDateTime.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const day = dayNames[dayOfWeek];
        
        // Format time as HH:MM for comparison with rule times
        const hours = pickupDateTime.getHours().toString().padStart(2, '0');
        const minutes = pickupDateTime.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;
        
        // Fetch active time-based pricing rules
        const { data: timeBasedRules, error: timeBasedError } = await supabase
          .from('pricing_time_based_rules')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });
        
        if (!timeBasedError && timeBasedRules && timeBasedRules.length > 0) {
          // Find applicable rules
          const applicableRules = timeBasedRules.filter(rule => {
            // Check if rule applies to this category/service type
            if (rule.category_id && vehicleCategory && rule.category_id !== vehicleCategory) {
              return false;
            }
            if (rule.service_type_id && rule.service_type_id !== service_type_id) {
              return false;
            }
            
            // Check if rule applies to this day
            const applicableDays = rule.days_of_week || [];
            if (applicableDays.length > 0 && !applicableDays.includes(day)) {
              return false;
            }
            
            // Check if rule applies to this time
            if (rule.start_time && rule.end_time) {
              const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
              const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
              
              const startTime = startHours * 60 + startMinutes;
              const endTime = endHours * 60 + endMinutes;
              const timeInMinutes = pickupDateTime.getHours() * 60 + pickupDateTime.getMinutes();
              
              // Handle overnight time ranges (e.g., 22:00-06:00)
              if (startTime > endTime) {
                return timeInMinutes >= startTime || timeInMinutes <= endTime;
              } else {
                return timeInMinutes >= startTime && timeInMinutes <= endTime;
              }
            }
            
            return true;
          });
          
          // Apply the highest priority rule
          if (applicableRules.length > 0) {
            const rule = applicableRules[0];
            timeBasedAdjustment = baseAmount * (rule.adjustment_percentage / 100);
            appliedTimeBasedRule = {
              name: rule.name,
              adjustment_percentage: rule.adjustment_percentage,
              description: rule.description,
              start_time: rule.start_time,
              end_time: rule.end_time,
              days_of_week: rule.days_of_week
            };
            
            console.log(`🕐 [TIME-BASED] Applied rule: ${rule.name} (${rule.adjustment_percentage}%)`);
          }
        }
      } catch (error) {
        console.error('Error applying time-based pricing:', error);
      }
    }
    
    // Apply time-based adjustment to base amount
    const adjustedBaseAmount = baseAmount + timeBasedAdjustment;

    // Apply regular discount
    const regularDiscountAmount = adjustedBaseAmount * (discount_percentage / 100);
    
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
          if (!couponData.minimum_amount || adjustedBaseAmount >= couponData.minimum_amount) {
            if (couponData.discount_type === 'percentage') {
              couponDiscountAmount = adjustedBaseAmount * (couponData.discount_value / 100);
              if (couponData.maximum_discount && couponDiscountAmount > couponData.maximum_discount) {
                couponDiscountAmount = couponData.maximum_discount;
              }
            } else {
              couponDiscountAmount = Math.min(couponData.discount_value, adjustedBaseAmount);
            }
          }
        }
      }
    }
    
    const totalDiscountAmount = regularDiscountAmount + couponDiscountAmount;
    const amountAfterDiscount = adjustedBaseAmount - totalDiscountAmount;
    
    // Apply tax
    const taxAmount = amountAfterDiscount * (tax_percentage / 100);
    const totalAmount = amountAfterDiscount + taxAmount;

    return NextResponse.json({
      baseAmount,
      timeBasedAdjustment,
      adjustedBaseAmount,
      appliedTimeBasedRule,
      discountAmount: totalDiscountAmount,
      regularDiscountAmount,
      couponDiscountAmount,
      couponDiscountPercentage: couponDiscountAmount > 0 ? (couponDiscountAmount / adjustedBaseAmount) * 100 : 0,
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
