'use client'

import { FileText, Mail } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useState } from 'react'
// Dynamic import for html2pdf to avoid SSR issues
import { toast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

// Quotation translations for different languages
const quotationTranslations = {
  en: {
    quotation: 'QUOTATION',
    quotationNumber: 'Quotation #:',
    quotationDate: 'Quotation Date:',
    expiryDate: 'Expiry Date:',
    validFor: 'Valid for:',
    days: 'days',
    companyName: 'Driver (Thailand) Company Limited',
    companyAddress1: '580/17 Soi Ramkhamhaeng 39',
    companyAddress2: 'Wang Thong Lang',
    companyAddress3: 'Bangkok 10310',
    companyAddress4: 'Thailand',
    companyTaxId: 'Tax ID: 0105566135845',
    customerInfo: 'CUSTOMER INFO:',
    serviceInfo: 'SERVICE INFO:',
    serviceType: 'Service Type:',
    vehicleType: 'Vehicle Type:',
    pickupDate: 'Pickup Date:',
    pickupTime: 'Pickup Time:',
    duration: 'Duration:',
    hours: 'hours',
    priceDetails: 'PRICE DETAILS:',
    items: {
      description: 'Description',
      price: 'Price',
      total: 'Total'
    },
    subtotal: 'Subtotal:',
    discount: 'Discount:',
    tax: 'Tax:',
    total: 'TOTAL:',
    thanksMessage: 'Thank you for considering our services!',
    contactMessage: 'If you have any questions about this quotation, please contact us at info@japandriver.com',
    companyFooter: 'Driver (Thailand) Company Limited • www.japandriver.com',
    termsAndConditions: 'Terms and Conditions',
    termsContent: '1. This quotation is valid for the specified period from the date of issue.\n2. Prices are subject to change if requirements change.\n3. Payment terms: 50% advance, 50% before service.\n4. Cancellation policy: 100% refund if cancelled 7+ days before service, 50% refund if 3-7 days, no refund if less than 3 days.',
    billingAddress: 'BILLING ADDRESS:',
    companyNameLabel: 'Company:',
    taxNumber: 'Tax ID:',
    address: 'Address:',
    cityStatePostal: 'City/State/Postal:',
    country: 'Country:'
  },
  ja: {
    quotation: '見積書',
    quotationNumber: '見積書番号:',
    quotationDate: '見積書発行日:',
    expiryDate: '有効期限:',
    validFor: '有効期間:',
    days: '日間',
    companyName: 'Driver (Thailand) Company Limited',
    companyAddress1: '580/17 Soi Ramkhamhaeng 39',
    companyAddress2: 'Wang Thong Lang',
    companyAddress3: 'Bangkok 10310',
    companyAddress4: 'Thailand',
    companyTaxId: 'Tax ID: 0105566135845',
    customerInfo: 'お客様情報:',
    serviceInfo: 'サービス情報:',
    serviceType: 'サービスタイプ:',
    vehicleType: '車両タイプ:',
    pickupDate: '送迎日:',
    pickupTime: '送迎時間:',
    duration: '利用時間:',
    hours: '時間',
    priceDetails: '価格詳細:',
    items: {
      description: '内容',
      price: '価格',
      total: '合計'
    },
    subtotal: '小計:',
    discount: '割引:',
    tax: '税金:',
    total: '合計:',
    thanksMessage: 'ご検討いただきありがとうございます。',
    contactMessage: 'この見積書に関するお問い合わせは info@japandriver.com までご連絡ください。',
    companyFooter: 'Driver (Thailand) Company Limited • www.japandriver.com',
    termsAndConditions: '利用規約',
    termsContent: '1. この見積書は発行日から指定された期間内有効です。\n2. 要件が変更された場合、価格も変更される場合があります。\n3. 支払条件: 前払い50%、サービス前に残りの50%。\n4. キャンセルポリシー: サービス開始7日以上前のキャンセルは全額返金、3～7日前は50%返金、3日未満は返金なし。',
    billingAddress: '請求先住所:',
    companyNameLabel: '会社名:',
    taxNumber: '税番号:',
    address: '住所:',
    cityStatePostal: '市区町村/都道府県/郵便番号:',
    country: '国:'
  }
};

interface QuotationPdfButtonProps {
  quotation?: any;
  onSuccess?: () => void;
}

export function QuotationPdfButton({ quotation, onSuccess }: QuotationPdfButtonProps) {
  const { t, language } = useI18n()
  const [isGenerating, setIsGenerating] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [includeDetails, setIncludeDetails] = useState(true)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [emailLanguage, setEmailLanguage] = useState<'en' | 'ja'>(language as 'en' | 'ja')
  
  const formatCurrency = (amount: number, currency: string = 'JPY') => {
    // Use the quotation's display_currency if available, otherwise default to JPY
    const currencyToUse = quotation?.display_currency || quotation?.currency || currency;
    if (!amount) return currencyToUse === 'JPY' ? `¥0` : `${currencyToUse} 0`;
    return currencyToUse === 'JPY' 
      ? `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `${currencyToUse} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const generateQuotationPdf = async (email: boolean = false, docLanguage: 'en' | 'ja' = 'en'): Promise<Blob | null> => {
    if (!quotation) {
      toast({
        title: "Error",
        description: "No quotation data provided",
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
          description: "PDF generation is only available in browser environment",
          variant: "destructive",
        });
        return null;
      }
      
      // Get the latest quotation data from the database
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest quotation data');
      }
      
      // Get the latest quotation data
      const latestQuotation = await response.json();
      if (!latestQuotation) {
        throw new Error('No quotation data returned from API');
      }
      
      // Get translations for the selected language
      const quotationT = quotationTranslations[docLanguage];
      
      // Create a new element to format as a PDF
      const pdfContainer = document.createElement('div')
      pdfContainer.className = 'quotation-export-container'
      pdfContainer.style.fontFamily = 'Work Sans, sans-serif'
      pdfContainer.style.color = '#333'
      pdfContainer.style.backgroundColor = '#fff'
      pdfContainer.style.padding = '10px 0px 0px'
      pdfContainer.style.width = '180mm' // A4 width
      pdfContainer.style.boxSizing = 'border-box'
      pdfContainer.style.position = 'relative'
      pdfContainer.style.margin = '0 auto'
      pdfContainer.style.borderTop = '2px solid #FF2600' // Add red border at top
      
      // Add font link to ensure Work Sans is loaded
      const fontLink = document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap'
      document.head.appendChild(fontLink)
      
      // Add company logo
      const logoContainer = document.createElement('div')
      logoContainer.style.textAlign = 'left'
      logoContainer.style.marginBottom = '20px' // Reduced from 30px
      logoContainer.style.marginTop = '20px' // Reduced from 30px
      
      const logo = document.createElement('img')
      logo.src = '/img/driver-header-logo.png'
      logo.alt = 'Driver Logo'
      logo.style.height = '50px'
      
      logoContainer.appendChild(logo)
      pdfContainer.appendChild(logoContainer)
      
      // Create quotation header with company and client info in two columns
      const headerContainer = document.createElement('div')
      headerContainer.style.display = 'flex'
      headerContainer.style.justifyContent = 'space-between'
      headerContainer.style.alignItems = 'flex-start'
      headerContainer.style.marginBottom = '25px' // Reduced from 40px
      headerContainer.style.width = '100%'
      
      // Quotation title and details (left side)
      const quotationDetails = document.createElement('div')
      quotationDetails.style.flex = '1'
      quotationDetails.style.textAlign = 'left'
      quotationDetails.style.maxWidth = '50%'
      
      const quotationTitle = document.createElement('h1')
      quotationTitle.textContent = quotationT.quotation
      quotationTitle.style.color = '#333'
      quotationTitle.style.margin = '0 0 15px 0'
      quotationTitle.style.fontSize = '24px'
      quotationTitle.style.fontWeight = 'bold'
      
      // Format quotation number with JPDR prefix and padding
      const formattedQuotationId = `JPDR-${latestQuotation?.quote_number?.toString().padStart(4, '0') || 'N/A'}`
      
      const quotationNumber = document.createElement('p')
      quotationNumber.textContent = `${quotationT.quotationNumber} ${formattedQuotationId}`
      quotationNumber.style.margin = '0 0 5px 0'
      quotationNumber.style.fontWeight = 'normal'
      quotationNumber.style.fontSize = '13px'
      
      const today = new Date()
      const quotationDate = document.createElement('p')
      quotationDate.textContent = `${quotationT.quotationDate} ${latestQuotation?.created_at ? 
        new Date(latestQuotation.created_at).toLocaleDateString(docLanguage === 'ja' ? 'ja-JP' : 'en-US') : 
        today.toLocaleDateString(docLanguage === 'ja' ? 'ja-JP' : 'en-US')}`
      quotationDate.style.margin = '0 0 5px 0'
      quotationDate.style.fontSize = '13px'
      
      // Calculate expiry date (30 days from creation by default)
      const creationDate = latestQuotation?.created_at ? new Date(latestQuotation.created_at) : new Date()
      const validDays = latestQuotation?.valid_days || 2
      const expiryDate = new Date(creationDate)
      expiryDate.setDate(expiryDate.getDate() + validDays)
      
      const expiryDateString = expiryDate.toLocaleDateString(docLanguage === 'ja' ? 'ja-JP' : 'en-US')
      const expiryText = document.createElement('p')
      expiryText.textContent = `${quotationT.expiryDate} ${expiryDateString}`
      expiryText.style.margin = '0 0 5px 0'
      expiryText.style.fontSize = '13px'
      
      // Use the latest data from the quotation for valid days
      const validDaysText = document.createElement('p')
      validDaysText.textContent = `${quotationT.validFor} ${validDays} ${quotationT.days}`
      validDaysText.style.margin = '0'
      validDaysText.style.fontSize = '13px'
      
      quotationDetails.appendChild(quotationTitle)
      quotationDetails.appendChild(quotationNumber)
      quotationDetails.appendChild(quotationDate)
      quotationDetails.appendChild(expiryText)
      quotationDetails.appendChild(validDaysText)
      
      // Company information (right side)
      const companyInfo = document.createElement('div')
      companyInfo.style.flex = '1'
      companyInfo.style.maxWidth = '40%'
      companyInfo.style.textAlign = 'right'
      companyInfo.style.paddingTop = '5px' // Align company name a bit lower if title is long
      
      const companyName = document.createElement('h2')
      companyName.textContent = quotationT.companyName
      companyName.style.margin = '0 0 5px 0'
      companyName.style.color = '#333'
      companyName.style.fontSize = '16px'
      
      const companyAddress = document.createElement('p')
      companyAddress.textContent = quotationT.companyAddress1
      companyAddress.style.margin = '0 0 2px 0'
      companyAddress.style.fontSize = '13px'
      
      const companyCity = document.createElement('p')
      companyCity.textContent = quotationT.companyAddress2
      companyCity.style.margin = '0 0 2px 0'
      companyCity.style.fontSize = '13px'
      
      const companyState = document.createElement('p')
      companyState.textContent = quotationT.companyAddress3
      companyState.style.margin = '0 0 2px 0'
      companyState.style.fontSize = '13px'
      
      const companyCountry = document.createElement('p')
      companyCountry.textContent = quotationT.companyAddress4
      companyCountry.style.margin = '0 0 10px 0'
      companyCountry.style.fontSize = '13px'
      
      const companyTaxId = document.createElement('p')
      companyTaxId.textContent = quotationT.companyTaxId
      companyTaxId.style.margin = '0 0 10px 0'
      companyTaxId.style.fontSize = '13px'
      
      companyInfo.appendChild(companyName)
      companyInfo.appendChild(companyAddress)
      companyInfo.appendChild(companyCity)
      companyInfo.appendChild(companyState)
      companyInfo.appendChild(companyCountry)
      companyInfo.appendChild(companyTaxId)
      
      // Add elements to header container
      headerContainer.appendChild(quotationDetails)
      headerContainer.appendChild(companyInfo)
      pdfContainer.appendChild(headerContainer)
      
      // Customer info section with combined billing info
      const customerSection = document.createElement('div')
      customerSection.style.marginBottom = '32px' // Increased for more separation
      customerSection.style.width = '100%'
      
      const customerTitle = document.createElement('h3')
      customerTitle.textContent = quotationT.billingAddress
      customerTitle.style.margin = '0 0 8px 0'
      customerTitle.style.color = '#333'
      customerTitle.style.fontSize = '14px'
      customerTitle.style.fontWeight = 'bold'
      
      // Customer basic info
      const customerName = document.createElement('p')
      customerName.textContent = quotation?.customer_name || (quotation?.customers?.name || 'N/A')
      customerName.style.margin = '0 0 3px 0'
      customerName.style.fontWeight = 'normal'
      customerName.style.fontSize = '13px'
      
      const customerEmail = document.createElement('p')
      customerEmail.textContent = quotation?.customer_email || (quotation?.customers?.email || 'N/A')
      customerEmail.style.margin = '0 0 3px 0'
      customerEmail.style.fontSize = '13px'
      
      const customerPhone = document.createElement('p')
      customerPhone.textContent = quotation?.customer_phone || (quotation?.customers?.phone || 'N/A')
      customerPhone.style.margin = '0 0 15px 0' // Added space after phone
      customerPhone.style.fontSize = '13px'
      
      customerSection.appendChild(customerTitle)
      customerSection.appendChild(customerName)
      customerSection.appendChild(customerEmail)
      customerSection.appendChild(customerPhone)
      
      // Add Billing info to the same section
      const hasBillingInfo = quotation?.billing_company_name || 
                            quotation?.billing_tax_number || 
                            quotation?.billing_street_name || 
                            quotation?.billing_street_number ||
                            quotation?.billing_city ||
                            quotation?.billing_state ||
                            quotation?.billing_postal_code ||
                            quotation?.billing_country;
                            
      if (hasBillingInfo) {
        customerSection.style.marginBottom = '15px' // Reduced from 20px
        const billingInfoContainer = document.createElement('div');
        billingInfoContainer.style.marginTop = '10px'; // Reduced from 15px

        // Company name if available
        if (quotation?.billing_company_name) {
          const companyNameEl = document.createElement('p')
          companyNameEl.innerHTML = `<strong>${quotationT.companyNameLabel}</strong> ${quotation.billing_company_name}`
          companyNameEl.style.margin = '0 0 3px 0'
          companyNameEl.style.fontSize = '13px'
          customerSection.appendChild(companyNameEl)
        }
        
        // Tax number if available
        if (quotation?.billing_tax_number) {
          const taxNumberEl = document.createElement('p')
          taxNumberEl.innerHTML = `<strong>${quotationT.taxNumber}</strong> ${quotation.billing_tax_number}`
          taxNumberEl.style.margin = '0 0 3px 0'
          taxNumberEl.style.fontSize = '13px'
          customerSection.appendChild(taxNumberEl)
        }
        
        // Street address if available
        if (quotation?.billing_street_name || quotation?.billing_street_number) {
          const addressEl = document.createElement('p')
          addressEl.innerHTML = `<strong>${quotationT.address}</strong> ${quotation.billing_street_name || ''} ${quotation.billing_street_number || ''}`
          addressEl.style.margin = '0 0 3px 0'
          addressEl.style.fontSize = '13px'
          customerSection.appendChild(addressEl)
        }
        
        // City, State, Postal code if available
        if (quotation?.billing_city || quotation?.billing_state || quotation?.billing_postal_code) {
          const cityStateEl = document.createElement('p')
          cityStateEl.innerHTML = `<strong>${quotationT.cityStatePostal}</strong> ${quotation.billing_city || ''} ${quotation.billing_state ? ', ' + quotation.billing_state : ''} ${quotation.billing_postal_code ? ', ' + quotation.billing_postal_code : ''}`
          cityStateEl.style.margin = '0 0 3px 0'
          cityStateEl.style.fontSize = '13px'
          customerSection.appendChild(cityStateEl)
        }
        
        // Country if available
        if (quotation?.billing_country) {
          const countryEl = document.createElement('p')
          countryEl.innerHTML = `<strong>${quotationT.country}</strong> ${quotation.billing_country}`
          countryEl.style.margin = '0'
          countryEl.style.fontSize = '13px'
          customerSection.appendChild(countryEl)
        }
      }
      
      pdfContainer.appendChild(customerSection)
      
      // Add package and promotion information section if available
      const hasPackageOrPromotion = latestQuotation?.selected_package_name || latestQuotation?.selected_promotion_name;
      if (hasPackageOrPromotion) {
        const featuresSection = document.createElement('div')
        featuresSection.style.marginBottom = '32px'
        featuresSection.style.width = '100%'
        
        const featuresTitle = document.createElement('h3')
        featuresTitle.textContent = docLanguage === 'ja' ? '適用された特典' : 'Applied Features'
        featuresTitle.style.margin = '0 0 12px 0'
        featuresTitle.style.color = '#333'
        featuresTitle.style.fontSize = '14px'
        featuresTitle.style.fontWeight = 'bold'
        featuresTitle.style.borderBottom = '1px solid #e0e0e0'
        featuresTitle.style.paddingBottom = '5px'
        
        featuresSection.appendChild(featuresTitle)
        
        // Package information
        if (latestQuotation?.selected_package_name) {
          const packageDiv = document.createElement('div')
          packageDiv.style.padding = '12px'
          packageDiv.style.marginBottom = '8px'
          packageDiv.style.borderLeft = '4px solid #3b82f6'
          packageDiv.style.backgroundColor = '#f8fafc'
          packageDiv.style.borderRadius = '4px'
          
          const packageTitle = document.createElement('div')
          packageTitle.style.fontWeight = 'bold'
          packageTitle.style.fontSize = '13px'
          packageTitle.style.color = '#1e40af'
          packageTitle.style.marginBottom = '4px'
          packageTitle.textContent = `📦 ${docLanguage === 'ja' ? 'パッケージ' : 'Package'}: ${latestQuotation.selected_package_name}`
          
          packageDiv.appendChild(packageTitle)
          
          if (latestQuotation.selected_package_description) {
            const packageDesc = document.createElement('div')
            packageDesc.style.fontSize = '12px'
            packageDesc.style.color = '#64748b'
            packageDesc.textContent = latestQuotation.selected_package_description
            packageDiv.appendChild(packageDesc)
          }
          
          featuresSection.appendChild(packageDiv)
        }
        
        // Promotion information
        if (latestQuotation?.selected_promotion_name) {
          const promotionDiv = document.createElement('div')
          promotionDiv.style.padding = '12px'
          promotionDiv.style.marginBottom = '8px'
          promotionDiv.style.borderLeft = '4px solid #10b981'
          promotionDiv.style.backgroundColor = '#f0fdf4'
          promotionDiv.style.borderRadius = '4px'
          
          const promotionTitle = document.createElement('div')
          promotionTitle.style.fontWeight = 'bold'
          promotionTitle.style.fontSize = '13px'
          promotionTitle.style.color = '#047857'
          promotionTitle.style.marginBottom = '4px'
          promotionTitle.textContent = `🎁 ${docLanguage === 'ja' ? 'プロモーション' : 'Promotion'}: ${latestQuotation.selected_promotion_name}`
          
          promotionDiv.appendChild(promotionTitle)
          
          if (latestQuotation.selected_promotion_description) {
            const promotionDesc = document.createElement('div')
            promotionDesc.style.fontSize = '12px'
            promotionDesc.style.color = '#64748b'
            promotionDesc.textContent = latestQuotation.selected_promotion_description
            promotionDiv.appendChild(promotionDesc)
          }
          
          if (latestQuotation.selected_promotion_code) {
            const promotionCode = document.createElement('div')
            promotionCode.style.fontSize = '11px'
            promotionCode.style.color = '#059669'
            promotionCode.style.marginTop = '4px'
            promotionCode.textContent = `${docLanguage === 'ja' ? 'コード' : 'Code'}: ${latestQuotation.selected_promotion_code}`
            promotionDiv.appendChild(promotionCode)
          }
          
          featuresSection.appendChild(promotionDiv)
        }
        
        pdfContainer.appendChild(featuresSection)
      }
      
      // Price details section - With service type and vehicle type in description
      const priceSection = document.createElement('div')
      priceSection.style.marginBottom = '15px'
      priceSection.style.marginTop = '60px' // Ensure no extra top margin
      priceSection.style.width = '100%'
      
      const priceTitle = document.createElement('h3')
      priceTitle.textContent = quotationT.priceDetails
      priceTitle.style.color = '#333'
      priceTitle.style.fontSize = '14px'
      priceTitle.style.fontWeight = 'bold'
      priceTitle.style.borderBottom = '1px solid #e0e0e0'
      priceTitle.style.paddingBottom = '5px' 
      priceTitle.style.marginBottom = '8px' // Added to reduce space after title
      
      priceSection.appendChild(priceTitle)
      
      // Create a container for the price details with light gray background
      const priceDetailsContainer = document.createElement('div')
      priceDetailsContainer.style.backgroundColor = '#f9f9f9'
      priceDetailsContainer.style.padding = '10px' // Reduced from 15px
      priceDetailsContainer.style.borderRadius = '4px'
      priceDetailsContainer.style.marginBottom = '15px'
      priceDetailsContainer.style.marginTop = '5px' // Reduced from 10px
      
      // Create header row with Description and Price
      const headerRow = document.createElement('div')
      headerRow.style.display = 'flex'
      headerRow.style.justifyContent = 'space-between'
      headerRow.style.marginBottom = '8px' // Reduced from 10px
      headerRow.style.borderBottom = '1px solid #e2e8f0'
      headerRow.style.paddingBottom = '6px' // Reduced from 8px
      
      const descriptionHeader = document.createElement('div')
      descriptionHeader.textContent = quotationT.items.description
      descriptionHeader.style.fontWeight = 'bold'
      descriptionHeader.style.fontSize = '13px'
      descriptionHeader.style.color = '#555' // Darker gray for header text
      descriptionHeader.style.flex = '3'
      
      const priceHeader = document.createElement('div')
      priceHeader.textContent = quotationT.items.price
      priceHeader.style.fontWeight = 'bold'
      priceHeader.style.fontSize = '13px'
      priceHeader.style.color = '#555' // Darker gray for header text
      priceHeader.style.flex = '1'
      priceHeader.style.textAlign = 'right'
      
      headerRow.appendChild(descriptionHeader)
      headerRow.appendChild(priceHeader)
      priceDetailsContainer.appendChild(headerRow)
      
      // Define currency variable before it's used in formatCurrencyValue
      const currency = latestQuotation?.display_currency || latestQuotation?.currency || 'JPY';
      
      // Format currency based on the quotation's currency with conversion
      const formatCurrencyValue = (value: number): string => {
        // Exchange rates (simplified for demo)
        const exchangeRates: Record<string, number> = {
          'JPY': 1,
          'USD': 0.0067,
          'EUR': 0.0062,
          'THB': 0.22,
          'CNY': 0.048,
          'SGD': 0.0091
        };

        // Convert amount from JPY to selected currency
        const convertedAmount = value * (exchangeRates[currency] / exchangeRates['JPY']);
        
        if (currency === 'JPY' || currency === 'CNY') {
          return currency === 'JPY' 
            ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        
        // Use locale and currency code for others
        try {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
          }).format(convertedAmount);
        } catch (error) {
          // Fallback if currency code is invalid
          return `${currency} ${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      };
      
      // Calculate correct base amount from quotation items
      const calculatedBaseAmount = latestQuotation?.quotation_items?.reduce((total: number, item: any) => {
        return total + ((item.unit_price || 0) * (item.service_days || 1));
      }, 0) || 0;

      // Check if we have quotation items (multiple services)
      if (latestQuotation?.quotation_items && Array.isArray(latestQuotation.quotation_items) && latestQuotation.quotation_items.length > 0) {
        // Display each service item individually
        latestQuotation.quotation_items.forEach((item: any, index: number) => {
          const serviceRow = document.createElement('div')
          serviceRow.style.display = 'flex'
          serviceRow.style.justifyContent = 'space-between'
          serviceRow.style.marginBottom = '6px' // Reduced from 10px
          serviceRow.style.padding = '3px 0' // Reduced from 5px
          serviceRow.style.borderBottom = index < latestQuotation.quotation_items.length - 1 ? '1px solid #edf2f7' : ''
          
          const serviceDetails = document.createElement('div')
          serviceDetails.style.flex = '3'
          serviceDetails.style.fontSize = '13px'
          
          // Create description with service and vehicle type
          const description = document.createElement('div')
          description.textContent = item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard'}`
          description.style.fontWeight = 'medium'
          description.style.marginBottom = '3px'
          
          // Create additional details for charter services
          if (item.service_type_name?.toLowerCase().includes('charter')) {
            // For charter services, show days and hours per day
            const details = document.createElement('div')
            details.style.fontSize = '12px'
            details.style.color = '#666'
            details.textContent = `${item.service_days || 1} ${quotationT.days}, ${item.hours_per_day || 8} ${quotationT.hours}/${quotationT.days}`
            serviceDetails.appendChild(description)
            serviceDetails.appendChild(details)
          } else {
            // For airport transfers, show pickup date if available
            if (item.pickup_date) {
              const details = document.createElement('div')
              details.style.fontSize = '12px'
              details.style.color = '#666'
              const pickupDate = new Date(item.pickup_date).toLocaleDateString(docLanguage === 'ja' ? 'ja-JP' : 'en-US')
              details.textContent = `${quotationT.pickupDate} ${pickupDate}${item.pickup_time ? `, ${quotationT.pickupTime} ${item.pickup_time}` : ''}`
              serviceDetails.appendChild(description)
              serviceDetails.appendChild(details)
            } else {
              serviceDetails.appendChild(description)
            }
          }
          
          const servicePrice = document.createElement('div')
          servicePrice.style.flex = '1'
          servicePrice.style.fontSize = '13px'
          servicePrice.style.textAlign = 'right'
          servicePrice.textContent = formatCurrencyValue(item.total_price || (item.unit_price * (item.quantity || 1)))
          
          serviceRow.appendChild(serviceDetails)
          serviceRow.appendChild(servicePrice)
          priceDetailsContainer.appendChild(serviceRow)
        })
        
        // Add a total/base amount row with separator
        const baseAmountRow = document.createElement('div')
        baseAmountRow.style.display = 'flex'
        baseAmountRow.style.justifyContent = 'space-between'
        baseAmountRow.style.marginTop = '8px' // Reduced from 10px
        baseAmountRow.style.marginBottom = '8px' // Reduced from 10px
        baseAmountRow.style.paddingTop = '8px' // Reduced from 10px
        baseAmountRow.style.borderTop = '1px solid #e2e8f0'
        baseAmountRow.style.padding = '6px 0' // Reduced from 8px
        
        const baseAmountLabel = document.createElement('div')
        baseAmountLabel.textContent = 'Base Amount'
        baseAmountLabel.style.fontSize = '13px'
        baseAmountLabel.style.fontWeight = 'medium'
        
        const baseAmountValue = document.createElement('div')
        baseAmountValue.textContent = formatCurrencyValue(calculatedBaseAmount)
        baseAmountValue.style.fontSize = '13px'
        baseAmountValue.style.fontWeight = 'medium'
        
        baseAmountRow.appendChild(baseAmountLabel)
        baseAmountRow.appendChild(baseAmountValue)
        priceDetailsContainer.appendChild(baseAmountRow)
      } else {
        // Fall back to the original display if no items are available
        // Vehicle Type row with empty price
        const vehicleTypeRow = document.createElement('div')
        vehicleTypeRow.style.display = 'flex'
        vehicleTypeRow.style.justifyContent = 'space-between'
        vehicleTypeRow.style.marginBottom = '10px'
        vehicleTypeRow.style.padding = '5px 0' // Add some vertical padding to rows
        
        const vehicleTypeLabel = document.createElement('div')
        vehicleTypeLabel.textContent = quotation?.vehicle_type || 'Toyota Alphard Executive Lounge'
        vehicleTypeLabel.style.fontSize = '13px'
        
        const emptyVehiclePrice = document.createElement('div')
        emptyVehiclePrice.style.fontSize = '13px'
        
        vehicleTypeRow.appendChild(vehicleTypeLabel)
        vehicleTypeRow.appendChild(emptyVehiclePrice)
        priceDetailsContainer.appendChild(vehicleTypeRow)
        
        // Calculate the hourly rate, days, and base amount
        const hours = latestQuotation?.duration_hours || latestQuotation?.hours_per_day || 8;
        const serviceDays = latestQuotation?.service_days || 1;
        let hourlyRate = latestQuotation?.amount ? (latestQuotation.amount / serviceDays) : 0;
        let baseAmount = latestQuotation?.amount || 0;
        
        // Hourly Rate row
        const hourlyRateRow = document.createElement('div')
        hourlyRateRow.style.display = 'flex'
        hourlyRateRow.style.justifyContent = 'space-between'
        hourlyRateRow.style.marginBottom = '10px'
        hourlyRateRow.style.padding = '5px 0' // Add some vertical padding to rows
        
        const hourlyRateLabel = document.createElement('div')
        hourlyRateLabel.textContent = `Hourly Rate (${hours} hours / day)`
        hourlyRateLabel.style.fontSize = '13px'
        
        const hourlyRateValue = document.createElement('div')
        hourlyRateValue.textContent = formatCurrencyValue(hourlyRate)
        hourlyRateValue.style.fontSize = '13px'
        hourlyRateValue.style.fontWeight = 'medium'
        
        hourlyRateRow.appendChild(hourlyRateLabel)
        hourlyRateRow.appendChild(hourlyRateValue)
        priceDetailsContainer.appendChild(hourlyRateRow)
        
        // Number of Days row (if more than 1)
        if (serviceDays > 1) {
          const daysRow = document.createElement('div')
          daysRow.style.display = 'flex'
          daysRow.style.justifyContent = 'space-between'
          daysRow.style.marginBottom = '10px'
          daysRow.style.padding = '5px 0' // Add some vertical padding to rows
          
          const daysLabel = document.createElement('div')
          daysLabel.textContent = 'Number of Days'
          daysLabel.style.fontSize = '13px'
          daysLabel.style.color = '#666'
          
          const daysValue = document.createElement('div')
          daysValue.textContent = `× ${serviceDays}`
          daysValue.style.fontSize = '13px'
          
          daysRow.appendChild(daysLabel)
          daysRow.appendChild(daysValue)
          priceDetailsContainer.appendChild(daysRow)
        }
        
        // Base Amount row with separator
        const baseAmountRow = document.createElement('div')
        baseAmountRow.style.display = 'flex'
        baseAmountRow.style.justifyContent = 'space-between'
        baseAmountRow.style.marginBottom = '10px'
        baseAmountRow.style.paddingTop = '10px'
        baseAmountRow.style.borderTop = '1px solid #e2e8f0'
        baseAmountRow.style.padding = '8px 0' // Add some vertical padding, adjust top/bottom
        
        const baseAmountLabel = document.createElement('div')
        baseAmountLabel.textContent = 'Base Amount'
        baseAmountLabel.style.fontSize = '13px'
        baseAmountLabel.style.fontWeight = 'medium'
        
        const baseAmountValue = document.createElement('div')
        baseAmountValue.textContent = formatCurrencyValue(calculatedBaseAmount)
        baseAmountValue.style.fontSize = '13px'
        baseAmountValue.style.fontWeight = 'medium'
        
        baseAmountRow.appendChild(baseAmountLabel)
        baseAmountRow.appendChild(baseAmountValue)
        priceDetailsContainer.appendChild(baseAmountRow)
      }
      
      // Add individual time-based pricing adjustments from service items
      let timeBasedAdjustmentTotal = 0;
      latestQuotation?.quotation_items?.forEach((item: any) => {
        if (item.time_based_adjustment && item.unit_price) {
          const itemBasePrice = (item.unit_price * (item.service_days || 1));
          const adjustmentAmount = itemBasePrice * (item.time_based_adjustment / 100);
          timeBasedAdjustmentTotal += adjustmentAmount;
          
          const timeBasedRow = document.createElement('div')
          timeBasedRow.style.display = 'flex'
          timeBasedRow.style.justifyContent = 'space-between'
          timeBasedRow.style.marginBottom = '6px'
          timeBasedRow.style.padding = '4px 8px'
          timeBasedRow.style.backgroundColor = adjustmentAmount > 0 ? '#fef3c7' : '#dcfce7'
          timeBasedRow.style.borderRadius = '4px'
          timeBasedRow.style.border = adjustmentAmount > 0 ? '1px solid #fbbf24' : '1px solid #22c55e'
          
          const timeBasedLabel = document.createElement('div')
          timeBasedLabel.textContent = `Time Adjustment: ${item.description || 'Service'} (${item.time_based_adjustment > 0 ? '+' : ''}${item.time_based_adjustment}%)`
          timeBasedLabel.style.fontSize = '11px'
          timeBasedLabel.style.fontWeight = '500'
          timeBasedLabel.style.color = adjustmentAmount > 0 ? '#f59e0b' : '#16a34a'
          
          const timeBasedValue = document.createElement('div')
          timeBasedValue.textContent = `${adjustmentAmount > 0 ? '+' : ''}${formatCurrencyValue(Math.abs(adjustmentAmount))}`
          timeBasedValue.style.fontSize = '11px'
          timeBasedValue.style.fontWeight = 'bold'
          timeBasedValue.style.color = adjustmentAmount > 0 ? '#f59e0b' : '#16a34a'
          
          timeBasedRow.appendChild(timeBasedLabel)
          timeBasedRow.appendChild(timeBasedValue)
          priceDetailsContainer.appendChild(timeBasedRow)
        }
      });
      
      // Add total time-based adjustment summary if any exist
      if (timeBasedAdjustmentTotal !== 0) {
        const timeBasedSummaryRow = document.createElement('div')
        timeBasedSummaryRow.style.display = 'flex'
        timeBasedSummaryRow.style.justifyContent = 'space-between'
        timeBasedSummaryRow.style.marginBottom = '8px'
        timeBasedSummaryRow.style.marginTop = '6px'
        timeBasedSummaryRow.style.padding = '6px 0'
        timeBasedSummaryRow.style.borderTop = '1px solid #f59e0b'
        timeBasedSummaryRow.style.backgroundColor = '#fffbeb'
        
        const timeBasedSummaryLabel = document.createElement('div')
        timeBasedSummaryLabel.textContent = 'Total Time-based Adjustments'
        timeBasedSummaryLabel.style.fontSize = '12px'
        timeBasedSummaryLabel.style.fontWeight = 'bold'
        timeBasedSummaryLabel.style.color = '#f59e0b'
        
        const timeBasedSummaryValue = document.createElement('div')
        timeBasedSummaryValue.textContent = `${timeBasedAdjustmentTotal > 0 ? '+' : ''}${formatCurrencyValue(timeBasedAdjustmentTotal)}`
        timeBasedSummaryValue.style.fontSize = '12px'
        timeBasedSummaryValue.style.fontWeight = 'bold'
        timeBasedSummaryValue.style.color = timeBasedAdjustmentTotal > 0 ? '#f59e0b' : '#16a34a'
        
        timeBasedSummaryRow.appendChild(timeBasedSummaryLabel)
        timeBasedSummaryRow.appendChild(timeBasedSummaryValue)
        priceDetailsContainer.appendChild(timeBasedSummaryRow)
      }
      
      // Add package discount if available
      if (latestQuotation?.package_discount && latestQuotation.package_discount > 0) {
        const packageDiscountRow = document.createElement('div')
        packageDiscountRow.style.display = 'flex'
        packageDiscountRow.style.justifyContent = 'space-between'
        packageDiscountRow.style.marginBottom = '8px'
        packageDiscountRow.style.color = '#3b82f6'
        packageDiscountRow.style.padding = '3px 0'
        
        const packageDiscountLabel = document.createElement('div')
        packageDiscountLabel.textContent = 'Package Discount'
        packageDiscountLabel.style.fontSize = '13px'
        
        const packageDiscountValue = document.createElement('div')
        packageDiscountValue.textContent = `-${formatCurrencyValue(latestQuotation.package_discount)}`
        packageDiscountValue.style.fontSize = '13px'
        
        packageDiscountRow.appendChild(packageDiscountLabel)
        packageDiscountRow.appendChild(packageDiscountValue)
        priceDetailsContainer.appendChild(packageDiscountRow)
      }
      
      // Add promotion discount if available
      if (latestQuotation?.promotion_discount && latestQuotation.promotion_discount > 0) {
        const promotionDiscountRow = document.createElement('div')
        promotionDiscountRow.style.display = 'flex'
        promotionDiscountRow.style.justifyContent = 'space-between'
        promotionDiscountRow.style.marginBottom = '8px'
        promotionDiscountRow.style.color = '#10b981'
        promotionDiscountRow.style.padding = '3px 0'
        
        const promotionDiscountLabel = document.createElement('div')
        promotionDiscountLabel.textContent = 'Promotion Discount'
        promotionDiscountLabel.style.fontSize = '13px'
        
        const promotionDiscountValue = document.createElement('div')
        promotionDiscountValue.textContent = `-${formatCurrencyValue(latestQuotation.promotion_discount)}`
        promotionDiscountValue.style.fontSize = '13px'
        
        promotionDiscountRow.appendChild(promotionDiscountLabel)
        promotionDiscountRow.appendChild(promotionDiscountValue)
        priceDetailsContainer.appendChild(promotionDiscountRow)
      }
      
      // Calculate discount and tax - include time-based adjustments in the base calculation
      // Get discount info
      const hasDiscount = latestQuotation?.discount_percentage && parseFloat(String(latestQuotation.discount_percentage)) > 0;
      let discountAmount = 0;
      let baseAmountWithTimeAdjustments = calculatedBaseAmount + timeBasedAdjustmentTotal;
      let subtotalAmount = baseAmountWithTimeAdjustments;
      
      if (hasDiscount) {
        const discountPercentage = parseFloat(String(latestQuotation.discount_percentage));
        discountAmount = (baseAmountWithTimeAdjustments * discountPercentage) / 100;
        subtotalAmount = baseAmountWithTimeAdjustments - discountAmount;
        
        // Discount row
        const discountRow = document.createElement('div')
        discountRow.style.display = 'flex'
        discountRow.style.justifyContent = 'space-between'
        discountRow.style.marginBottom = '8px' // Reduced from 10px
        discountRow.style.color = '#e53e3e'
        discountRow.style.padding = '3px 0' // Reduced from 5px
        
        const discountLabel = document.createElement('div')
        discountLabel.textContent = `Discount (${discountPercentage}%)`
        discountLabel.style.fontSize = '13px'
        
        const discountValue = document.createElement('div')
        discountValue.textContent = `-${formatCurrencyValue(discountAmount)}`
        discountValue.style.fontSize = '13px'
        
        discountRow.appendChild(discountLabel)
        discountRow.appendChild(discountValue)
        priceDetailsContainer.appendChild(discountRow)
        
        // Subtotal row with separator
        const subtotalRow = document.createElement('div')
        subtotalRow.style.display = 'flex'
        subtotalRow.style.justifyContent = 'space-between'
        subtotalRow.style.marginBottom = '8px' // Reduced from 10px
        subtotalRow.style.paddingTop = '8px' // Reduced from 10px
        subtotalRow.style.borderTop = '1px solid #e2e8f0'
        subtotalRow.style.padding = '6px 0' // Reduced from 8px
        
        const subtotalLabel = document.createElement('div')
        subtotalLabel.textContent = 'Subtotal'
        subtotalLabel.style.fontSize = '13px'
        subtotalLabel.style.fontWeight = 'medium'
        
        const subtotalValue = document.createElement('div')
        subtotalValue.textContent = formatCurrencyValue(subtotalAmount)
        subtotalValue.style.fontSize = '13px'
        subtotalValue.style.fontWeight = 'medium'
        
        subtotalRow.appendChild(subtotalLabel)
        subtotalRow.appendChild(subtotalValue)
        priceDetailsContainer.appendChild(subtotalRow)
      }
      
      // Get tax info
      const hasTax = latestQuotation?.tax_percentage && parseFloat(String(latestQuotation.tax_percentage)) > 0;
      let taxAmount = 0;
      let totalAmount = subtotalAmount;
      
      if (hasTax) {
        const taxPercentage = parseFloat(String(latestQuotation.tax_percentage));
        taxAmount = (subtotalAmount * taxPercentage) / 100;
        totalAmount = subtotalAmount + taxAmount;
        
        // Tax row
        const taxRow = document.createElement('div')
        taxRow.style.display = 'flex'
        taxRow.style.justifyContent = 'space-between'
        taxRow.style.marginBottom = '8px' // Reduced from 10px
        taxRow.style.color = '#666'
        taxRow.style.padding = '3px 0' // Reduced from 5px
        
        const taxLabel = document.createElement('div')
        taxLabel.textContent = `Tax (${taxPercentage}%)`
        taxLabel.style.fontSize = '13px'
        
        const taxValue = document.createElement('div')
        taxValue.textContent = `+${formatCurrencyValue(taxAmount)}`
        taxValue.style.fontSize = '13px'
        
        taxRow.appendChild(taxLabel)
        taxRow.appendChild(taxValue)
        priceDetailsContainer.appendChild(taxRow)
      }
      
      // Total Amount row with separator (time-based adjustments already included in totalAmount)
      const totalRow = document.createElement('div')
      totalRow.style.display = 'flex'
      totalRow.style.justifyContent = 'space-between'
      totalRow.style.paddingTop = '8px' // Reduced from 10px
      totalRow.style.borderTop = '1px solid #e2e8f0'
      totalRow.style.padding = '6px 0' // Reduced from 8px
      
      const totalLabel = document.createElement('div')
      totalLabel.textContent = 'Total Amount'
      totalLabel.style.fontSize = '13px'
      totalLabel.style.fontWeight = 'bold'
      
      const totalValue = document.createElement('div')
      totalValue.textContent = formatCurrencyValue(totalAmount)
      totalValue.style.fontSize = '13px'
      totalValue.style.fontWeight = 'bold'
      
      totalRow.appendChild(totalLabel)
      totalRow.appendChild(totalValue)
      priceDetailsContainer.appendChild(totalRow)
      
      priceSection.appendChild(priceDetailsContainer)
      pdfContainer.appendChild(priceSection)
      
      // Add a page break after price details
      const pageBreak = document.createElement('div')
      pageBreak.style.pageBreakAfter = 'always'
      pageBreak.style.height = '1px'
      pdfContainer.appendChild(pageBreak)
      
      // Terms and conditions - start on new page
      const termsSection = document.createElement('div')
      termsSection.style.marginBottom = '25px'
      termsSection.style.width = '100%'
      termsSection.style.marginLeft = '0px'
      termsSection.style.maxWidth = '180mm'
      termsSection.style.paddingLeft = '0px'
      termsSection.style.boxSizing = 'border-box'
      termsSection.style.marginTop = '20px' // Match the logo's top margin
      termsSection.style.paddingTop = '0px'
      
      const termsTitle = document.createElement('h3')
      termsTitle.textContent = quotationT.termsAndConditions
      termsTitle.style.margin = '0 0 10px 0'
      termsTitle.style.color = '#333'
      termsTitle.style.fontSize = '14px'
      termsTitle.style.fontWeight = 'bold'
      termsTitle.style.borderBottom = '1px solid #e0e0e0' // Add a subtle line under the title
      termsTitle.style.paddingBottom = '5px' // Space for the line
      
      const termsContent = document.createElement('p')
      termsContent.textContent = quotation?.terms || quotationT.termsContent
      termsContent.style.margin = '0'
      termsContent.style.fontSize = '12px'
      termsContent.style.lineHeight = '1.5'
      termsContent.style.whiteSpace = 'pre-line'
      
      termsSection.appendChild(termsTitle)
      termsSection.appendChild(termsContent)
      pdfContainer.appendChild(termsSection)
      
      // Add footer with thanks
      const footer = document.createElement('div')
      footer.style.borderTop = '1px solid #e2e8f0'
      footer.style.paddingTop = '20px'
      footer.style.paddingBottom = '20px'
      footer.style.textAlign = 'center'
      footer.style.marginTop = 'auto' // Push footer to bottom more effectively if content is short
      footer.style.width = '100%'
      
      const thanksMessage = document.createElement('p')
      thanksMessage.textContent = quotationT.thanksMessage
      thanksMessage.style.margin = '0 0 10px 0'
      thanksMessage.style.fontSize = '14px'
      thanksMessage.style.fontWeight = 'bold'
      thanksMessage.style.color = '#333'
      thanksMessage.style.textAlign = 'center'
      
      const footerText = document.createElement('p')
      footerText.textContent = quotationT.contactMessage
      footerText.style.margin = '0 0 5px 0'
      footerText.style.fontSize = '13px'
      footerText.style.textAlign = 'center'
      
      const companyFooter = document.createElement('p')
      companyFooter.textContent = quotationT.companyFooter
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
          filename: `JPDR-${latestQuotation?.quote_number?.toString().padStart(4, '0') || 'N/A'}-quotation.pdf`,
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
        
        // Dynamic import of html2pdf to avoid SSR issues
        const html2pdf = await import('html2pdf.js').then((module: any) => module.default);
        
        if (!email) {
          // Generate and save PDF directly if not sending email
          const worker = html2pdf()
            .set(pdfOptions)
            .from(pdfContainer);
          
          await worker.save();
          
          toast({
            title: "Success",
            description: "Quotation generated successfully",
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
          description: "PDF generation failed. Please try again.",
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
      console.error('Error during quotation generation setup:', error);
      toast({
        title: "Error", 
        description: "Failed to generate quotation. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }

  const handleGeneratePdf = async () => {
    await generateQuotationPdf(false, language as 'en' | 'ja');
    if (onSuccess) onSuccess();
  }
  
  const handleEmailDialogOpen = () => {
    if (quotation?.customer_email) {
      setEmailAddress(quotation.customer_email);
    }
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
      // Get the latest quotation data from the database first
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest quotation data');
      }
      
      // Get the latest quotation data
      const latestQuotation = await response.json();
      if (!latestQuotation) {
        throw new Error('No quotation data returned from API');
      }
      
      // Create a unique filename with the formatted quotation ID
      const formattedQuotationId = `JPDR-${latestQuotation?.quote_number?.toString().padStart(4, '0') || new Date().getTime()}`
      
      // Send the email via API endpoint
      const formData = new FormData();
      formData.append('email', emailAddress);
      formData.append('quotation_id', latestQuotation.id || '');
      formData.append('include_details', includeDetails.toString());
      formData.append('language', emailLanguage);
      
      // Add items data if available
      if (latestQuotation?.items) {
        if (Array.isArray(latestQuotation.items) && latestQuotation.items.length > 0) {
          formData.append('has_items', 'true');
          formData.append('items_data', JSON.stringify(latestQuotation.items));
        } else if (typeof latestQuotation.items === 'string') {
          try {
            // Try to parse items if stored as JSON string
            const parsedItems = JSON.parse(latestQuotation.items);
            if (Array.isArray(parsedItems) && parsedItems.length > 0) {
              formData.append('has_items', 'true');
              formData.append('items_data', latestQuotation.items);
            }
          } catch (e) {
            console.error('Failed to parse items data:', e);
          }
        }
      }
      
      try {
        const response = await fetch('/api/quotations/send-email', {
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
          description: `Quotation sent to ${emailAddress}`,
          variant: "default"
        });
        setEmailDialogOpen(false);
        if (onSuccess) onSuccess();
      } catch (apiError) {
        console.error('API call error:', apiError);
        toast({
          title: "Error",
          description: `Email service currently unavailable. Please try again later.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in email sending process:', error);
      toast({
        title: "Error",
        description: "Failed to prepare quotation for email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <Button 
        variant="outline"
        size="sm"
        className="mr-2"
        onClick={handleGeneratePdf}
        disabled={isGenerating || !quotation}
      >
        <FileText className="h-4 w-4 mr-1" />
        {isGenerating ? 
          (t('common.exporting') || 'Generating...') : 
          (t('quotations.actions.download') || 'Download PDF')
        }
      </Button>
      
      <Button 
        variant="outline"
        size="sm"
        onClick={handleEmailDialogOpen}
        disabled={isGenerating || !quotation}
      >
        <Mail className="h-4 w-4 mr-1" />
        {t('quotations.actions.email') || 'Email Quotation'}
      </Button>
      
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('quotations.actions.email') || 'Email Quotation'}</DialogTitle>
            <DialogDescription>
              {t('quotations.emailDescription') || 'Send the quotation as a PDF attachment to the customer\'s email address.'}
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
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(checked === true)}
                />
                <label
                  htmlFor="include-details"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('quotations.includeDetails') || 'Include quotation details'}
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