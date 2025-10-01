import { NextRequest, NextResponse } from 'next/server'
import { generateQuotationHtml } from '@/lib/quotation-html-generator'
import { generateBookingInvoiceHtml } from '@/lib/booking-invoice-generator'
import { generateOptimizedPdfFromHtml } from '@/lib/optimized-html-pdf-generator'
import { createClient } from '@supabase/supabase-js'

// Helper functions for status styling (same as preview API)
function getStatusBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid': return '#10B981' // Green
    case 'converted': return '#8B5CF6' // Purple
    case 'approved': return '#059669' // Emerald
    case 'rejected': return '#EF4444' // Red
    case 'pending': return '#F59E0B' // Amber
    case 'send': return '#3B82F6' // Blue
    default: return '#6B7280' // Gray
  }
}

function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid': return '✓'
    case 'converted': return '✓'
    case 'approved': return '✓'
    case 'rejected': return '✗'
    case 'pending': return '⏱'
    case 'send': return '📤'
    default: return '●'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'
    const team = searchParams.get('team') || 'japan'
    const status = searchParams.get('status') || 'pending'
    
    // Determine template type from ID or database
    let templateType = 'quotation' // default
    
    // If it's a UUID, check the database
    if (templateId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: template } = await supabase
        .from('pdf_templates')
        .select('type, template_data, styling')
        .eq('id', templateId)
        .single()
      
      if (template?.type) {
        templateType = template.type
      }
    } else {
      // For string IDs, use pattern matching
      if (templateId.includes('invoice')) {
        templateType = 'invoice'
      } else if (templateId.includes('quotation')) {
        templateType = 'quotation'
      }
    }
    
    // Enhanced sample data with realistic pricing, discounts, and taxes (same as preview API)
    const basePrice = 45000 // Base hourly rate
    const hours = 8 // 8 hours service
    const timeMultiplier = status === 'paid' ? 1.5 : status === 'approved' ? 1.25 : 1.0 // Time-based pricing
    const discountPercentage = status === 'converted' ? 15 : status === 'approved' ? 10 : 0 // Status-based discounts
    const taxPercentage = 10 // 10% tax
    
    const servicesSubtotal = basePrice * hours * timeMultiplier
    const discountAmount = (servicesSubtotal * discountPercentage) / 100
    const subtotal = servicesSubtotal - discountAmount
    const taxAmount = (subtotal * taxPercentage) / 100
    const totalAmount = subtotal + taxAmount

    const sampleQuotationData = {
      quote_number: 1,
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '0800553516',
      billing_company_name: 'Example Corp',
      billing_tax_number: '123456789',
      billing_street_name: '123 Main St',
      billing_city: 'Tokyo',
      billing_zip_code: '100-0001',
      billing_country: 'Japan',
      team_location: team,
      service_type: 'Charter Services',
      vehicle_type: 'Mercedes V-class Black Suites',
      pickup_location: 'Narita Airport',
      dropoff_location: 'Tokyo Station',
      created_at: '2025-09-30T00:00:00Z',
      valid_days: 7,
      total_price: totalAmount,
      currency: 'JPY',
      display_currency: 'JPY',
      status: status,
      // Add status-specific fields
      ...(status === 'approved' && {
        approved_at: '2025-09-30T10:30:00Z',
        approval_signature: null,
        approval_notes: 'Approved by management'
      }),
      ...(status === 'paid' && {
        payment_date: '2025-09-30T14:45:00Z',
        payment_completed_at: '2025-09-30T14:45:00Z',
        payment_amount: totalAmount,
        payment_method: 'Credit Card'
      }),
      ...(status === 'converted' && {
        updated_at: '2025-09-30T16:20:00Z',
        payment_date: '2025-09-30T15:30:00Z',
        payment_completed_at: '2025-09-30T15:30:00Z',
        payment_amount: totalAmount,
        payment_method: 'Credit Card',
        converted_at: '2025-09-30T16:20:00Z',
        converted_by: 'John Smith',
        conversion_notes: 'Customer confirmed booking via phone call',
        booking_reference: 'BK-JPDR-000123',
        conversion_method: 'Phone Call'
      }),
      ...(status === 'rejected' && {
        rejected_at: '2025-09-30T11:15:00Z',
        rejection_reason: 'Requirements not met'
      }),
      ...(status === 'sent' && {
        sent_at: '2025-09-30T09:15:00Z'
      }),
      // Add quotation items structure
      quotation_items: [
        {
          service_type_name: 'Charter Services',
          vehicle_type: 'Mercedes V-class Black Suites',
          description: 'Mercedes V-class Black Suites',
          unit_price: basePrice,
          service_days: 1,
          hours_per_day: hours,
          quantity: 1,
          total_price: servicesSubtotal,
          time_based_adjustment: timeMultiplier > 1 ? Math.round((timeMultiplier - 1) * 100) : 0,
          time_based_rule_name: timeMultiplier > 1 ? 'Peak Hours Adjustment' : null,
          pickup_date: '2025-09-30T00:00:00Z',
          pickup_time: '09:00'
        }
      ],
      // Add pricing fields
      discount_percentage: discountPercentage,
      tax_percentage: taxPercentage,
      amount: totalAmount,
      // Add service details
      duration_hours: hours,
      service_days: 1,
      hourly_rate: basePrice,
      daily_rate: basePrice * hours
    }

    const sampleInvoiceData = {
      id: 'booking-123',
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '0800553516',
      billing_company_name: 'Example Corp',
      billing_tax_number: '123456789',
      billing_street_name: '123 Main St',
      billing_city: 'Tokyo',
      billing_zip_code: '100-0001',
      billing_country: 'Japan',
      team_location: team,
      service_type: 'Charter Services',
      vehicle_type: 'Mercedes V-class Black Suites',
      pickup_location: 'Narita Airport',
      dropoff_location: 'Tokyo Station',
      date: '2025-09-30T00:00:00Z',
      total_price: totalAmount,
      currency: 'JPY',
      items: sampleQuotationData.items,
      payment_status: status.toUpperCase(),
      // Enhanced invoice data
      status_badge_color: getStatusBadgeColor(status),
      status_icon: getStatusIcon(status),
    }

    let htmlContent = ''
    let filename = ''

    // Generate HTML based on template type
    if (templateType === 'quotation') {
      htmlContent = generateQuotationHtml(sampleQuotationData, language as 'en' | 'ja', null, null, true)
      filename = `quotation-${status}.pdf`
    } else if (templateType === 'invoice') {
      htmlContent = await generateBookingInvoiceHtml(sampleInvoiceData, language as 'en' | 'ja')
      filename = `invoice-${status}.pdf`
    } else {
      return NextResponse.json({ error: 'Unsupported template type' }, { status: 400 })
    }

    // Convert HTML to PDF
    const pdfBuffer = await generateOptimizedPdfFromHtml(htmlContent)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error generating template PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
