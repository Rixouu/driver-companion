import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { generateOptimizedPdfFromHtml } from "@/lib/optimized-html-pdf-generator";
import { getTeamAddressHtml, getTeamFooterHtml } from "@/lib/team-addresses";
import { Resend } from "resend";
import { OmiseClient } from "@/lib/omise-client";
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';

const resend = new Resend(process.env.RESEND_API_KEY);

async function generateBookingInvoiceHtml(
  booking: any, 
  language: 'en' | 'ja' = 'en',
  operation_type?: string,
  previous_vehicle_name?: string,
  new_vehicle_name?: string,
  coupon_code?: string,
  refund_amount?: number,
  payment_amount?: number,
  previousVehicleInfo?: any,
  newVehicleInfo?: any
): Promise<string> {
  const isJapanese = language === 'ja';
  const localeCode = isJapanese ? 'ja-JP' : 'en-US';
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Safe text encoding function
  const safeEncodeText = (text: any) => {
    if (!text) return '';
    return String(text).replace(/[<>&"']/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return match;
      }
    });
  };

  // Calculate totals using the same logic as quotation system
  const calculateTotals = async () => {
    // For full quote, use the payment_amount as the total amount
    if (!operation_type && payment_amount) {
      // For full quote, payment_amount is the final total after all calculations
      // We need to work backwards to show the proper breakdown
      const refundDiscount = refund_amount || 0;
      const totalBeforeRefund = payment_amount + refundDiscount;
      const taxAmount = Math.round(totalBeforeRefund * 0.1 / 1.1); // Tax is 10% of the subtotal
      const baseAmount = totalBeforeRefund - taxAmount;
      
      return {
        baseAmount: baseAmount,
        regularDiscount: 0,
        couponDiscount: refundDiscount,
        couponDiscountPercentage: 0,
        totalDiscount: refundDiscount,
        subtotal: baseAmount,
        taxAmount: taxAmount,
        finalTotal: payment_amount
      };
    }
    
    // For upgrade-only, downgrade-only, and update-only, use the amount WITHOUT tax
    if ((operation_type === 'upgrade' || operation_type === 'update') && payment_amount) {
      return {
        baseAmount: payment_amount,
        regularDiscount: 0,
        couponDiscount: 0,
        couponDiscountPercentage: 0,
        totalDiscount: 0,
        subtotal: payment_amount,
        taxAmount: 0,
        finalTotal: payment_amount
      };
    }
    
    if (operation_type === 'downgrade' && refund_amount) {
      // For downgrade-only payments, use the downgrade amount WITHOUT tax (same as upgrade-only)
      return {
        baseAmount: refund_amount,
        regularDiscount: 0,
        couponDiscount: 0,
        couponDiscountPercentage: 0,
        totalDiscount: 0,
        subtotal: refund_amount,
        taxAmount: 0,
        finalTotal: refund_amount
      };
    }

    // For full quotes with upgrades/downgrades, show complete breakdown
    if (!operation_type && (payment_amount || refund_amount)) {
      // This is a full quote with upgrade/downgrade
      const upgradeDowngradeAmount = payment_amount || refund_amount || 0;
      const isDowngrade = refund_amount && !payment_amount;
      
      // Get the base service amount (previous service)
      let baseServiceAmount = 0;
      if (booking.calculated_pricing) {
        baseServiceAmount = booking.calculated_pricing.baseAmount || 0;
      } else {
        baseServiceAmount = booking.base_amount || booking.price_amount || booking.amount || 0;
      }
      
      // Calculate tax on the base service amount
      const taxPercentage = booking.tax_percentage || 10;
      const baseTaxAmount = Math.round(baseServiceAmount * taxPercentage / 100);
      const baseSubtotal = baseServiceAmount;
      
      // Calculate totals
      const subtotal = baseSubtotal + upgradeDowngradeAmount;
      const taxAmount = Math.round(subtotal * taxPercentage / 100);
      const finalTotal = subtotal + taxAmount;
      
      return {
        baseAmount: baseServiceAmount,
        regularDiscount: 0,
        couponDiscount: 0,
        couponDiscountPercentage: 0,
        totalDiscount: 0,
        subtotal: subtotal,
        taxAmount: taxAmount,
        finalTotal: finalTotal,
        upgradeDowngradeAmount: upgradeDowngradeAmount,
        isDowngrade: isDowngrade
      };
    }

    // For regular invoices, use the original pricing logic
    // Try to get pricing from the calculated pricing data first
    let baseAmount = 0;

    // Check if we have calculated pricing data
    if (booking.calculated_pricing) {
      baseAmount = booking.calculated_pricing.baseAmount || 0;
    } else {
      // Use base_amount if available, otherwise fallback to price_amount
      baseAmount = booking.base_amount || booking.price_amount || booking.amount || 0;
      
      // If no stored pricing, get it directly from the database
      if (baseAmount === 0 && booking.service_name && booking.vehicle_id) {
        try {
          const supabase = await getSupabaseServerClient();
          
          // Get service type ID from service name
          const { data: serviceTypes, error: serviceError } = await supabase
            .from('service_types')
            .select('id')
            .ilike('name', `%${booking.service_name}%`)
            .limit(1);
          
          if (serviceError) {
            throw new Error(`Service type lookup error: ${serviceError.message}`);
          }
          
          if (serviceTypes && serviceTypes.length > 0) {
            const serviceTypeId = serviceTypes[0].id;
            
            // Query pricing directly from database
            const { data: pricingItems, error: pricingError } = await supabase
              .from('pricing_items')
              .select('price, currency')
              .eq('service_type_id', serviceTypeId)
              .eq('vehicle_id', booking.vehicle_id)
              .eq('duration_hours', 1)
              .eq('is_active', true);
            
            if (pricingError) {
              console.error('Pricing query error:', pricingError);
              throw new Error('Failed to fetch pricing from database');
            } else if (pricingItems && pricingItems.length > 0) {
              baseAmount = Number(pricingItems[0].price);
            } else {
              throw new Error('No pricing found in database');
            }
          } else {
            throw new Error('Service type not found');
          }
        } catch (error) {
          console.error('Error fetching pricing from database:', error);
          // Use fallback pricing like email generation does
          baseAmount = booking.price_amount || 0;
          if (baseAmount === 0) {
            console.error('No pricing data available for booking');
            throw new Error('Unable to determine pricing for this booking');
          }
        }
      }
    }
    
    const discountPercentage = booking.discount_percentage || 0;
    const taxPercentage = booking.tax_percentage || 10; // Default 10% Japanese tax
    const couponCode = booking.coupon_code || '';

    // Calculate regular discount
    const regularDiscount = baseAmount * (discountPercentage / 100);

    // Calculate coupon discount from coupon code
    let couponDiscount = 0;
    let couponDiscountPercentage = 0;
    if (couponCode) {
      // First try to use stored coupon discount percentage
      if (booking.coupon_discount_percentage) {
        couponDiscountPercentage = booking.coupon_discount_percentage;
        couponDiscount = baseAmount * (booking.coupon_discount_percentage / 100);
      } else {
        // Fallback to calculating from coupon code
        try {
          const supabase = await getSupabaseServerClient();
          const { data: couponData } = await supabase
            .from('pricing_promotions')
            .select('discount_type, discount_value, is_active, start_date, end_date, maximum_discount, minimum_amount')
            .eq('code', couponCode)
            .eq('is_active', true)
            .single();

          if (couponData) {
            const now = new Date();
            const validFrom = couponData.start_date ? new Date(couponData.start_date) : null;
            const validUntil = couponData.end_date ? new Date(couponData.end_date) : null;

            if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
              if (!couponData.minimum_amount || baseAmount >= couponData.minimum_amount) {
                if (couponData.discount_type === 'percentage') {
                  couponDiscountPercentage = couponData.discount_value;
                  couponDiscount = baseAmount * (couponData.discount_value / 100);
                  if (couponData.maximum_discount && couponDiscount > couponData.maximum_discount) {
                    couponDiscount = couponData.maximum_discount;
                  }
                } else {
                  couponDiscount = Math.min(couponData.discount_value, baseAmount);
                  couponDiscountPercentage = (couponDiscount / baseAmount) * 100;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error validating coupon:', error);
        }
      }
    }

    // Total discount
    const totalDiscount = regularDiscount + couponDiscount;

    // Subtotal after discounts
    const subtotal = Math.max(0, baseAmount - totalDiscount);

    // Tax on subtotal
    const taxAmount = subtotal * (taxPercentage / 100);

    // Final total
    const finalTotal = subtotal + taxAmount;

    return {
      baseAmount,
      regularDiscount,
      couponDiscount,
      couponDiscountPercentage,
      totalDiscount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  const totals = await calculateTotals();
  const bookingNumber = booking.wp_id || booking.id;
  const customerName = booking.customer_name || booking.customers?.name || 'Customer';
  const customerEmail = booking.customer_email || booking.customers?.email || '';
  // Update service name based on operation type
  let serviceName = booking.service_name || 'Transportation Service';
  if (operation_type === 'upgrade') {
    serviceName = `${serviceName} - Vehicle Upgrade`;
  } else if (operation_type === 'downgrade') {
    serviceName = `${serviceName} - Vehicle Refund`;
  } else if (operation_type === 'update') {
    serviceName = `${serviceName} - Vehicle Update`;
  } else if (!operation_type && payment_amount) {
    // For full quote, keep the original service name without modification
    serviceName = booking.service_name || 'Transportation Service';
  }
  const pickupLocation = booking.pickup_location || '';
  const dropoffLocation = booking.dropoff_location || '';
  const date = booking.date || new Date().toISOString().split('T')[0];
  const time = booking.time || '';

  // Determine payment status and operation type
  // Simple logic: if booking status is not 'pending', it's considered PAID
  const isPaid = booking.status !== 'pending';
  let statusText = isPaid ? 'PAID' : 'PENDING PAYMENT';
  let statusColor = isPaid ? '#10b981' : '#f59e0b'; // Green for paid, orange for pending
  
  // Override status for upgrade/downgrade/update operations
  if (operation_type === 'upgrade') {
    statusText = 'UPGRADE';
    statusColor = '#f59e0b'; // Orange for upgrade
  } else if (operation_type === 'downgrade') {
    statusText = 'DOWNGRADE';
    statusColor = '#10b981'; // Green for downgrade
  } else if (operation_type === 'update') {
    statusText = 'UPDATE';
    statusColor = '#0ea5e9'; // Blue for update
  }
  
  const formattedInvoiceId = `INV-${bookingNumber}`;
  const invoiceDate = formatDateDDMMYYYY(new Date());

  return `
    <div style="font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; color: #111827; box-sizing: border-box; width: 100%; margin: 0; padding: 10px 0 0; border-top: 2px solid #FF2600;">
      
      <!-- Logo -->
      <div style="text-align: left; margin: 30px 0; margin-bottom: 30px;">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABSCAMAAACMnfocAAAAolBMVEUAAAD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwD+JwDIfoPiAAAANXRSTlMA/AT3CfMg4RueYA01B1e9E7QrpzCxc5jeb+nQuEM726LL48Ylf0sYjmWI7XhRQOXVkmrCrCp8B9EAAAn6SURBVHja7VuJkqIwEA0gooKKB14gjPc1ro6a//+1JQd0DhW39qitkbdbU5CEdPql091JZlCJEiVKlChRokSJEiVKPIYJTyZ6N3CN3U2t5jfp41txQJStHfed88m27YOz+BjElTfiINXT37VtLMEZ/ngTClIdq1+HVGVDBE4RNtAbwESVvcW1xxz563n9BkawdlJ9MdXeGl2DXi+aTTIOMO65352BPVGfaJ98ratZLOhfApvTMom/NQNmhA2qf2eq1GwGI07Nd/YE7ozpeI1Fj8+fzbHNagfou8KcYYvouHsUHG/MCMbILO6rqPrP4/fFRFT/ZPm4tzGm/uGo9VzJ0KQ/QLra4n41/YoWCA3uioA27B2kamJMEPMaWXs6vYvKs2/WmDoJlaN44ogYhbdPTxa+SU5QH3b2a1eoro7mzsjeksfbYeQ4E08f3cAepW0u6VMtmTsaTjMXpWilrTIki97A+wVjmTL9n3LWTFsRIwiV8h9YR3gRO6oZSvVku0E5AbTkg2y6LvRxqA8ioRVLZNLWOg6U0Z1afL68agQVh8xtcmf+TVNkoEV5WiFTJsBQQCPpWiDAJt1L9XYrJ8AilXXqZw402LpIwRSTb4KstQZ8ogQ0aDNpFGFK2qsLABtZ42YG82FDhQDMAILJj6FIAIDU0XgCBGBKQPpvSAluIVOW+kGLj7y1BoEAsZRKsruoADCGHQt4aHdIRgxJ2B42qkjEjPTaQ6ZGgKaigdtNiYDDYpZiRGTR/2uVAIRiqmmEZPg0ERuZQICKiUBAQsSEJ8zFzN0XDGBLh5u9fSradH4ggEfLJFpjnGERdDqd64jJxha+CgQQ2gjMWmuBMWgkEYBmioWxGaG07JGZt+4svb6ILqIEgKEgt/s5wQYZxFfxInAnhAAvd7nYUtbzRwVGU8eW0qmXU7Vhbbqfc8yEfwABot2s0jdm6jIBJhrfczILyudSoksBEAALyGXf2Rv0HE025QECAqStIHWP0MmSFm8Uo1DCQ3PPDbCBTJUA8rNHh3rTLWBDW56RiD7tPELQOiW2WUhAM51YKHiKS71+xWuNACM8nww+lQmspGDS2w6raUONAB6/aNWaiGYeHQjgMLlOiUIA+Lup5HhBDSDALLaAJlrRgm0BAbU49vo1H8kEsKzAXTbogrXo6Dn8qufFfVe2AJhuIWfg1gwE5NUOkWH7MgE84rE3aDtKC6if/yUCoLMbeoZu26IaLloyAbASd0yTzBO6W4c53r3mA7rSwhpQ6aeKYAGAkBpWTScAnUnNwRfyT5jGXyXAg8WjQY/QO3UJxOyV9xvkHilDHcSAVxcQcqdsygSAmvZGJoDHIIOHZI4bHU4f/YoPgPgEI78fAL+wjetea3XFeC4RYGCnkhW0YbRkP3D4uKyn87SsLxPQU/puMWvWCaApX4qTqxAAr1dhiuD91Sigj+AR3BMJquvUdjdfgUAAmBn0s2akzlrpZ95uwswSCNA3yu6EhwaVgCY364XiBGHG+XKCwNiQ+Ym8aY7YfOQEuUf9vEsAqEZgz8ayE8w7AqED/r6sj3g2Nq9IPsBDCiK+nCEMZruLEFIbjYA11BHMZJ+gZ4KWrxHAxXhsYmL0GB0I+ae+SADzUByV1N7z+V4JyfZaJODkagkmS+s0C9i0mdj+XQswE2yAQ/EgwIoECHnaRCHgmMeAA30P0X1A2hH2d1Ha7SInAOwTXJbBs78uuydpYFglnOhIs68Vd1+cgMCtbTbVfqtuQ5ooEQCfUXK5kzKYP36ZgF0qpraMx23SLSOkYAUcttOKvzuvgAA1HU2AAP8axGatEQmT7kHEv0dAN4s1hp2CjJ/pf/JVAjiWBs6jd+VERM+kfZsCAwhgpkvEGLmYOnoEvvuksHs8zAMBsezNYFX6lxnO4AkETPUQQ6egSgjQt4qnpbodln2HXSNdHOlYLsiUCZgHUYcj6rkCASCF5fCPsyCQxL9KPIEAAzsk0MKUwChWIIQGeUYATetUXEnXEzcnQLxwCnxk6gSAYfKgEkAEfikMKlKMT1REAO3u08GYeXm+G7TY8oaOIRUkm91ol2BDJAB8huZhFiwMSrCDqa6SqTjdmZz3vZgIiZhvqwXnAHWmxtBE/f0YSecBDUHojM8kxXK781F/zr6MwVHvNRcw5jlskxNwitqRQzkBY1EIgPDB1tdApP6lVBjjMGq3aaMVKXxOwCXb97VbQunOHs2TKgTtlZJPbfYJxoLZe8TqdGdbOfHR80yQev0xXV4mMh8SABvgL5ovwOb4xb3AkS0+EjsrqABdtmjSPh/vGNwvcafDAyH3HW0hD6je87B09JAHVHh23npGAHgPFIuZ3Ou7wQra881mITqYYrY6CuP3uznixvBAo4lo4d7u64ApjoyR5BwmAZJBFwDf1UAmyCNq+GwJgCrTPewZf4WAJmdunz4VwI8MbI0a7nTXPkphEMD0b8M3H9tj168fDHwYIB183VBHwgwALACynP0TAiDwLkaQEPwKATzXxjguZgBV+0vkp+Lw4h4B2algRzkAG6Zm0nefrK0IM8QSATw0ULNGWhjUMhTIt3UCKqYEmYDs0Y7pbBTCP5DAt0Zm5r0t+UzUFqc6IG23sruT4C5bAbUbWL5AAIkxNJUJlo8sAGiGczOVgGHhdphfda9cVAA2KHC22rG4Ea58oelaX5bxxJkDnAnTnflh/VgcLbBF66PxtN/tagRA6IUMWyNgthuMBQx2pkpA12AMTOqNuNuvoedwD6Ko6ccww/bzuJSiadOBbcHDu0GDU7BF9wjwHcYAxciUCdAj9FK3AB2WKxHAkmhsMDHF56Imc9k0ZOuQCntqfNHvBvN7qR1SCWDYhKw+BU6aDyzAt1k3HXSPAEOChecKAZSB9IWLeX45Ajdehyz7EYEAcGD3wuXorSpfjlq4l/P5lemAR5VUpVQFIACyVFp+VIZeTbvSkBNgGVZ+IIKWCy6m6HYIci/HR2ZR5qhv/KdYw6TuiZZTo4UBlPR7Ns8lXX7T0oNKcWFNmqoF4HuwhevxFty/sEs46L1YNye1gae/IoLhAEKIeUFHQFD/nLpKmLl1gqA9EPvatLbRLDwHTbQJSOUYqRhGafFF22FFbR3XW4XORDvtqh1LY7vU22GYfKJiDFnkXKOHjmDI1rbHGvwXvwb0R0dxY3Fj29Q+pAVeyOrXhd2C3yho9dcBYl5nwMBO487fC9SGmOv/n0zuX8EXV/I8VhIHb2ixKvvHd9YfoYbBD5TsaPCjRh2L2z1uz5gzM6t9b/0RWl7hTM1ywlmYTITTvNX/4tz+DvhNqAN7QIbsJeiit0DzclaTTfJ6i7/99EPo/DFM5DzrOqii9wGd535jGyzOoyS8fqzWNfRuyK8E/q/E7p/CfGflS5QoUaJEiRIlSpQo8Q3xExvFOQqE/wIGAAAAAElFTkSuQmCC" alt="Driver Logo" style="height: 50px;">
      </div>
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0 0 15px 0; font-size: 24px; font-weight: bold; color: #111827;">
            ${isJapanese ? '請求書' : 'INVOICE'}
          </h1>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${isJapanese ? '請求書番号:' : 'Invoice #:'} ${formattedInvoiceId}
          </p>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${isJapanese ? '請求書発行日:' : 'Invoice Date:'} ${invoiceDate}
          </p>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${isJapanese ? '予約参照:' : 'Booking Ref:'} ${bookingNumber}
          </p>
          <!-- Payment Status Badge -->
          <div style="margin-top: 12px;">
            <div style="display: inline-block; padding: 6px 12px; background: ${statusColor}; border-radius: 4px;">
              <span style="color: white; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                ${isJapanese ? (isPaid ? '支払済み' : '未払い') : statusText}
              </span>
            </div>
          </div>
        </div>
        
        <div style="text-align: right;">
          ${getTeamAddressHtml(booking.team_location || 'thailand', isJapanese)}
        </div>
      </div>
      
      <!-- Billing Address -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: bold;">
          ${isJapanese ? '請求先住所:' : 'BILLING ADDRESS:'}
        </h3>
        <p style="margin: 0 0 3px 0; font-weight: normal; color: #111827; font-size: 13px;">
          ${safeEncodeText(customerName)}
        </p>
        <p style="margin: 0 0 3px 0; color: #111827; font-size: 13px;">
          ${safeEncodeText(customerEmail)}
        </p>
        <p style="margin: 0 0 15px 0; color: #111827; font-size: 13px;">
          ${safeEncodeText(booking.customer_phone || '')}
        </p>
        
        ${booking.billing_company_name ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '会社名:' : 'Company:'}</strong> ${safeEncodeText(booking.billing_company_name)}
          </p>
        ` : ''}
        
        ${booking.billing_tax_number ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '税番号:' : 'Tax ID:'}</strong> ${safeEncodeText(booking.billing_tax_number)}
          </p>
        ` : ''}
        
        ${(booking.billing_street_name || booking.billing_street_number) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '住所:' : 'Address:'}</strong> ${safeEncodeText(booking.billing_street_name || '')} ${safeEncodeText(booking.billing_street_number || '')}
          </p>
        ` : ''}
        
        ${(booking.billing_city || booking.billing_state || booking.billing_postal_code) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '市区町村/都道府県/郵便番号:' : 'City/State/Postal:'}</strong> ${safeEncodeText(booking.billing_city || '')} ${booking.billing_state ? ', ' + safeEncodeText(booking.billing_state) : ''} ${booking.billing_postal_code ? ', ' + safeEncodeText(booking.billing_postal_code) : ''}
          </p>
        ` : ''}
        
        ${booking.billing_country ? `
          <p style="margin: 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '国:' : 'Country:'}</strong> ${safeEncodeText(booking.billing_country)}
          </p>
        ` : ''}
      </div>
      
      <!-- Service Details Table -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
          ${isJapanese ? 'サービス詳細:' : 'SERVICE DETAILS:'}
        </h3>
        <table style="width: 100%; border-collapse: collapse; color: #111827;">
          <thead style="background-color: #f3f3f3;">
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; width: 45%; color: #111827;">
                ${isJapanese ? 'サービス内容' : 'Service Description'}
              </th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; width: 15%; color: #111827;">
                ${isJapanese ? '日付' : 'Date'}
              </th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; width: 15%; color: #111827;">
                ${isJapanese ? '数量' : 'Quantity'}
              </th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; width: 25%; color: #111827;">
                ${isJapanese ? '価格' : 'Price'}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${serviceName}${serviceName === 'Charter Services' && booking.duration_hours > 0 && booking.service_days > 0 ? ` (${booking.service_days} day${booking.service_days > 1 ? 's' : ''}, ${booking.hours_per_day} hour${booking.hours_per_day > 1 ? 's' : ''} per day)` : ''}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${formatDate(date)}
              </td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                1
              </td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${formatCurrency(totals.baseAmount)}
              </td>
            </tr>
            ${totals.upgradeDowngradeAmount ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${totals.isDowngrade ? 
                  `${isJapanese ? '車両ダウングレード' : 'Vehicle Downgrade'}` : 
                  `${isJapanese ? '車両アップグレード' : 'Vehicle Upgrade'}`
                }
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${formatDate(date)}
              </td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                1
              </td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${totals.isDowngrade ? '-' : '+'}${formatCurrency(totals.upgradeDowngradeAmount)}
              </td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
      
      
      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 35px;">
        <table style="width: 300px; border-collapse: collapse;">
          ${!operation_type && totals.regularDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #e53e3e;">
                ${isJapanese ? `割引 (${booking.discount_percentage || 0}%):` : `Discount (${booking.discount_percentage || 0}%):`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #e53e3e;">
                -${formatCurrency(totals.regularDiscount)}
              </td>
            </tr>
          ` : ''}
          ${!operation_type && totals.couponDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #10b981; white-space: nowrap;">
                ${isJapanese ? `クーポン割引 (${booking.coupon_code || ''})${totals.couponDiscountPercentage > 0 ? ` (${totals.couponDiscountPercentage}%)` : ''}:` : `Coupon Discount (${booking.coupon_code || ''})${totals.couponDiscountPercentage > 0 ? ` (${totals.couponDiscountPercentage}%)` : ''}:`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #10b981;">
                -${formatCurrency(totals.couponDiscount)}
              </td>
            </tr>
          ` : ''}
          ${!operation_type ? `
          <tr>
            <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #111827; font-weight: 500;">
              ${isJapanese ? '小計:' : 'Subtotal:'}
            </td>
            <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #111827; font-weight: 500;">
              ${formatCurrency(totals.subtotal)}
            </td>
          </tr>
          ` : ''}
          ${!operation_type && totals.taxAmount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #111827;">
                ${isJapanese ? `税金 (${booking.tax_percentage || 10}%):` : `Tax (${booking.tax_percentage || 10}%):`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #111827;">
                +${formatCurrency(totals.taxAmount)}
              </td>
            </tr>
          ` : ''}
          <tr style="background-color: #f3f3f3;">
            <td style="padding: 8px 15px 8px 0; text-align: right; font-weight: bold; font-size: 14px; color: #111827;">
              ${operation_type === 'upgrade' ? (isJapanese ? '追加料金:' : 'Additional Payment:') : 
                operation_type === 'downgrade' ? (isJapanese ? 'ダウングレード料金:' : 'Downgrade Payment:') : 
                operation_type === 'update' ? (isJapanese ? '調整金額:' : 'Adjustment Amount:') :
                (isJapanese ? '合計:' : 'TOTAL:')}
            </td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 14px; color: #111827;">
              ${formatCurrency(totals.finalTotal)}
            </td>
          </tr>
        </table>
      </div>
    </div>
    
    <!-- Page break before information blocks -->
    <div style="page-break-before: always; margin-top: 20px;"></div>
    
    ${(operation_type || (!operation_type && payment_amount)) ? `
    <!-- Vehicle Assignment Details (Second Page) -->
    <div style="margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid ${statusColor};">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        ${isJapanese ? '車両詳細:' : 'VEHICLE DETAILS:'}
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div>
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280; font-weight: bold;">
            ${(previousVehicleInfo || newVehicleInfo) ? (isJapanese ? '前の車両:' : 'Previous Vehicle:') : (isJapanese ? '車両:' : 'Vehicle:')}
          </p>
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827; font-weight: 500;">
            ${previousVehicleInfo?.name || previous_vehicle_name || booking.vehicle_name || 'N/A'}
          </p>
          ${previousVehicleInfo ? `
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            ${previousVehicleInfo.brand || ''} ${previousVehicleInfo.model || ''}${previousVehicleInfo.year ? ` (${previousVehicleInfo.year})` : ''}
          </p>
          ` : ''}
          ${!previousVehicleInfo && !newVehicleInfo && booking.vehicle_brand && booking.vehicle_model ? `
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            ${booking.vehicle_brand} ${booking.vehicle_model}${booking.vehicle_year ? ` (${booking.vehicle_year})` : ''}
          </p>
          ` : ''}
        </div>
        <div>
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280; font-weight: bold;">
            ${(previousVehicleInfo || newVehicleInfo) ? (isJapanese ? '新しい車両:' : 'New Vehicle:') : (isJapanese ? 'サービス詳細:' : 'Service Details:')}
          </p>
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827; font-weight: 500;">
            ${newVehicleInfo?.name || new_vehicle_name || booking.service_name || 'N/A'}
          </p>
          ${newVehicleInfo && newVehicleInfo.brand && newVehicleInfo.model ? `
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            ${newVehicleInfo.brand} ${newVehicleInfo.model}${newVehicleInfo.year ? ` (${newVehicleInfo.year})` : ''}
          </p>
          ` : ''}
          ${!previousVehicleInfo && !newVehicleInfo && booking.pickup_location ? `
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            ${isJapanese ? '出発地:' : 'From:'} ${booking.pickup_location}
          </p>
          ` : ''}
          ${!previousVehicleInfo && !newVehicleInfo && booking.dropoff_location ? `
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            ${isJapanese ? '到着地:' : 'To:'} ${booking.dropoff_location}
          </p>
          ` : ''}
        </div>
      </div>
      ${!operation_type && payment_amount ? `
      <div style="padding: 15px; background-color: #fef2f2; border-radius: 6px; border: 1px solid #dc2626; margin: 15px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #dc2626; font-weight: bold;">
          ${isJapanese ? '完全見積書' : 'Complete Quote'}
        </h3>
        <p style="margin: 0; font-size: 14px; color: #dc2626;">
          ${isJapanese ? '総支払い金額:' : 'Total Payment Amount:'} <span style="font-weight: bold; font-size: 18px;">${formatCurrency(payment_amount)}</span>
        </p>
        ${refund_amount ? `
        <p style="margin: 5px 0 0; font-size: 13px; color: #047857;">
          ${isJapanese ? '払い戻し割引:' : 'Refund Discount:'} -${formatCurrency(refund_amount)}
        </p>
        ` : ''}
        ${coupon_code ? `
        <p style="margin: 5px 0 0; font-size: 13px; color: #047857;">
          ${isJapanese ? 'クーポンコード:' : 'Coupon Code:'} ${coupon_code}
        </p>
        ` : ''}
      </div>
      ` : ''}
      ${operation_type === 'upgrade' && payment_amount ? `
      <div style="padding: 10px; background-color: #fef3c7; border-radius: 6px; border: 1px solid #f59e0b;">
        <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: bold;">
          ${isJapanese ? '追加料金が必要:' : 'Additional Payment Required:'} ${formatCurrency(payment_amount)}
        </p>
        ${previousVehicleInfo && newVehicleInfo ? `
        <p style="margin: 5px 0 0; font-size: 12px; color: #92400e;">
          ${isJapanese ? '車両アップグレード:' : 'Vehicle Upgrade:'} ${previousVehicleInfo.name} → ${newVehicleInfo.name}
        </p>
        ` : ''}
      </div>
      ` : ''}
      ${operation_type === 'downgrade' && coupon_code ? `
      <div style="padding: 10px; background-color: #d1fae5; border-radius: 6px; border: 1px solid #10b981;">
        <p style="margin: 0 0 5px 0; font-size: 13px; color: #065f46; font-weight: bold;">
          ${isJapanese ? 'クーポンコード:' : 'Coupon Code:'} ${coupon_code}
        </p>
        ${refund_amount ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #065f46;">
          ${isJapanese ? '払い戻し金額:' : 'Refund Amount:'} ${formatCurrency(refund_amount)}
        </p>
        ` : ''}
        ${previousVehicleInfo && newVehicleInfo ? `
        <p style="margin: 5px 0 0; font-size: 12px; color: #065f46;">
          ${isJapanese ? '車両ダウングレード:' : 'Vehicle Downgrade:'} ${previousVehicleInfo.name} → ${newVehicleInfo.name}
        </p>
        ` : ''}
      </div>
      ` : ''}
      ${operation_type === 'update' ? `
      <div style="padding: 10px; background-color: #e0f2fe; border-radius: 6px; border: 1px solid #0ea5e9;">
        <p style="margin: 0; font-size: 13px; color: #0c4a6e; font-weight: bold;">
          ${isJapanese ? '車両更新:' : 'Vehicle Update'}
        </p>
        ${previousVehicleInfo && newVehicleInfo ? `
        <p style="margin: 5px 0 0; font-size: 12px; color: #0c4a6e;">
          ${isJapanese ? '車両変更:' : 'Vehicle Change:'} ${previousVehicleInfo.name} → ${newVehicleInfo.name}
        </p>
        ` : ''}
        ${payment_amount ? `
        <p style="margin: 5px 0 0; font-size: 12px; color: #0c4a6e;">
          ${isJapanese ? '調整金額:' : 'Adjustment Amount:'} ${formatCurrency(payment_amount)}
        </p>
        ` : ''}
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
      ${getTeamFooterHtml(booking.team_location || 'thailand', isJapanese)}
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      booking_id, 
      language = 'en',
      operation_type,
      previous_vehicle_name,
      new_vehicle_name,
      coupon_code,
      refund_amount,
      payment_amount,
      customer_email,
      bcc_email
    } = await request.json();
    
    if (!booking_id) {
      return NextResponse.json(
        { error: 'Missing booking_id' },
        { status: 400 }
      );
    }
    
    // Create service client to bypass RLS policies
    const supabase = createServiceClient();
    
    // For internal API calls, skip auth check (called from payment link generation)
    // Authentication is handled by the calling API
    
    // Fetch booking data
    console.log('🔍 [PDF-GENERATION] Looking for booking with ID:', booking_id);
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('id', booking_id)
      .single();
    
    console.log('🔍 [PDF-GENERATION] Query result:', { 
      hasBooking: !!booking, 
      error: error?.message,
      bookingId: booking?.id,
      wpId: booking?.wp_id 
    });
    
    if (error || !booking) {
      console.error('❌ [PDF-GENERATION] Booking not found:', error);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Fetch vehicle information for upgrades/downgrades/updates
    let previousVehicleInfo = null;
    let newVehicleInfo = null;
    
    // Always fetch vehicle information, even for regular bookings
    {
      try {
        console.log('🔍 Fetching vehicle info for operation:', operation_type);
        
        // For upgrade/downgrade operations:
        // - Previous vehicle = the original vehicle assigned to the booking
        // - New vehicle = the current vehicle assigned to the booking
        
        // Get the original vehicle (previous vehicle) from the booking
        if (booking.vehicle_id) {
          console.log('🔍 Fetching original vehicle (previous) with ID:', booking.vehicle_id);
          const { data: originalVehicle, error: originalError } = await supabase
            .from('vehicles')
            .select('name, model, brand, year')
            .eq('id', booking.vehicle_id)
            .single();
          console.log('🔍 Original vehicle query result:', { originalVehicle, originalError });
          
          if (originalVehicle && !originalError) {
            previousVehicleInfo = originalVehicle;
            console.log('✅ Previous vehicle found:', previousVehicleInfo);
          }
        }
        
        // For the new vehicle, we need to find what vehicle was assigned after the upgrade/downgrade
        // This could be from vehicle assignment operations or from the current booking state
        try {
          // Try to get the new vehicle from assignment operations first
          const { data: assignmentOperations, error: assignmentError } = await supabase
            .from('vehicle_assignment_operations')
            .select('new_vehicle_id')
            .eq('booking_id', booking_id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (assignmentOperations && assignmentOperations.length > 0 && assignmentOperations[0].new_vehicle_id) {
            console.log('🔍 Fetching new vehicle from assignment operation:', assignmentOperations[0].new_vehicle_id);
            const { data: newVehicle, error: newError } = await supabase
              .from('vehicles')
              .select('name, model, brand, year')
              .eq('id', assignmentOperations[0].new_vehicle_id)
              .single();
            console.log('🔍 New vehicle query result:', { newVehicle, newError });
            
            if (newVehicle && !newError) {
              newVehicleInfo = newVehicle;
              console.log('✅ New vehicle found from assignment operation:', newVehicleInfo);
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch new vehicle from assignment operations:', error);
        }
        
        // If we still don't have a new vehicle, use the current booking vehicle as new vehicle
        if (!newVehicleInfo && booking.vehicle_id) {
          console.log('🔍 Using current booking vehicle as new vehicle');
          newVehicleInfo = previousVehicleInfo; // This would be the "new" vehicle in this case
        }
        
      } catch (error) {
        console.error('Error fetching vehicle information:', error);
      }
    }
    
    // For regular bookings (no operation type), set both vehicles to the same vehicle
    if (!operation_type && !previousVehicleInfo && !newVehicleInfo && booking.vehicle_id) {
      try {
        console.log('🔍 Fetching vehicle info for regular booking with ID:', booking.vehicle_id);
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('name, model, brand, year')
          .eq('id', booking.vehicle_id)
          .single();
        
        if (vehicle && !vehicleError) {
          // For regular bookings, both previous and new vehicle are the same
          previousVehicleInfo = vehicle;
          newVehicleInfo = vehicle;
          console.log('✅ Regular booking vehicle found:', vehicle);
        }
      } catch (error) {
        console.error('Error fetching vehicle for regular booking:', error);
      }
    }
    
    // Debug vehicle information
    console.log('🔍 Vehicle Info Debug:', {
      operation_type,
      previous_vehicle_name,
      new_vehicle_name,
      previousVehicleInfo,
      newVehicleInfo,
      booking_vehicle_id: booking.vehicle_id
    });
    
    // Additional debug for previous vehicle
    if (operation_type && previousVehicleInfo) {
      console.log('🔍 Previous Vehicle Debug:', {
        name: previousVehicleInfo.name,
        brand: previousVehicleInfo.brand,
        model: previousVehicleInfo.model,
        year: previousVehicleInfo.year,
        hasName: !!previousVehicleInfo.name,
        hasBrand: !!previousVehicleInfo.brand,
        hasModel: !!previousVehicleInfo.model
      });
    }

    // Generate HTML content for invoice
    const htmlContent = await generateBookingInvoiceHtml(
      booking, 
      language as 'en' | 'ja',
      operation_type,
      previous_vehicle_name,
      new_vehicle_name,
      coupon_code,
      refund_amount,
      payment_amount,
      previousVehicleInfo,
      newVehicleInfo
    );
    
    // Convert to PDF using optimized generator
    const pdfBuffer = await generateOptimizedPdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    });
    
    // Send email if customer_email is provided
    if (customer_email) {
      try {
        const isJapanese = language === 'ja';
        const subject = isJapanese 
          ? `完全見積書 - ${booking.wp_id || booking.id}`
          : `Complete Quote - ${booking.wp_id || booking.id}`;
        
        // Generate OMISE payment link for all payment scenarios
        let paymentUrl = '';
        if (payment_amount) {
          try {
            const omiseClient = new OmiseClient(
              process.env.OMISE_PUBLIC_KEY || '',
              process.env.OMISE_SECRET_KEY || ''
            );
            
            // Determine description and reference based on operation type
            let description = '';
            let reference = '';
            
            if (operation_type === 'upgrade') {
              description = `Vehicle upgrade payment for ${booking.service_name || 'Transportation Service'}`;
              reference = `upgrade-${booking.wp_id || booking.id}`;
            } else if (operation_type === 'downgrade') {
              description = `Vehicle downgrade refund for ${booking.service_name || 'Transportation Service'}`;
              reference = `downgrade-${booking.wp_id || booking.id}`;
            } else if (operation_type === 'update') {
              description = `Vehicle update payment for ${booking.service_name || 'Transportation Service'}`;
              reference = `update-${booking.wp_id || booking.id}`;
            } else {
              // Full quote
              description = `Complete quote payment for ${booking.service_name || 'Transportation Service'}`;
              reference = `full-quote-${booking.wp_id || booking.id}`;
            }
            
            const paymentLinkData = {
              amount: payment_amount,
              currency: 'jpy',
              description: description,
              reference: reference,
              customerEmail: customer_email,
              customerName: booking.customer_name || 'Customer',
              returnUrl: process.env.OMISE_RETURN_URL || 'https://driver-companion.vercel.app/quotations/[QUOTATION_ID]'
            };
            
            console.log('Creating OMISE payment link:', paymentLinkData);
            const paymentLink = await omiseClient.createPaymentLink(paymentLinkData);
            paymentUrl = paymentLink.paymentUrl || '';
            console.log('OMISE payment link created:', paymentUrl);
          } catch (omiseError) {
            console.error('Error creating OMISE payment link:', omiseError);
            // Fallback to direct URL if OMISE fails
            paymentUrl = `https://driver-companion.vercel.app/bookings/${booking_id}/payment?amount=${payment_amount}&type=${operation_type || 'full_quote'}`;
          }
        }
        
        const emailHtml = `
          <!DOCTYPE html>
          <html lang="${language}">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>${subject}</title>
            <style>
              body, table, td, a {
                -webkit-text-size-adjust:100%;
                -ms-text-size-adjust:100%;
                font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif;
              }
              table, td { mso-table-lspace:0; mso-table-rspace:0; }
              img {
                border:0;
                line-height:100%;
                outline:none;
                text-decoration:none;
                -ms-interpolation-mode:bicubic;
              }
              table { border-collapse:collapse!important; }
              body {
                margin:0;
                padding:0;
                width:100%!important;
                background:#F2F4F6;
              }
              .greeting {
                color:#32325D;
                margin:24px 24px 16px;
                line-height:1.4;
                font-size: 14px;
              }
              @media only screen and (max-width:600px) {
                .container { width:100%!important; }
                .stack { display:block!important; width:100%!important; text-align:center!important; }
              }
              .details-table td, .details-table th {
                padding: 10px 0;
                font-size: 14px;
              }
              .details-table th {
                 color: #8898AA;
                 text-transform: uppercase;
                 text-align: left;
              }
              .button {
                background-color: #E03E2D;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin: 16px 0;
              }
              .payment-info {
                background-color: #fef2f2;
                border-left: 4px solid #dc2626;
                padding: 16px;
                margin: 16px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body style="background:#F2F4F6; margin:0; padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding:24px;">
                  <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                         style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%); padding:32px 24px; text-align:center;">
                        <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
                          <tr><td align="center" valign="middle" style="text-align:center;">
                              <img src="https://japandriver.com/img/driver-invoice-logo.png" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                          </td></tr>
                        </table>
                        <h1 style="color:white; margin:0; font-size:24px; font-weight:600;">
                          ${isJapanese ? '完全見積書' : 'Complete Quote'}
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          ${isJapanese ? '予約番号' : 'Booking'} #${booking.wp_id || booking.id}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding:32px 24px;">
                        <div class="greeting">
                          <p>${isJapanese ? 'こんにちは' : 'Hello'} ${booking.customer_name},</p>
                          
                          <p>${isJapanese 
                            ? `ご予約 ${booking.wp_id || booking.id} の完全見積書をお送りいたします。添付のPDFファイルをご確認ください。`
                            : `Please find attached the complete quote for your booking ${booking.wp_id || booking.id}. Please review the attached PDF file.`
                          }</p>
                          
                          <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
                            <h3 style="margin:0 0 12px 0; color:#32325D;">${isJapanese ? '予約詳細' : 'Booking Details'}</h3>
                            <p style="margin:0; color:#525f7f;">
                              <strong>${isJapanese ? '予約ID' : 'Booking ID'}:</strong> ${booking.wp_id || booking.id}<br>
                              <strong>${isJapanese ? 'サービス' : 'Service'}:</strong> ${booking.service_name || 'N/A'}<br>
                              ${previousVehicleInfo ? `<strong>${isJapanese ? '前の車両' : 'Previous Vehicle'}:</strong> ${previousVehicleInfo.name}${previousVehicleInfo.brand && previousVehicleInfo.model ? ` (${previousVehicleInfo.brand} ${previousVehicleInfo.model})` : ''}<br>` : ''}
                              ${newVehicleInfo ? `<strong>${isJapanese ? '新しい車両' : 'New Vehicle'}:</strong> ${newVehicleInfo.name}${newVehicleInfo.brand && newVehicleInfo.model ? ` (${newVehicleInfo.brand} ${newVehicleInfo.model})` : ''}<br>` : ''}
                              ${payment_amount ? `<strong>${isJapanese ? '追加支払いが必要' : 'Additional Payment Required'}:</strong> <span style="color:#dc2626; font-weight:bold; font-size:18px;">JPY ${payment_amount.toLocaleString()}</span><br>` : ''}
                              <strong>${isJapanese ? 'ステータス' : 'Status'}:</strong> <span style="color:#dc2626; font-weight:600;">${isJapanese ? '見積書送信済み' : 'Quote Sent'}</span><br>
                              <strong>${isJapanese ? '日付' : 'Date'}:</strong> ${formatDateDDMMYYYY(new Date())}
                            </p>
                          </div>
                          
                          <div class="payment-info">
                            <h4 style="margin:0 0 8px 0; color:#32325D;">${isJapanese ? '支払い詳細' : 'Payment Details'}:</h4>
                            <p style="margin:0 0 16px; color:#525f7f;">
                              <strong>${isJapanese ? '支払い方法' : 'Payment Method'}:</strong> ${isJapanese ? 'オンライン支払い' : 'Online Payment'}<br>
                              <strong>${isJapanese ? '支払い金額' : 'Payment Amount'}:</strong> JPY ${payment_amount ? payment_amount.toLocaleString() : '0'}<br>
                              <strong>${isJapanese ? '支払い日' : 'Payment Date'}:</strong> ${formatDateDDMMYYYY(new Date())}
                            </p>
                            <p style="margin:0 0 16px; color:#525f7f;">
                              ${isJapanese 
                                ? '添付のPDFファイルをご確認いただき、お支払いをお願いいたします。'
                                : 'Please review the attached PDF file and proceed with payment.'
                              }
                            </p>
                            ${paymentUrl ? `
                            <div style="text-align: center; margin: 20px 0;">
                              <a href="${paymentUrl}" 
                                 style="background-color: #E03E2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                                ${isJapanese ? 'お支払いを完了する' : 'Complete Payment'}
                              </a>
                            </div>
                            ` : ''}
                            <p style="margin:16px 0 0; font-size:12px; color:#6b7280; text-align: center;">
                              ${isJapanese 
                                ? 'または、上記のリンクをクリックしてお支払いを完了してください。'
                                : 'Or click the link above to complete your payment.'
                              }
                            </p>
                          </div>
                          
                          <p>${isJapanese ? 'ご質問がございましたら、お気軽にお問い合わせください。' : 'If you have any questions, please don\'t hesitate to contact us.'}</p>
                          <p>${isJapanese ? 'ありがとうございます。' : 'Thank you for your business!'}</p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; font-size:12px; color:#8898AA;">
                        <p style="color: #333; font-weight: bold; margin: 0 0 10px;">${isJapanese ? 'ご利用ありがとうございます！' : 'Thank you for your business!'}</p>
                        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
                          ${isJapanese 
                            ? 'この見積書についてご質問がございましたら、'
                            : 'If you have any questions about this quote, please contact us at '
                          }
                          <a href="mailto:booking@japandriver.com" style="color: #1e40af; text-decoration: none;">booking@japandriver.com</a>
                        </p>
                        <p style="color: #666; font-size: 14px; margin: 0;">
                          Driver (Thailand) Company Limited • 
                          <a href="https://www.japandriver.com" style="color: #1e40af; text-decoration: none;">www.japandriver.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
        
        const emailData = {
          from: 'Driver Japan <booking@japandriver.com>',
          to: [customer_email],
          bcc: bcc_email ? [bcc_email] : undefined,
          subject: subject,
          html: emailHtml,
          attachments: [
            {
              filename: `quote-${booking.wp_id || booking.id}.pdf`,
              content: pdfBuffer.toString('base64')
            }
          ]
        };
        
        console.log('Sending full quote email to:', customer_email);
        await resend.emails.send(emailData as any);
        console.log('Full quote email sent successfully');
        
      } catch (emailError) {
        console.error('Error sending full quote email:', emailError);
        // Don't fail the entire request if email fails
      }
    }
    
    // Return PDF as binary
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="INV-${booking.wp_id || booking.id}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('Error generating booking invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}
