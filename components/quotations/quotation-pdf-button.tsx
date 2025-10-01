"use client"

import { FileText, Mail } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useState } from 'react'
// Dynamic import for html2pdf to avoid SSR issues
import { toast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import LoadingModal from '@/components/ui/loading-modal'
import { useProgressSteps } from '@/lib/hooks/useProgressSteps'
// Removed countdown toast imports
import { progressConfigs } from '@/lib/config/progressConfigs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

// Remove server-side import that includes Puppeteer
// import { generateQuotationHtml } from '@/lib/html-pdf-generator'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { PricingPackage, PricingPromotion, Quotation, QuotationItem } from '@/types/quotations'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { safeEncodeText } from '@/lib/utils/character-encoding';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';

// Client-side HTML generator (simplified version without Puppeteer dependencies)
function generateClientQuotationHtml(
  quotation: any, 
  language: 'en' | 'ja' = 'en',
  selectedPackage: PricingPackage | null = null,
  selectedPromotion: PricingPromotion | null = null
): string {
  const quotationTranslations = {
    en: {
      quotation: 'QUOTATION',
      quotationNumber: 'Quotation #:',
      quotationDate: 'Quotation Date:',
      total: 'TOTAL:',
      companyName: 'Driver (Thailand) Company Limited'
    },
    ja: {
      quotation: '見積書',
      quotationNumber: '見積書番号:',
      quotationDate: '見積書発行日:',
      total: '合計:',
      companyName: 'Driver (Thailand) Company Limited'
    }
  };

  const t = quotationTranslations[language];
  
  const creationDate = quotation?.created_at ? new Date(quotation.created_at) : new Date();
  const quotationDate = formatDateDDMMYYYY(creationDate);
  const formattedQuotationId = `QUO-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  
  const formatCurrency = (value: number): string => {
    const currency = quotation?.display_currency || quotation?.currency || 'JPY';
    if (!value) return currency === 'JPY' ? `¥0` : `${currency} 0`;
    
    if (currency === 'JPY') {
      return `¥${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  // Calculate total
  let total = 0;
  if (quotation.quotation_items && quotation.quotation_items.length > 0) {
    total = quotation.quotation_items.reduce((sum: number, item: QuotationItem) => {
      return sum + (item.total_price || item.unit_price || 0);
    }, 0);
  } else {
    total = quotation.amount || 0;
  }

  return `
    <div style="font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; color: #333; padding: 20px;">
      <div style="border-top: 2px solid #FF2600; margin-bottom: 20px;"></div>
      
      <h1 style="color: #333; margin: 0 0 15px 0; font-size: 24px; font-weight: bold;">
        ${t.quotation}
      </h1>
      
      <p style="margin: 0 0 5px 0; font-size: 13px;">
        ${t.quotationNumber} ${formattedQuotationId}
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px;">
        ${t.quotationDate} ${quotationDate}
      </p>
      
      <div style="margin: 30px 0;">
        <h3 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">
          Customer Information
        </h3>
        <p style="margin: 5px 0;">${safeEncodeText(quotation?.customer_name)}</p>
        <p style="margin: 5px 0;">${safeEncodeText(quotation?.customer_email)}</p>
      </div>
      
      <div style="margin: 30px 0;">
        <h3 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">
          Service Details
        </h3>
        ${quotation.quotation_items && quotation.quotation_items.length > 0 ? 
          quotation.quotation_items.map((item: QuotationItem) => `
            <div style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-weight: 500;">${item.description || `${item.service_type_name} - ${item.vehicle_type}`}</div>
              <div style="text-align: right; font-weight: bold;">${formatCurrency(item.total_price || item.unit_price || 0)}</div>
            </div>
          `).join('') 
          :
          `<div style="margin: 10px 0;">
            <p>Service: ${quotation?.service_type || 'Transportation Service'}</p>
            <p>Vehicle: ${quotation?.vehicle_type || 'Standard Vehicle'}</p>
          </div>`
        }
      </div>
      
      <div style="margin: 30px 0; border-top: 2px solid #333; padding-top: 15px;">
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
          <span>${t.total}</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
      
      <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
        <p>${t.companyName}</p>
        <p>www.japandriver.com</p>
      </div>
    </div>
  `;
}

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
  quotation?: Quotation & { quotation_items: QuotationItem[], customers?: any };
  selectedPackage?: PricingPackage | null;
  selectedPromotion?: PricingPromotion | null;
  onSuccess?: () => void;
}

export function QuotationPdfButton({ quotation, selectedPackage, selectedPromotion, onSuccess }: QuotationPdfButtonProps) {
  const { t, language } = useI18n()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [emailLanguage, setEmailLanguage] = useState<'en' | 'ja'>(language as 'en' | 'ja')
  const [targetEmail, setTargetEmail] = useState(quotation?.customer_email || '')
  const [bccEmails, setBccEmails] = useState<string>("booking@japandriver.com")
  const [includeDetails, setIncludeDetails] = useState(true)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const { progressValue, progressLabel, progressSteps, startProgress, resetProgress } = useProgressSteps()
  
  // Removed countdown toast
  const [progressOpen, setProgressOpen] = useState(false)
  const [progressVariant, setProgressVariant] = useState<'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice'>('default')
  
  const formatCurrency = (amount: number, currency: string = 'JPY') => {
    // Use the quotation's display_currency if available, otherwise default to JPY
    const currencyToUse = quotation?.display_currency || quotation?.currency || currency;
    if (!amount) return currencyToUse === 'JPY' ? `¥0` : `${currencyToUse} 0`;
    return currencyToUse === 'JPY' 
      ? `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `${currencyToUse} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };



  const handleGeneratePdf = async () => {
    if (!quotation) return;
    setIsGenerating(true);
    setProgressOpen(true);
    setProgressVariant('default');
    
    try {
      // Start progress animation
      const progressPromise = startProgress({
        steps: [
          { value: 10, label: 'Preparing...' },
          { value: 35, label: 'Rendering...' },
          { value: 70, label: 'Generating PDF...' },
          { value: 90, label: 'Downloading...' }
        ],
        totalDuration: 3000,
        stepDelays: [200, 800, 600, 300]
      });

      // Start API call in parallel
      const apiPromise = fetch('/api/quotations/generate-quotation-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation.id,
          language: language as 'en' | 'ja',
          package_id: selectedPackage?.id,
          promotion_code: selectedPromotion?.code
        })
      });

      // Wait for both to complete
      const [_, response] = await Promise.all([progressPromise, apiPromise]);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const formattedQuotationId = `QUO-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${formattedQuotationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Close modal after successful download
      setTimeout(() => setProgressOpen(false), 200);

    } catch (error) {
      console.error("Error generating PDF for download:", error);
      setProgressOpen(false);
      toast({ title: "PDF Generation Failed", description: "An unexpected error occurred while generating the PDF.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleEmailDialogOpen = () => {
    if (quotation?.customer_email) {
      setTargetEmail(quotation.customer_email);
    }
    setEmailLanguage(language as 'en' | 'ja');
    setIsEmailDialogOpen(true);
  }
  
  const handleSendEmail = async () => {
    if (!targetEmail || !targetEmail.includes('@') || !quotation) {
      toast({
        title: "Invalid Email",
        description: "Please provide a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsEmailing(true)
    
    try {
      // Start API call first
      const formData = new FormData();
      formData.append('email', targetEmail);
      formData.append('quotation_id', quotation.id);
      formData.append('language', emailLanguage);
      formData.append('bcc_emails', bccEmails);
      
      const apiPromise = fetch('/api/quotations/send-email-unified', {
        method: 'POST',
        body: formData,
      });

      // Start progress modal and animation AFTER API call starts
      setProgressOpen(true)
      setProgressVariant('email')

      // Start progress animation with API promise
      const progressPromise = startProgress(progressConfigs.sendEmail, apiPromise);

      // Wait for both to complete
      const [_, response] = await Promise.all([progressPromise, apiPromise]);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      // Show success toast instead of countdown
      toast({
        title: 'Quotation Sent',
        description: 'Quotation has been sent successfully',
        variant: 'default',
      });
      
      setTimeout(() => setProgressOpen(false), 200)
      setIsEmailDialogOpen(false);
      if (onSuccess) onSuccess();
    } catch (apiError) {
      console.error('Error sending quotation email:', apiError);
      setProgressOpen(false)
      toast({ title: 'Error Sending Email', description: (apiError as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsEmailing(false);
    }
  }

  return (
    <>
      <Button 
        onClick={handleGeneratePdf} 
        disabled={isGenerating} 
        variant="outline"
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        {isGenerating ? (t('quotations.actions.generating') || 'Generating...') : (t('quotations.actions.downloadQuotation') || 'Download Quotation')}
      </Button>
      
      <Button onClick={handleEmailDialogOpen} className="gap-2">
        <Mail className="h-4 w-4" />
        {t('quotations.actions.emailQuote') || 'Email Quote'}
      </Button>
      
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Quotation by Email
            </DialogTitle>
            <DialogDescription>
              Send this quotation to the customer via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Customer Email</Label>
              <Input
                id="email"
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="customer@example.com"
                className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email will be sent to the customer's registered email address
              </p>
            </div>
            
            <div>
              <Label htmlFor="bcc-emails">BCC Emails</Label>
              <Input
                id="bcc-emails"
                value={bccEmails}
                onChange={(e) => setBccEmails(e.target.value)}
                placeholder="Enter email addresses separated by commas"
                className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: booking@japandriver.com. Add more emails separated by commas.
              </p>
            </div>
            
            <div>
              <Label>Language</Label>
              <Select value={emailLanguage} onValueChange={(value: 'en' | 'ja') => setEmailLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                📧 What's included in the email:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Complete quotation details and service information</li>
                <li>• Customer information and contact details</li>
                <li>• Service breakdown and pricing</li>
                <li>• Quotation PDF attachment</li>
                <li>• Magic link for customer access</li>
                <li>• Company branding and contact information</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isEmailing || !targetEmail}
            >
              {isEmailing ? (t('common.sending') || 'Sending...') : (t('common.send') || 'Send Email')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <LoadingModal
        open={progressOpen}
        onOpenChange={setProgressOpen}
        variant={progressVariant}
        value={progressValue}
        label={progressLabel}
        steps={progressSteps}
        title="Generating Quotation PDF"
      />

      {/* Countdown Toast for Redirection */}
      {/* Countdown toast removed */}
    </>
  )
} 