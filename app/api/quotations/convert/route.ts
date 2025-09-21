import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-client';

export async function POST(request: NextRequest) {
  try {
    const { quotation_id } = await request.json();
    
    console.log('Converting quotation to booking:', quotation_id);
    
    if (!quotation_id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    console.log('Supabase service client created successfully');

    // Get the quotation details with items
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (*),
        customers (*)
      `)
      .eq('id', quotation_id)
      .single();

    if (quotationError || !quotation) {
      console.error('Error fetching quotation:', quotationError);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    console.log('Quotation found:', {
      id: quotation.id,
      status: quotation.status,
      customer_name: quotation.customer_name,
      items_count: quotation.quotation_items?.length || 0
    });

    // Check if quotation is approved or paid (either by status or by timestamps)
    const isApproved = quotation.status === 'approved' || quotation.approved_at;
    const isPaid = quotation.status === 'paid' || quotation.payment_completed_at;
    
    if (!isApproved && !isPaid) {
      return NextResponse.json(
        { error: 'Only approved or paid quotations can be converted to bookings' },
        { status: 400 }
      );
    }

    // Check if booking already exists by looking for quotation_id in meta field
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id, meta')
      .not('meta', 'is', null);

    // Check if any existing booking has this quotation_id in meta
    const existingBooking = existingBookings?.find(booking => 
      booking.meta && typeof booking.meta === 'object' && 
      'quotation_id' in booking.meta && 
      (booking.meta as any).quotation_id === quotation_id
    );

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Booking already exists for this quotation' },
        { status: 400 }
      );
    }

    // Get quotation items (services)
    const quotationItems = quotation.quotation_items || [];
    
    if (quotationItems.length === 0) {
      return NextResponse.json(
        { error: 'No services found in quotation' },
        { status: 400 }
      );
    }

    console.log(`Creating ${quotationItems.length} bookings for services`);

    // Get pricing categories to map category IDs to names
    const { data: pricingCategories, error: categoriesError } = await supabase
      .from('pricing_categories')
      .select('id, name')
      .eq('is_active', true);

    if (categoriesError) {
      console.warn('Warning: Could not fetch pricing categories:', categoriesError);
    }

    // Create a map of category ID to name
    const categoryMap = new Map();
    if (pricingCategories) {
      pricingCategories.forEach(category => {
        categoryMap.set(category.id, category.name);
      });
    }

    // Find a matching vehicle for the quotation using the proper vehicle category relationship
    let assignedVehicleId = null;
    const vehicleCategoryId = quotation.vehicle_category || quotationItems[0]?.vehicle_category;
    const vehicleType = quotation.vehicle_type || quotationItems[0]?.vehicle_type;
    
    if (vehicleCategoryId) {
      console.log(`Looking for vehicle in category: ${vehicleCategoryId}`);
      
      // First try to find vehicle by category and exact model match
      // Clean the vehicle type for better matching
      const cleanVehicleType = vehicleType?.trim().replace(/\s+/g, ' ') || '';
      console.log(`Looking for vehicle type: "${vehicleType}" -> cleaned: "${cleanVehicleType}"`);
      
      const { data: categoryMatches, error: categoryError } = await supabase
        .from('pricing_category_vehicles')
        .select(`
          vehicle_id,
          vehicles!inner(id, brand, model, plate_number, status)
        `)
        .eq('category_id', vehicleCategoryId)
        .eq('vehicles.status', 'active')
        .or(`vehicles.model.ilike.%${cleanVehicleType}%,vehicles.model.ilike.%${cleanVehicleType.trim()}%`);
      
      if (!categoryError && categoryMatches && categoryMatches.length > 0) {
        assignedVehicleId = categoryMatches[0].vehicle_id;
        const vehicle = categoryMatches[0].vehicles;
        console.log(`Found exact model match in category: ${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})`);
      } else {
        // Fallback to any vehicle in the category
        const { data: anyCategoryVehicle, error: anyCategoryError } = await supabase
          .from('pricing_category_vehicles')
          .select(`
            vehicle_id,
            vehicles!inner(id, brand, model, plate_number, status)
          `)
          .eq('category_id', vehicleCategoryId)
          .eq('vehicles.status', 'active')
          .limit(1);
        
        if (!anyCategoryError && anyCategoryVehicle && anyCategoryVehicle.length > 0) {
          assignedVehicleId = anyCategoryVehicle[0].vehicle_id;
          const vehicle = anyCategoryVehicle[0].vehicles;
          console.log(`Found category vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})`);
        } else {
          console.log(`No vehicles found in category: ${vehicleCategoryId}`);
        }
      }
    } else if (vehicleType) {
      // Fallback to text-based matching if no category
      console.log(`No vehicle category, falling back to text matching for: ${vehicleType}`);
      
      const { data: exactMatches, error: exactError } = await supabase
        .from('vehicles')
        .select('id, brand, model, plate_number, status')
        .eq('status', 'active')
        .ilike('model', `%${vehicleType}%`);
      
      if (!exactError && exactMatches && exactMatches.length > 0) {
        assignedVehicleId = exactMatches[0].id;
        console.log(`Found text match: ${exactMatches[0].brand} ${exactMatches[0].model} (${exactMatches[0].plate_number})`);
      }
    }

    const createdBookings = [];
    const baseQuotationNumber = quotation.quote_number || Math.floor(Math.random() * 1000000);

    // Create a booking for each service
    for (let i = 0; i < quotationItems.length; i++) {
      const item = quotationItems[i];
      
      // Use service type for both service_name and service_type (clean, not full description)
      const serviceType = item.service_type_name || quotation.service_type || `Service ${i + 1} from Quotation`;
      
      // Get vehicle information from the item
      const vehicleType = item.vehicle_type || quotation.vehicle_type || 'Standard Vehicle';
      const vehicleCategoryId = item.vehicle_category || quotation.vehicle_category || 'Standard';
      const vehicleCategory = categoryMap.get(vehicleCategoryId) || vehicleCategoryId;
      
      // Extract vehicle make and model from vehicle_type
      const vehicleParts = vehicleType.split(' ');
      const vehicleMake = vehicleParts[0] || 'Unknown';
      const vehicleModel = vehicleParts.slice(1).join(' ') || 'Unknown';
      
      // Calculate item total (including time-based adjustments)
      const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
      const timeAdjustment = item.time_based_adjustment ? 
        itemBasePrice * (item.time_based_adjustment / 100) : 0;
      const itemTotal = itemBasePrice + timeAdjustment;

      // Calculate proportional amount for this service
      const totalQuotationAmount = quotation.total_amount || quotation.amount || 0;
      const proportionalAmount = quotationItems.length > 1 ? 
        (itemTotal / totalQuotationAmount) * totalQuotationAmount : totalQuotationAmount;

      // Get pickup and dropoff locations from quotation item (preferred) or quotation
      const pickupLocation = item.pickup_location || quotation.pickup_location || 'Location to be confirmed - Please edit booking details';
      const dropoffLocation = item.dropoff_location || quotation.dropoff_location || 'Location to be confirmed - Please edit booking details';
      
      // Get passenger and bag counts from quotation item
      const numberOfPassengers = item.number_of_passengers || quotation.passenger_count || null;
      const numberOfBags = item.number_of_bags || null;
      
      // Get flight information from quotation item
      const flightNumber = item.flight_number || null;
      const terminal = item.terminal || null;

      // Create booking for this service
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          wp_id: `QUO-${baseQuotationNumber}-${i + 1}`,
          customer_id: quotation.customer_id, // Add the customer_id from quotation
          customer_name: quotation.customer_name,
          customer_email: quotation.customer_email,
          customer_phone: quotation.customer_phone,
          service_name: serviceType,
          service_id: item.service_type_id || quotation.service_type_id,
          service_type: serviceType,
          vehicle_id: assignedVehicleId, // Assign the matching vehicle if found
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_capacity: 4, // Default capacity, should be fetched from vehicle data
          date: item.pickup_date || quotation.pickup_date || new Date().toISOString().split('T')[0],
          time: item.pickup_time || quotation.pickup_time || '09:00:00',
          status: 'confirmed',
          price_amount: proportionalAmount,
          price_currency: quotation.currency || 'JPY',
          payment_status: 'Payment Complete',
          payment_method: 'Omise',
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          number_of_passengers: numberOfPassengers,
          number_of_bags: numberOfBags,
          flight_number: flightNumber,
          terminal: terminal,
          distance: '0', // Default distance as string
          duration: `${item.duration_hours || quotation.duration_hours || 1}h`,
          notes: `Converted from quotation #${quotation.quote_number || quotation.id} - Service ${i + 1} of ${quotationItems.length}.${numberOfPassengers ? ` Passengers: ${numberOfPassengers}` : ''}${numberOfBags ? ` Bags: ${numberOfBags}` : ''}${flightNumber ? ` Flight: ${flightNumber}` : ''}${terminal ? ` Terminal: ${terminal}` : ''}`,
          customer_notes: quotation.customer_notes || null,
          merchant_notes: quotation.merchant_notes || null,
          billing_company_name: quotation.billing_company_name,
          billing_tax_number: quotation.billing_tax_number,
          billing_street_name: quotation.billing_street_name,
          billing_street_number: quotation.billing_street_number,
          billing_city: quotation.billing_city,
          billing_state: quotation.billing_state,
          billing_postal_code: quotation.billing_postal_code,
          billing_country: quotation.billing_country,
          created_by: quotation.created_by, // Copy the created_by from the quotation
          meta: {
            quotation_id: quotation_id,
            service_index: i,
            total_services: quotationItems.length,
            original_item_amount: itemTotal,
            proportional_amount: proportionalAmount,
            vehicle_type: vehicleType,
            vehicle_category: vehicleCategory,
            service_type_id: item.service_type_id,
            duration_hours: item.duration_hours,
            service_days: item.service_days,
            hours_per_day: item.hours_per_day,
            time_based_adjustment: item.time_based_adjustment,
            pickup_location: pickupLocation,
            dropoff_location: dropoffLocation,
            number_of_passengers: numberOfPassengers,
            number_of_bags: numberOfBags,
            flight_number: flightNumber,
            terminal: terminal,
            quotation_items: [item], // Store only this item
            conversion_date: new Date().toISOString(),
            is_multi_service_booking: quotationItems.length > 1,
            assigned_vehicle_id: assignedVehicleId,
            auto_assigned_vehicle: !!assignedVehicleId
          }
        })
        .select()
        .single();

      if (bookingError) {
        console.error(`Error creating booking for service ${i + 1}:`, bookingError);
        return NextResponse.json(
          { error: `Failed to create booking for service ${i + 1}` },
          { status: 500 }
        );
      }

      createdBookings.push(booking);
      console.log(`Booking created for service ${i + 1}:`, booking.id);
    }

    console.log(`Successfully created ${createdBookings.length} bookings`);

    // Update quotation status to 'converted'
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', quotation_id);

    if (updateError) {
      console.error('Error updating quotation status:', updateError);
      // Continue anyway as the bookings were created
    }

    // Create activity record
    try {
      const { error: activityError } = await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotation_id,
          action: 'converted_to_booking',
          details: { 
            booking_ids: createdBookings.map(b => b.id),
            total_bookings: createdBookings.length,
            action_type: 'conversion',
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      if (activityError) {
        console.error('Error creating activity record:', activityError);
        // Continue anyway as the main conversion was successful
      } else {
        console.log('Activity record created successfully');
      }
    } catch (activityError) {
      console.error('Error creating activity record:', activityError);
      // Continue anyway as the main conversion was successful
    }

    console.log('Quotation conversion completed successfully');
    return NextResponse.json({
      success: true,
      booking_ids: createdBookings.map(b => b.id),
      booking_wp_ids: createdBookings.map(b => b.wp_id),
      total_bookings: createdBookings.length,
      message: `Quotation successfully converted to ${createdBookings.length} booking${createdBookings.length > 1 ? 's' : ''}`
    });

  } catch (error) {
    console.error('Error converting quotation to booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 