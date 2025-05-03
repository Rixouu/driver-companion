'use client'

import { FileText, Mail } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useState } from 'react'
import { BookingButton } from './booking-button'
import html2pdf from 'html2pdf.js'
import { toast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

// Invoice translations for different languages
const invoiceTranslations = {
  en: {
    invoice: 'INVOICE',
    invoiceNumber: 'Invoice #:',
    invoiceDate: 'Invoice Date:',
    bookingRef: 'Booking Ref:',
    dueDate: 'Due Date:',
    companyName: 'Japan Driver Co., Ltd.',
    companyAddress1: '123 Tokyo Street, Shibuya-ku',
    companyAddress2: 'Tokyo, Japan 123-4567',
    companyEmail: 'info@japandriver.com',
    companyWebsite: 'www.japandriver.com',
    billTo: 'BILL TO:',
    serviceDetails: 'SERVICE DETAILS:',
    serviceDescription: 'Service Description',
    date: 'Date',
    quantity: 'Quantity',
    price: 'Price',
    subtotal: 'Subtotal:',
    // tax removed
    total: 'TOTAL:',
    thanksMessage: 'Thank you for your business!',
    contactMessage: 'If you have any questions about this invoice, please contact us at billing@japandriver.com',
    companyFooter: 'Japan Driver Co., Ltd. • www.japandriver.com',
    transportationService: 'Transportation Service'
  },
  ja: {
    invoice: '請求書',
    invoiceNumber: '請求書番号:',
    invoiceDate: '請求書発行日:',
    bookingRef: '予約番号:',
    dueDate: 'お支払期限:',
    companyName: 'ジャパンドライバー株式会社',
    companyAddress1: '〒123-4567 東京都渋谷区',
    companyAddress2: '東京ストリート123',
    companyEmail: 'info@japandriver.com',
    companyWebsite: 'www.japandriver.com',
    billTo: '請求先:',
    serviceDetails: 'サービス詳細:',
    serviceDescription: 'サービス内容',
    date: '日付',
    quantity: '数量',
    price: '価格',
    subtotal: '小計:',
    // tax removed
    total: '合計:',
    thanksMessage: 'ご利用いただきありがとうございます。',
    contactMessage: 'この請求書に関するお問い合わせは billing@japandriver.com までご連絡ください。',
    companyFooter: 'ジャパンドライバー株式会社 • www.japandriver.com',
    transportationService: '送迎サービス'
  }
};

interface InvoiceButtonProps {
  booking?: any;
}

export function InvoiceButton({ booking }: InvoiceButtonProps) {
  const { t, language } = useI18n()
  const [isGenerating, setIsGenerating] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [includeBookingDetails, setIncludeBookingDetails] = useState(true)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [emailLanguage, setEmailLanguage] = useState<'en' | 'ja'>(language as 'en' | 'ja')
  
  const formatCurrency = (amount: number, currency: string = 'THB') => {
    if (!amount) return `${currency} 0.00`;
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const generateInvoice = async (email: boolean = false, invoiceLanguage: 'en' | 'ja' = 'en'): Promise<Blob | null> => {
    if (!booking) {
      toast({
        title: "Error",
        description: "No booking data provided",
        variant: "destructive",
      });
      return null;
    }
    
    setIsGenerating(true)
    
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        toast({
          title: "Error",
          description: "Invoice generation is only available in browser environment",
          variant: "destructive",
        });
        return null;
      }
      
      // Get translations for the selected language
      const invoiceT = invoiceTranslations[invoiceLanguage];
      
      // Create a new element to format as an invoice PDF
      const pdfContainer = document.createElement('div')
      pdfContainer.className = 'invoice-export-container'
      pdfContainer.style.fontFamily = 'Work Sans, sans-serif'
      pdfContainer.style.color = '#333'
      pdfContainer.style.backgroundColor = '#fff'
      pdfContainer.style.padding = '10px 0px 0px' // Increase padding for better margins
      pdfContainer.style.width = '180mm' // A4 width
      pdfContainer.style.boxSizing = 'border-box'
      pdfContainer.style.position = 'relative'
      pdfContainer.style.margin = '0 auto' // Center content
      pdfContainer.style.borderTop = '2px solid #FF2600' // Add red border at top
      
      // Add company logo
      const logoContainer = document.createElement('div')
      logoContainer.style.textAlign = 'left'
      logoContainer.style.marginBottom = '30px'
      logoContainer.style.marginTop = '30px'
      
      const logo = document.createElement('img')
      logo.src = '/img/driver-header-logo.png'
      logo.alt = 'Driver Logo'
      logo.style.height = '50px'
      
      logoContainer.appendChild(logo)
      pdfContainer.appendChild(logoContainer)
      
      // Create invoice header with company and client info in two columns
      const headerContainer = document.createElement('div')
      headerContainer.style.display = 'flex'
      headerContainer.style.justifyContent = 'space-between'
      headerContainer.style.alignItems = 'flex-start'
      headerContainer.style.marginBottom = '40px'
      headerContainer.style.width = '100%'
      
      // Invoice title and details (left side)
      const invoiceDetails = document.createElement('div')
      invoiceDetails.style.flex = '1'
      invoiceDetails.style.textAlign = 'left'
      invoiceDetails.style.maxWidth = '50%'
      
      const invoiceTitle = document.createElement('h1')
      invoiceTitle.textContent = invoiceT.invoice
      invoiceTitle.style.color = '#333'
      invoiceTitle.style.margin = '0 0 15px 0'
      invoiceTitle.style.fontSize = '24px'
      invoiceTitle.style.fontWeight = 'bold'
      
      const invoiceNumber = document.createElement('p')
      invoiceNumber.textContent = `${invoiceT.invoiceNumber} INV-${booking?.id || booking?.booking_id || 'N/A'}`
      invoiceNumber.style.margin = '0 0 5px 0'
      invoiceNumber.style.fontWeight = 'normal'
      invoiceNumber.style.fontSize = '13px'
      
      const today = new Date()
      const invoiceDate = document.createElement('p')
      invoiceDate.textContent = `${invoiceT.invoiceDate} ${today.toLocaleDateString(invoiceLanguage === 'ja' ? 'ja-JP' : 'en-US')}`
      invoiceDate.style.margin = '0 0 5px 0'
      invoiceDate.style.fontSize = '13px'
      
      const bookingRef = document.createElement('p')
      bookingRef.textContent = `${invoiceT.bookingRef} #${booking?.id || booking?.booking_id || 'N/A'}`
      bookingRef.style.margin = '0 0 5px 0'
      bookingRef.style.fontSize = '13px'
      
      const dueDate = document.createElement('p')
      // Due date is 15 days from today
      const due = new Date(today)
      due.setDate(due.getDate() + 15)
      dueDate.textContent = `${invoiceT.dueDate} ${due.toLocaleDateString(invoiceLanguage === 'ja' ? 'ja-JP' : 'en-US')}`
      dueDate.style.margin = '0'
      dueDate.style.fontWeight = 'normal'
      dueDate.style.fontSize = '13px'
      
      invoiceDetails.appendChild(invoiceTitle)
      invoiceDetails.appendChild(invoiceNumber)
      invoiceDetails.appendChild(invoiceDate)
      invoiceDetails.appendChild(bookingRef)
      invoiceDetails.appendChild(dueDate)
      
      // Company information (right side)
      const companyInfo = document.createElement('div')
      companyInfo.style.flex = '1'
      companyInfo.style.maxWidth = '40%'
      companyInfo.style.textAlign = 'right'
      
      const companyName = document.createElement('h2')
      companyName.textContent = invoiceT.companyName
      companyName.style.margin = '0 0 5px 0'
      companyName.style.color = '#333'
      companyName.style.fontSize = '16px'
      
      const companyAddress = document.createElement('p')
      companyAddress.textContent = invoiceT.companyAddress1
      companyAddress.style.margin = '0 0 2px 0'
      companyAddress.style.fontSize = '13px'
      
      const companyCity = document.createElement('p')
      companyCity.textContent = invoiceT.companyAddress2
      companyCity.style.margin = '0 0 2px 0'
      companyCity.style.fontSize = '13px'
      
      const companyEmail = document.createElement('p')
      companyEmail.textContent = invoiceT.companyEmail
      companyEmail.style.margin = '0 0 2px 0'
      companyEmail.style.fontSize = '13px'
      
      const companyWebsite = document.createElement('p')
      companyWebsite.textContent = invoiceT.companyWebsite
      companyWebsite.style.margin = '0'
      companyWebsite.style.fontSize = '13px'
      
      companyInfo.appendChild(companyName)
      companyInfo.appendChild(companyAddress)
      companyInfo.appendChild(companyCity)
      companyInfo.appendChild(companyEmail)
      companyInfo.appendChild(companyWebsite)
      
      // Add elements to header container - invoice details on left, company info on right
      headerContainer.appendChild(invoiceDetails)
      headerContainer.appendChild(companyInfo)
      pdfContainer.appendChild(headerContainer)
      
      // Customer info
      const customerSection = document.createElement('div')
      customerSection.style.marginBottom = '30px'
      customerSection.style.width = '100%'
      
      const billToTitle = document.createElement('h3')
      billToTitle.textContent = invoiceT.billTo
      billToTitle.style.margin = '0 0 8px 0'
      billToTitle.style.color = '#333'
      billToTitle.style.fontSize = '14px'
      billToTitle.style.fontWeight = 'bold'
      
      const customerName = document.createElement('p')
      customerName.textContent = booking?.customer_name || (invoiceLanguage === 'ja' ? 'お客様' : 'N/A')
      customerName.style.margin = '0 0 3px 0'
      customerName.style.fontWeight = 'bold'
      customerName.style.fontSize = '13px'
      
      const customerEmail = document.createElement('p')
      customerEmail.textContent = booking?.customer_email || (invoiceLanguage === 'ja' ? '記載なし' : 'N/A')
      customerEmail.style.margin = '0 0 3px 0'
      customerEmail.style.fontSize = '13px'
      
      const customerPhone = document.createElement('p')
      customerPhone.textContent = booking?.customer_phone || (invoiceLanguage === 'ja' ? '記載なし' : 'N/A')
      customerPhone.style.margin = '0'
      customerPhone.style.fontSize = '13px'
      
      customerSection.appendChild(billToTitle)
      customerSection.appendChild(customerName)
      customerSection.appendChild(customerEmail)
      customerSection.appendChild(customerPhone)
      pdfContainer.appendChild(customerSection)
      
      // Service description
      const serviceSection = document.createElement('div')
      serviceSection.style.marginBottom = '25px'
      serviceSection.style.width = '100%'
      
      const serviceTitle = document.createElement('h3')
      serviceTitle.textContent = invoiceT.serviceDetails
      serviceTitle.style.margin = '0 0 10px 0'
      serviceTitle.style.color = '#333'
      serviceTitle.style.fontSize = '14px'
      serviceTitle.style.fontWeight = 'bold'
      
      // Create table for service details
      const serviceTable = document.createElement('table')
      serviceTable.style.width = '100%'
      serviceTable.style.borderCollapse = 'collapse'
      serviceTable.style.tableLayout = 'fixed' // Ensure table respects column widths
      
      const tableHeader = document.createElement('thead')
      tableHeader.style.backgroundColor = '#f3f3f3'
      tableHeader.style.color = '#333'
      
      const headerRow = document.createElement('tr')
      
      // Column widths as percentages
      const columnWidths = ['45%', '15%', '15%', '25%'];
      const headers = [invoiceT.serviceDescription, invoiceT.date, invoiceT.quantity, invoiceT.price];
      
      headers.forEach((headerText, index) => {
        const th = document.createElement('th')
        th.textContent = headerText
        th.style.padding = '10px'
        th.style.textAlign = index > 1 ? 'right' : 'left'
        th.style.borderBottom = '1px solid #e2e8f0'
        th.style.fontSize = '13px'
        th.style.fontWeight = 'bold'
        th.style.width = columnWidths[index] // Set column width
        headerRow.appendChild(th)
      })
      
      tableHeader.appendChild(headerRow)
      serviceTable.appendChild(tableHeader)
      
      const tableBody = document.createElement('tbody')
      
      // Main service row
      const serviceRow = document.createElement('tr')
      
      const serviceDescription = document.createElement('td')
      serviceDescription.textContent = booking?.service_name || invoiceT.transportationService
      serviceDescription.style.padding = '10px'
      serviceDescription.style.borderBottom = '1px solid #e2e8f0'
      serviceDescription.style.fontSize = '13px'
      serviceDescription.style.width = columnWidths[0]
      
      const serviceDate = document.createElement('td')
      const bookingDate = booking?.date || 'N/A'
      serviceDate.textContent = bookingDate
      serviceDate.style.padding = '10px'
      serviceDate.style.borderBottom = '1px solid #e2e8f0'
      serviceDate.style.fontSize = '13px'
      serviceDate.style.width = columnWidths[1]
      
      const serviceQuantity = document.createElement('td')
      serviceQuantity.textContent = '1'
      serviceQuantity.style.padding = '10px'
      serviceQuantity.style.textAlign = 'right'
      serviceQuantity.style.borderBottom = '1px solid #e2e8f0'
      serviceQuantity.style.fontSize = '13px'
      serviceQuantity.style.width = columnWidths[2]
      
      const servicePrice = document.createElement('td')
      const priceAmount = booking?.price?.amount || 0
      servicePrice.textContent = formatCurrency(priceAmount, booking?.price?.currency || 'JPY')
      servicePrice.style.padding = '10px'
      servicePrice.style.textAlign = 'right'
      servicePrice.style.borderBottom = '1px solid #e2e8f0'
      servicePrice.style.fontSize = '13px'
      servicePrice.style.width = columnWidths[3]
      
      serviceRow.appendChild(serviceDescription)
      serviceRow.appendChild(serviceDate)
      serviceRow.appendChild(serviceQuantity)
      serviceRow.appendChild(servicePrice)
      tableBody.appendChild(serviceRow)
      
      serviceTable.appendChild(tableBody)
      serviceSection.appendChild(serviceTitle)
      serviceSection.appendChild(serviceTable)
      pdfContainer.appendChild(serviceSection)
      
      // Add a horizontal line after service table
      const horizontalLine = document.createElement('hr')
      horizontalLine.style.border = 'none'
      horizontalLine.style.borderTop = '1px solid #e2e8f0'
      horizontalLine.style.margin = '30px 0'
      pdfContainer.appendChild(horizontalLine)
      
      // Total amount
      const totalSection = document.createElement('div')
      totalSection.style.width = '100%'
      totalSection.style.display = 'flex'
      totalSection.style.justifyContent = 'flex-end'
      totalSection.style.marginBottom = '35px'
      
      const totalTable = document.createElement('table')
      totalTable.style.width = '250px'
      totalTable.style.borderCollapse = 'collapse'
      
      // Subtotal row
      const subtotalRow = document.createElement('tr')
      
      const subtotalLabel = document.createElement('td')
      subtotalLabel.textContent = invoiceT.subtotal
      subtotalLabel.style.padding = '5px 15px 5px 0'
      subtotalLabel.style.textAlign = 'right'
      subtotalLabel.style.fontWeight = 'normal'
      subtotalLabel.style.fontSize = '13px'
      subtotalLabel.style.width = '60%'
      
      const subtotalAmount = document.createElement('td')
      subtotalAmount.textContent = formatCurrency(priceAmount, booking?.price?.currency || 'JPY')
      subtotalAmount.style.padding = '5px 0'
      subtotalAmount.style.textAlign = 'right'
      subtotalAmount.style.fontSize = '13px'
      subtotalAmount.style.width = '40%'
      
      subtotalRow.appendChild(subtotalLabel)
      subtotalRow.appendChild(subtotalAmount)
      totalTable.appendChild(subtotalRow)
      
      // No tax applied
      
      // Total row
      const totalRow = document.createElement('tr')
      totalRow.style.backgroundColor = '#f3f3f3'
      
      const totalLabel = document.createElement('td')
      totalLabel.textContent = invoiceT.total
      totalLabel.style.padding = '8px 15px 8px 0'
      totalLabel.style.textAlign = 'right'
      totalLabel.style.fontWeight = 'bold'
      totalLabel.style.color = '#333'
      totalLabel.style.fontSize = '14px'
      
      const totalAmount = document.createElement('td')
      totalAmount.textContent = formatCurrency(priceAmount, booking?.price?.currency || 'JPY')
      totalAmount.style.padding = '8px 0'
      totalAmount.style.textAlign = 'right'
      totalAmount.style.fontWeight = 'bold'
      totalAmount.style.color = '#333'
      totalAmount.style.fontSize = '14px'
      
      totalRow.appendChild(totalLabel)
      totalRow.appendChild(totalAmount)
      totalTable.appendChild(totalRow)
      
      totalSection.appendChild(totalTable)
      pdfContainer.appendChild(totalSection)
      
      // Add footer with thanks
      const footer = document.createElement('div')
      footer.style.borderTop = '1px solid #e2e8f0'
      footer.style.paddingTop = '20px'
      footer.style.paddingBottom = '20px'
      footer.style.textAlign = 'center'
      footer.style.marginTop = '20px'
      footer.style.width = '100%'
      
      const thanksMessage = document.createElement('p')
      thanksMessage.textContent = invoiceT.thanksMessage
      thanksMessage.style.margin = '0 0 10px 0'
      thanksMessage.style.fontSize = '14px'
      thanksMessage.style.fontWeight = 'bold'
      thanksMessage.style.color = '#333'
      thanksMessage.style.textAlign = 'center'
      
      const footerText = document.createElement('p')
      footerText.textContent = invoiceT.contactMessage
      footerText.style.margin = '0 0 5px 0'
      footerText.style.fontSize = '13px'
      footerText.style.textAlign = 'center'
      
      const companyFooter = document.createElement('p')
      companyFooter.textContent = invoiceT.companyFooter
      companyFooter.style.margin = '10px 0 0 0'
      companyFooter.style.fontSize = '13px'
      companyFooter.style.color = '#666'
      companyFooter.style.textAlign = 'center'
      
      footer.appendChild(thanksMessage)
      footer.appendChild(footerText)
      footer.appendChild(companyFooter)
      pdfContainer.appendChild(footer)
      
      // Add to document body
      document.body.appendChild(pdfContainer)
      
      let pdfBlob: Blob | null = null;
      
      try {
        // Wait for images to load properly
        await new Promise(resolve => {
          if (logo.complete) {
            resolve(null);
          } else {
            logo.onload = () => resolve(null);
            logo.onerror = () => {
              console.warn('Logo failed to load, continuing with PDF generation');
              resolve(null);
            };
          }
        });
        
        // Extra delay to ensure content is fully rendered
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Convert the container to PDF
        const pdfOptions = {
          margin: [15, 15, 15, 15], // Margins: [top, left, bottom, right] in mm
          filename: `invoice-${booking?.id || booking?.booking_id || 'details'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            allowTaint: true
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        if (!email) {
          // Generate and save PDF directly if not sending email
          const worker = html2pdf()
            .set(pdfOptions)
            .from(pdfContainer);
          
          await worker.save();
          
          toast({
            title: "Success",
            description: "Invoice generated successfully",
            variant: "default"
          });
        } else {
          // Get PDF blob for email attachment
          pdfBlob = await html2pdf()
            .set({...pdfOptions, filename: undefined})
            .from(pdfContainer)
            .outputPdf('blob');
        }
      } catch (error) {
        console.error('Error during PDF generation:', error);
        toast({
          title: "Error",
          description: "Invoice generation failed. Please try again.",
          variant: "destructive"
        });
      } finally {
        // Always clean up the temporary element
        if (document.body.contains(pdfContainer)) {
          document.body.removeChild(pdfContainer);
        }
      }
      
      return pdfBlob;
    } catch (error) {
      console.error('Error during invoice generation setup:', error);
      toast({
        title: "Error", 
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }

  const handleGenerateInvoice = async () => {
    await generateInvoice(false, language as 'en' | 'ja');
  }
  
  const handleEmailDialogOpen = () => {
    if (booking?.customer_email) {
      setEmailAddress(booking.customer_email);
    }
    // Set default email language to current UI language
    setEmailLanguage(language as 'en' | 'ja');
    setEmailDialogOpen(true);
  }
  
  const handleSendEmail = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Generate the PDF and get the blob with the selected language
      const pdfBlob = await generateInvoice(true, emailLanguage);
      
      if (!pdfBlob) {
        throw new Error('Failed to generate invoice PDF');
      }
      
      // Send the PDF via API endpoint
      const formData = new FormData();
      formData.append('email', emailAddress);
      formData.append('booking_id', booking.id || booking.booking_id || '');
      formData.append('include_details', includeBookingDetails.toString());
      formData.append('language', emailLanguage); // Add language parameter for email
      formData.append('invoice_pdf', pdfBlob, `invoice-${booking.id || booking.booking_id || 'booking'}.pdf`);
      
      try {
        const response = await fetch('/api/send-invoice-email', {
          method: 'POST',
          body: formData
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('Email API response error:', responseData);
          throw new Error(responseData.error || 'Failed to send email');
        }
        
        toast({
          title: "Success",
          description: `Invoice sent to ${emailAddress}`,
          variant: "default"
        });
        setEmailDialogOpen(false);
      } catch (apiError) {
        console.error('API call error:', apiError);
        toast({
          title: "Error",
          description: `Email service currently unavailable. Please try again later.`,
          variant: "destructive"
        });
        
        // For development/demo purposes - simulate success when API fails
        if (process.env.NODE_ENV !== 'production') {
          toast({
            title: "Demo Mode",
            description: `Email would be sent to ${emailAddress} in production.`,
            variant: "default"
          });
          setEmailDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error in email sending process:', error);
      toast({
        title: "Error",
        description: "Failed to prepare invoice for email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <BookingButton 
          variant="outline"
          icon={<FileText className="h-5 w-5" />}
          onClick={handleGenerateInvoice}
          disabled={isGenerating || !booking}
        >
          {isGenerating ? 
            (t('common.exporting') || 'Generating...') : 
            (t('bookings.actions.generateInvoice') || 'Generate Invoice')
          }
        </BookingButton>
        
        <BookingButton 
          variant="outline"
          icon={<Mail className="h-5 w-5" />}
          onClick={handleEmailDialogOpen}
          disabled={isGenerating || !booking}
        >
          {t('bookings.actions.emailInvoice') || 'Email Invoice'}
        </BookingButton>
      </div>
      
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('bookings.actions.emailInvoice') || 'Email Invoice'}</DialogTitle>
            <DialogDescription>
              {t('bookings.invoice.emailDescription') || 'Send the invoice as a PDF attachment to the customer\'s email address.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                {t('common.email') || 'Email'}
              </Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                {t('settings.preferences.language.title') || 'Language'}
              </Label>
              <RadioGroup 
                value={emailLanguage} 
                onValueChange={(value) => setEmailLanguage(value as 'en' | 'ja')}
                className="col-span-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label htmlFor="lang-en">{t('settings.preferences.language.en') || 'English'}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ja" id="lang-ja" />
                  <Label htmlFor="lang-ja">{t('settings.preferences.language.ja') || '日本語'}</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div></div>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="include-details" 
                  checked={includeBookingDetails}
                  onCheckedChange={(checked) => setIncludeBookingDetails(checked === true)}
                />
                <label
                  htmlFor="include-details"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('bookings.invoice.includeDetails') || 'Include booking details'}
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isGenerating || !emailAddress}
            >
              {isGenerating ? (t('common.sending') || 'Sending...') : (t('common.send') || 'Send Email')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 