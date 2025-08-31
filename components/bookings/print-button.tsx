'use client'

import { FileText } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useState } from 'react'
import { BookingButton } from './booking-button'
import html2pdf from 'html2pdf.js'
import { toast } from '@/components/ui/use-toast'

interface ExportPdfButtonProps {
  booking?: any;
}

export function PrintButton({ booking }: ExportPdfButtonProps) {
  const { t } = useI18n()
  const [isExporting, setIsExporting] = useState(false)
  
  const exportToPdf = async () => {
    if (!booking) {
      toast({
        title: "Error",
        description: "No booking data provided",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true)
    
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        toast({
          title: "Error",
          description: "PDF export is only available in browser environment",
          variant: "destructive",
        });
        return;
      }
      
      // Create a new element to format as a PDF
      const pdfContainer = document.createElement('div')
      pdfContainer.className = 'pdf-export-container'
      pdfContainer.style.fontFamily = 'Work Sans, sans-serif'
      pdfContainer.style.color = '#333'
      pdfContainer.style.backgroundColor = '#fff'
      pdfContainer.style.padding = '20px'
      pdfContainer.style.width = '190mm' // A4 width
      pdfContainer.style.height = 'auto'
      pdfContainer.style.margin = '0'
      
      // Add company logo
      const logoContainer = document.createElement('div')
      logoContainer.style.textAlign = 'center'
      logoContainer.style.marginBottom = '20px'
      
      const logo = document.createElement('img')
      logo.src = '/img/driver-header-logo.png' // Update path to match sidebar logo path
      logo.alt = 'Driver Logo'
      logo.style.height = '60px'
      
      logoContainer.appendChild(logo)
      pdfContainer.appendChild(logoContainer)
      
      // Add booking header
      const header = document.createElement('div')
      header.style.borderBottom = '2px solid #FF2600'
      header.style.paddingBottom = '15px'
      header.style.marginBottom = '20px'
      header.style.backgroundColor = '#f8fafc'
      header.style.padding = '15px'
      header.style.borderRadius = '6px'
      
      const bookingTitle = document.createElement('h1')
      bookingTitle.textContent = t('bookings.details.bookingNumber', { id: booking?.wp_id || booking?.booking_id || 'N/A' }) || `Booking #${booking?.wp_id || booking?.booking_id || 'N/A'}`
      bookingTitle.style.fontSize = '22px'
      bookingTitle.style.fontWeight = 'bold'
      bookingTitle.style.marginBottom = '5px'
      bookingTitle.style.color = '#010101'
      
      const bookingDate = document.createElement('p')
      bookingDate.textContent = t('bookings.details.createdOn', { 
        date: booking?.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A' 
      }) || `Created on: ${booking?.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}`
      bookingDate.style.color = '#64748b'
      bookingDate.style.margin = '5px 0'
      
      const statusBadge = document.createElement('div')
      statusBadge.textContent = booking?.status || 'Pending'
      statusBadge.style.display = 'inline-block'
      statusBadge.style.padding = '4px 8px'
      statusBadge.style.borderRadius = '4px'
      
      // Set badge color based on status
      if (booking?.status?.toLowerCase() === 'confirmed') {
        statusBadge.style.backgroundColor = '#dcfce7'
        statusBadge.style.color = '#166534'
      } else if (booking?.status?.toLowerCase() === 'cancelled') {
        statusBadge.style.backgroundColor = '#fee2e2'
        statusBadge.style.color = '#b91c1c'
      } else if (booking?.status?.toLowerCase() === 'completed') {
        statusBadge.style.backgroundColor = '#dbeafe'
        statusBadge.style.color = '#1e40af'
      } else {
        statusBadge.style.backgroundColor = '#fef9c3'
        statusBadge.style.color = '#854d0e'
      }
      
      statusBadge.style.fontWeight = 'bold'
      statusBadge.style.fontSize = '14px'
      statusBadge.style.marginTop = '10px'
      
      header.appendChild(bookingTitle)
      header.appendChild(bookingDate)
      header.appendChild(statusBadge)
      pdfContainer.appendChild(header)
      
      // Add booking details section
      const detailsContainer = document.createElement('div')
      detailsContainer.style.marginBottom = '20px'
      
      // Function to create a section
      const createSection = (title: string, items: Array<{label: string, value: string}>) => {
        const section = document.createElement('div')
        section.style.marginBottom = '25px'
        section.style.backgroundColor = '#f8fafc'
        section.style.padding = '15px'
        section.style.borderRadius = '6px'
        section.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
        
        const sectionTitle = document.createElement('h2')
        sectionTitle.textContent = title
        sectionTitle.style.fontSize = '18px'
        sectionTitle.style.borderBottom = '1px solid #e2e8f0'
        sectionTitle.style.paddingBottom = '8px'
        sectionTitle.style.marginBottom = '12px'
        sectionTitle.style.color = '#010101'
        
        section.appendChild(sectionTitle)
        
        const grid = document.createElement('div')
        grid.style.display = 'grid'
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)'
        grid.style.gap = '15px'
        
        items.forEach(item => {
          const itemContainer = document.createElement('div')
          
          const label = document.createElement('p')
          label.textContent = item.label
          label.style.fontSize = '12px'
          label.style.color = '#64748b'
          label.style.margin = '0 0 3px 0'
          
          const value = document.createElement('p')
          value.textContent = item.value || 'N/A'
          value.style.fontSize = '14px'
          value.style.margin = '0'
          value.style.fontWeight = '500'
          value.style.color = '#334155'
          
          itemContainer.appendChild(label)
          itemContainer.appendChild(value)
          grid.appendChild(itemContainer)
        })
        
        section.appendChild(grid)
        return section
      }
      
      // Booking summary section
      const summarySection = createSection(t('bookings.details.sections.summary') || 'Booking Summary', [
        { label: t('bookings.details.fields.bookingId') || 'Booking ID', value: `#${booking?.wp_id || booking?.booking_id || 'N/A'}` },
        { label: t('bookings.details.fields.pickupDate') || 'Pickup Date', value: booking?.date || 'N/A' },
        { label: t('bookings.details.fields.pickupTime') || 'Pickup Time', value: booking?.time || 'N/A' }
        // Removed Order Total, Payment Method, and Payment Status as requested
      ])
      
      // Add each section to the container
      detailsContainer.appendChild(summarySection)
      
      // Add coupon information if available
      if (booking?.coupon_code || booking?.coupon_discount_percentage) {
        const couponSection = createSection(t('bookings.details.sections.coupon') || 'Coupon Information', [
          { label: t('bookings.details.fields.couponCode') || 'Coupon Code', value: booking?.coupon_code || 'N/A' },
          { label: t('bookings.details.fields.discount') || 'Discount', value: booking?.price && booking?.coupon_discount_percentage ? 
            (() => {
              const priceAmount = booking.price.amount || 0;
              const discountPercentage = parseFloat(booking.coupon_discount_percentage);
              const originalPrice = Math.round(priceAmount / (1 - discountPercentage/100));
              const discountAmount = originalPrice - priceAmount;
              return `-${booking.price.currency || 'THB'} ${discountAmount.toLocaleString()} (${discountPercentage}%)`;
            })() : 'N/A'
          },
          { label: t('bookings.details.fields.originalPrice') || 'Original Price', value: booking?.price && booking?.coupon_discount_percentage ? 
            (() => {
              const priceAmount = booking.price.amount || 0;
              const discountPercentage = parseFloat(booking.coupon_discount_percentage);
              const originalPrice = Math.round(priceAmount / (1 - discountPercentage/100));
              return `${booking.price.currency || 'THB'} ${originalPrice.toLocaleString()}`;
            })() : 'N/A'
          }
        ])
        detailsContainer.appendChild(couponSection)
      }
      
      // Vehicle section
      const vehicleSection = createSection(t('bookings.details.sections.vehicle') || 'Vehicle', [
        { label: t('bookings.details.fields.vehicle') || 'Vehicle', value: 
          // Use vehicle_type from meta (which comes directly from quotations table)
          booking?.meta?.vehicle_type || 'Toyota Hiace Grand Cabin' },
        { label: t('bookings.details.fields.vehicleId') || 'Vehicle ID', value: `#${booking?.vehicle?.id || 'N/A'}` },
        { label: t('bookings.details.fields.vehicleCategory') || 'Vehicle Category', value: 
          // Use vehicle_category from meta
          booking?.meta?.vehicle_category || 'Not specified' },
        { label: t('bookings.details.fields.hoursPerDay') || 'Hours Per Day', value: 
          // Use hours_per_day from meta
          booking?.meta?.hours_per_day || 'Not specified' },
        { label: t('bookings.details.fields.durationHours') || 'Duration (hrs)', value: 
          // Use duration_hours from meta
          booking?.meta?.duration_hours || 'Not specified' },
        { label: t('bookings.details.fields.serviceType') || 'Service Type', value: 
          // Get service_type_name from the first quotation item
          booking?.meta?.quotation_items?.[0]?.service_type_name || 'Airport Transfer' }
      ])
      
      // Route section
      const routeSection = createSection(t('bookings.details.sections.route') || 'Route', [
        { label: t('bookings.details.fields.pickupLocation') || 'Pickup Location', value: booking?.pickup_location || 'N/A' },
        { label: t('bookings.details.fields.dropoffLocation') || 'Dropoff Location', value: booking?.dropoff_location || 'N/A' },
        { label: t('bookings.details.fields.distance') || 'Distance', value: booking?.distance ? `${booking.distance} km` : 'N/A' },
        { label: t('bookings.details.fields.duration') || 'Duration', value: booking?.duration ? `${booking.duration} min` : 'N/A' }
      ])
      
      // Customer section
      const customerSection = createSection(t('bookings.details.sections.client') || 'Customer', [
        { label: t('bookings.details.fields.name') || 'Name', value: booking?.customer_name || 'N/A' },
        { label: t('bookings.details.fields.email') || 'Email', value: booking?.customer_email || 'N/A' },
        { label: t('bookings.details.fields.phone') || 'Phone', value: booking?.customer_phone || 'N/A' }
      ])
      
      // Additional section (flight, terminal, etc.)
      let flightNumber = 'N/A';
      let terminal = 'N/A';
      
      // Try to extract flight number and terminal from meta data
      if (booking?.meta?.chbs_form_element_field && Array.isArray(booking.meta.chbs_form_element_field)) {
        const flightField = booking.meta.chbs_form_element_field.find(
          (field: any) => field.label?.toLowerCase().includes('flight') || field.name?.toLowerCase().includes('flight')
        );
        if (flightField?.value) flightNumber = flightField.value;
        
        const terminalField = booking.meta.chbs_form_element_field.find(
          (field: any) => field.label?.toLowerCase().includes('terminal') || field.name?.toLowerCase().includes('terminal')
        );
        if (terminalField?.value) terminal = terminalField.value;
      }
      
      flightNumber = flightNumber || booking?.meta?.chbs_flight_number || 'N/A';
      terminal = terminal || booking?.meta?.chbs_terminal || 'N/A';
      
      const additionalSection = createSection(t('bookings.details.sections.additional') || 'Additional Details', [
        { label: t('bookings.details.fields.flightNumber') || 'Flight Number', value: flightNumber },
        { label: t('bookings.details.fields.terminal') || 'Terminal', value: terminal },
        { label: t('bookings.details.fields.comment') || 'Comments', value: booking?.notes || booking?.meta?.chbs_comment || 'N/A' }
      ])
      
      // Add each section to the container
      detailsContainer.appendChild(vehicleSection)
      detailsContainer.appendChild(routeSection)
      detailsContainer.appendChild(customerSection)
      
      // Add billing information after customer details
      if (booking?.billing_company_name || 
          booking?.billing_tax_number || 
          booking?.billing_street_name || 
          booking?.billing_street_number ||
          booking?.billing_city ||
          booking?.billing_state ||
          booking?.billing_postal_code ||
          booking?.billing_country) {
        
        const billingItems: Array<{label: string, value: string}> = [];
        
        if (booking?.billing_company_name) {
          billingItems.push({ label: t('bookings.details.fields.billingCompany') || 'Company', value: booking.billing_company_name });
        }
        
        if (booking?.billing_tax_number) {
          billingItems.push({ label: t('bookings.details.fields.taxNumber') || 'Tax ID', value: booking.billing_tax_number });
        }
        
        const address = [
          booking?.billing_street_name, 
          booking?.billing_street_number
        ].filter(Boolean).join(' ');
        
        if (address) {
          billingItems.push({ label: t('bookings.details.fields.address') || 'Address', value: address });
        }
        
        const cityState = [
          booking?.billing_city,
          booking?.billing_state,
          booking?.billing_postal_code
        ].filter(Boolean).join(', ');
        
        if (cityState) {
          billingItems.push({ label: t('bookings.details.fields.cityState') || 'City/State/Postal', value: cityState });
        }
        
        if (booking?.billing_country) {
          billingItems.push({ label: t('bookings.details.fields.country') || 'Country', value: booking.billing_country });
        }
        
        const billingSection = createSection(t('bookings.details.sections.billing') || 'Billing Information', billingItems);
        detailsContainer.appendChild(billingSection);
      }
      
      detailsContainer.appendChild(additionalSection)
      
      pdfContainer.appendChild(detailsContainer)
      
      // Add footer
      const footer = document.createElement('div')
      footer.style.borderTop = '1px solid #e2e8f0'
      footer.style.paddingTop = '15px'
      footer.style.textAlign = 'center'
      footer.style.marginTop = '30px'
      
      const companyInfo = document.createElement('p')
      companyInfo.textContent = 'Driver • japandriver.com' // Updated company info
      companyInfo.style.fontSize = '12px'
      companyInfo.style.margin = '5px 0'
      companyInfo.style.color = '#64748b'
      
      const disclaimer = document.createElement('p')
      disclaimer.textContent = 'This document is for informational purposes only.'
      disclaimer.style.fontSize = '10px'
      disclaimer.style.color = '#94a3b8'
      disclaimer.style.margin = '5px 0'
      
      footer.appendChild(companyInfo)
      footer.appendChild(disclaimer)
      pdfContainer.appendChild(footer)
      
      // Add to document body
      document.body.appendChild(pdfContainer)
      
      try {
        // Wait for images to load properly
        await new Promise(resolve => {
          if (logo.complete) {
            resolve(null);
          } else {
            logo.onload = () => resolve(null);
            logo.onerror = () => {
              // Continue even if logo fails to load
              console.warn('Logo failed to load, continuing with PDF generation');
              resolve(null);
            };
          }
        });
        
        // Extra delay to ensure content is fully rendered
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Convert the container to PDF
        const pdfOptions = {
          margin: [10, 10, 10, 10], // Margins: [top, left, bottom, right] in mm
          filename: `booking-${booking?.id || booking?.booking_id || 'details'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Try to avoid breaking elements across pages
        };
        
        // Generate PDF using a more reliable approach
        const worker = html2pdf()
          .set(pdfOptions)
          .from(pdfContainer);
        
        // Generate PDF
        await worker.save();
        
        toast({
          title: "Success",
          description: "PDF exported successfully",
          variant: "default"
        });
      } catch (error) {
        console.error('Error during PDF generation:', error);
        toast({
          title: "Error",
          description: "PDF generation failed. Please try again.",
          variant: "destructive"
        });
      } finally {
        // Always clean up the temporary element
        if (document.body.contains(pdfContainer)) {
          document.body.removeChild(pdfContainer);
        }
      }
    } catch (error) {
      console.error('Error during PDF export setup:', error);
      toast({
        title: "Error", 
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <BookingButton 
      variant="outline"
      icon={<FileText className="h-5 w-5" />}
      onClick={exportToPdf}
      disabled={isExporting || !booking}
    >
      {isExporting ? 
        (t('common.exporting') || 'Exporting...') : 
        (t('bookings.details.actions.exportPdf') || 'Export PDF')
      }
    </BookingButton>
  )
} 