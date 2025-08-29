"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Loader2, FileText, CreditCard } from "lucide-react";
import { Quotation, QuotationItem } from "@/types/quotations";
// Dynamic import for html2pdf to avoid SSR issues

interface QuotationInvoiceButtonProps {
  quotation: Quotation & { quotation_items?: QuotationItem[] };
  onSuccess?: () => void;
  onSendPaymentLink?: () => void; // Add callback to trigger workflow dialog
}

export function QuotationInvoiceButton({ quotation, onSuccess, onSendPaymentLink }: QuotationInvoiceButtonProps) {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingPaymentLink, setIsSendingPaymentLink] = useState(false);

  
  // Check if user is admin (japandriver email)
  const isAdmin = user?.email?.endsWith('@japandriver.com') || false;

  // Progress modal state (align with quotation-details)
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressTitle, setProgressTitle] = useState('Processing');
  const [progressLabel, setProgressLabel] = useState('Starting...');

  // Generate invoice using same HTML-to-PDF design as bookings
  const generateInvoice = async (email: boolean = false, invoiceLanguage: 'en' | 'ja' = 'en'): Promise<Blob | null> => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        toast({ title: 'Error', description: 'Invoice generation is only available in browser environment', variant: 'destructive' });
        return null;
      }

      const container = document.createElement('div');
      container.style.fontFamily = 'Work Sans, sans-serif';
      container.style.backgroundColor = '#fff';
      container.style.color = '#111827';
      container.style.width = '180mm';
      container.style.margin = '0 auto';
      container.style.padding = '10px 0 0';
      container.style.borderTop = '2px solid #FF2600';

      // Header logo
      const logoWrap = document.createElement('div');
      logoWrap.style.textAlign = 'left';
      logoWrap.style.margin = '30px 0 30px';
      const logo = document.createElement('img');
      logo.src = '/img/driver-header-logo.png';
      logo.alt = 'Driver Logo';
      logo.style.height = '50px';
      logoWrap.appendChild(logo);
      container.appendChild(logoWrap);

      // Title and company/customer sections similar to booking
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '40px';

      const left = document.createElement('div');
      const h1 = document.createElement('h1');
      h1.textContent = invoiceLanguage === 'ja' ? '請求書' : 'INVOICE';
      h1.style.margin = '0 0 15px 0';
      h1.style.fontSize = '24px';
      h1.style.fontWeight = 'bold';
      h1.style.color = '#111827';
      const num = document.createElement('p');
      num.textContent = `${invoiceLanguage === 'ja' ? '請求書番号:' : 'Invoice #:'} INV-JPDR-${String(quotation.quote_number || 0).padStart(6, '0')}`;
      num.style.margin = '0 0 5px 0';
      num.style.color = '#111827';
      num.style.fontSize = '14px';
      const date = document.createElement('p');
      date.textContent = `${invoiceLanguage === 'ja' ? '請求書発行日:' : 'Invoice Date:'} ${new Date().toLocaleDateString(invoiceLanguage === 'ja' ? 'ja-JP' : 'en-US')}`;
      date.style.margin = '0 0 5px 0';
      date.style.color = '#111827';
      date.style.fontSize = '14px';
      const ref = document.createElement('p');
      ref.textContent = `${invoiceLanguage === 'ja' ? '見積参照:' : 'Quotation Ref:'} QUO-JPDR-${String(quotation.quote_number || 0).padStart(6, '0')}`;
      ref.style.margin = '0';
      ref.style.color = '#111827';
      ref.style.fontSize = '14px';
      left.appendChild(h1); left.appendChild(num); left.appendChild(date); left.appendChild(ref);

      const right = document.createElement('div');
      right.style.textAlign = 'right';
      const cName = document.createElement('h2'); cName.textContent = 'Driver (Thailand) Company Limited'; cName.style.margin = '0 0 5px 0'; cName.style.fontSize = '16px'; cName.style.color = '#111827';
      const a1 = document.createElement('p'); a1.textContent = '580/17 Soi Ramkhamhaeng 39'; a1.style.margin = '0 0 2px 0'; a1.style.color = '#111827'; a1.style.fontSize = '13px';
      const a2 = document.createElement('p'); a2.textContent = 'Wang Thong Lang'; a2.style.margin = '0 0 2px 0'; a2.style.color = '#111827'; a2.style.fontSize = '13px';
      const a3 = document.createElement('p'); a3.textContent = 'Bangkok 10310'; a3.style.margin = '0 0 2px 0'; a3.style.color = '#111827'; a3.style.fontSize = '13px';
      const a4 = document.createElement('p'); a4.textContent = 'Thailand'; a4.style.margin = '0 0 10px 0'; a4.style.color = '#111827'; a4.style.fontSize = '13px';
      const tax = document.createElement('p'); tax.textContent = 'Tax ID: 0105566135845'; tax.style.margin = '0 0 10px 0'; tax.style.color = '#111827'; tax.style.fontSize = '13px';
      right.appendChild(cName); right.appendChild(a1); right.appendChild(a2); right.appendChild(a3); right.appendChild(a4); right.appendChild(tax);

      header.appendChild(left); header.appendChild(right); container.appendChild(header);

      // Billing info
      const bill = document.createElement('div');
      const billTitle = document.createElement('h3'); billTitle.textContent = invoiceLanguage === 'ja' ? '請求先住所:' : 'BILLING ADDRESS:'; billTitle.style.margin = '0 0 8px 0'; billTitle.style.fontSize = '14px'; billTitle.style.fontWeight = 'bold'; billTitle.style.color = '#111827';
      const custName = document.createElement('p'); custName.textContent = quotation.customer_name || quotation.customers?.name || (invoiceLanguage === 'ja' ? 'お客様' : 'N/A'); custName.style.margin = '0 0 3px 0'; custName.style.fontWeight = 'bold'; custName.style.color = '#111827'; custName.style.fontSize = '14px';
      const custEmail = document.createElement('p'); custEmail.textContent = quotation.customer_email || quotation.customers?.email || (invoiceLanguage === 'ja' ? '記載なし' : 'N/A'); custEmail.style.margin = '0 0 3px 0'; custEmail.style.color = '#111827'; custEmail.style.fontSize = '14px';
      const custPhone = document.createElement('p'); custPhone.textContent = quotation.customer_phone ? `${invoiceLanguage === 'ja' ? '電話:' : 'Phone:'} ${quotation.customer_phone}` : ''; custPhone.style.margin = '0 0 3px 0'; custPhone.style.color = '#111827'; custPhone.style.fontSize = '14px';
      const company = document.createElement('p'); company.textContent = quotation.billing_company_name ? `${invoiceLanguage === 'ja' ? '会社名:' : 'Company:'} ${quotation.billing_company_name}` : ''; company.style.margin = '0 0 3px 0'; company.style.color = '#111827'; company.style.fontSize = '14px';
      const taxId = document.createElement('p'); taxId.textContent = quotation.billing_tax_number ? `${invoiceLanguage === 'ja' ? '税番号:' : 'Tax ID:'} ${quotation.billing_tax_number}` : ''; taxId.style.margin = '0 0 3px 0'; taxId.style.color = '#111827'; taxId.style.fontSize = '14px';
      const addressParts = [
        quotation.billing_street_number,
        quotation.billing_street_name,
        quotation.billing_city,
        quotation.billing_state,
        quotation.billing_postal_code,
        quotation.billing_country
      ].filter(Boolean).join(', ');
      const address = document.createElement('p'); address.textContent = addressParts; address.style.margin = '0 0 3px 0'; address.style.color = '#111827'; address.style.fontSize = '14px';
      bill.appendChild(billTitle); bill.appendChild(custName); bill.appendChild(custEmail);
      if (custPhone.textContent) bill.appendChild(custPhone);
      if (company.textContent) bill.appendChild(company);
      if (taxId.textContent) bill.appendChild(taxId);
      if (address.textContent) bill.appendChild(address);
      container.appendChild(bill);

      // Services table
      const tableWrap = document.createElement('div'); tableWrap.style.marginBottom = '25px';
      const tableTitle = document.createElement('h3'); tableTitle.textContent = invoiceLanguage === 'ja' ? 'サービス詳細:' : 'SERVICE DETAILS:'; tableTitle.style.margin = '0 0 10px 0'; tableTitle.style.fontSize = '14px'; tableTitle.style.fontWeight = 'bold'; tableTitle.style.color = '#111827';
      const table = document.createElement('table'); table.style.width = '100%'; table.style.borderCollapse = 'collapse'; table.style.color = '#111827';
      const thead = document.createElement('thead'); thead.style.backgroundColor = '#f3f3f3';
      const trh = document.createElement('tr');
      const headers = [invoiceLanguage === 'ja' ? 'サービス内容' : 'Service Description', invoiceLanguage === 'ja' ? '日付' : 'Date', invoiceLanguage === 'ja' ? '数量' : 'Quantity', invoiceLanguage === 'ja' ? '価格' : 'Price'];
      const widths = ['45%', '15%', '15%', '25%'];
      headers.forEach((h, i) => { const th = document.createElement('th'); th.textContent = h; th.style.padding = '10px'; th.style.textAlign = i > 1 ? 'right' : 'left'; th.style.borderBottom = '1px solid #e2e8f0'; th.style.fontSize = '13px'; th.style.fontWeight = 'bold'; th.style.width = widths[i]; th.style.color = '#111827'; trh.appendChild(th); });
      thead.appendChild(trh); table.appendChild(thead);
      const tbody = document.createElement('tbody');
      const items = (quotation.quotation_items && quotation.quotation_items.length > 0) ? quotation.quotation_items : [{ description: quotation.title, quantity: 1, unit_price: quotation.total_amount || quotation.amount, total_price: quotation.total_amount || quotation.amount, pickup_date: quotation.pickup_date } as any];
      const currency = quotation.display_currency || quotation.currency || 'JPY';
      items.forEach((item: any) => {
        const tr = document.createElement('tr');
        const td1 = document.createElement('td'); td1.textContent = item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Vehicle'}`; td1.style.padding = '10px'; td1.style.borderBottom = '1px solid #e2e8f0'; td1.style.fontSize = '13px'; td1.style.color = '#111827';
        const td2 = document.createElement('td'); td2.textContent = item.pickup_date || quotation.pickup_date || 'N/A'; td2.style.padding = '10px'; td2.style.borderBottom = '1px solid #e2e8f0'; td2.style.fontSize = '13px'; td2.style.color = '#111827';
        const td3 = document.createElement('td'); td3.textContent = String(item.quantity || 1); td3.style.padding = '10px'; td3.style.textAlign = 'right'; td3.style.borderBottom = '1px solid #e2e8f0'; td3.style.fontSize = '13px'; td3.style.color = '#111827';
        const td4 = document.createElement('td'); td4.textContent = currency === 'JPY' ? `¥${(item.total_price || item.unit_price || 0).toLocaleString()}` : `${currency} ${(item.total_price || item.unit_price || 0).toLocaleString()}`; td4.style.padding = '10px'; td4.style.textAlign = 'right'; td4.style.borderBottom = '1px solid #e2e8f0'; td4.style.fontSize = '13px'; td4.style.color = '#111827';
        tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tr.appendChild(td4); tbody.appendChild(tr);
      });
      table.appendChild(tbody); tableWrap.appendChild(tableTitle); tableWrap.appendChild(table); container.appendChild(tableWrap);

      // Totals
      const totals = document.createElement('div'); totals.style.display = 'flex'; totals.style.justifyContent = 'flex-end'; totals.style.marginBottom = '35px';
      const t = document.createElement('table'); t.style.width = '250px'; t.style.borderCollapse = 'collapse';
      const subtotalRow = document.createElement('tr');
      const sl = document.createElement('td'); sl.textContent = invoiceLanguage === 'ja' ? '小計:' : 'Subtotal:'; sl.style.padding = '5px 15px 5px 0'; sl.style.textAlign = 'right'; sl.style.fontSize = '13px'; sl.style.color = '#111827';
      const sum = items.reduce((acc: number, it: any) => acc + (it.total_price || it.unit_price || 0), 0);
      const sa = document.createElement('td'); sa.textContent = currency === 'JPY' ? `¥${sum.toLocaleString()}` : `${currency} ${sum.toLocaleString()}`; sa.style.padding = '5px 0'; sa.style.textAlign = 'right'; sa.style.fontSize = '13px'; sa.style.color = '#111827';
      subtotalRow.appendChild(sl); subtotalRow.appendChild(sa); t.appendChild(subtotalRow);
      const totalRow = document.createElement('tr'); totalRow.style.backgroundColor = '#f3f3f3';
      const tl = document.createElement('td'); tl.textContent = invoiceLanguage === 'ja' ? '合計:' : 'TOTAL:'; tl.style.padding = '8px 15px 8px 0'; tl.style.textAlign = 'right'; tl.style.fontWeight = 'bold'; tl.style.fontSize = '14px'; tl.style.color = '#111827';
      const ta = document.createElement('td'); const totalVal = quotation.total_amount || sum || quotation.amount; ta.textContent = currency === 'JPY' ? `¥${totalVal.toLocaleString()}` : `${currency} ${totalVal.toLocaleString()}`; ta.style.padding = '8px 0'; ta.style.textAlign = 'right'; ta.style.fontWeight = 'bold'; ta.style.fontSize = '14px'; ta.style.color = '#111827';
      totalRow.appendChild(tl); totalRow.appendChild(ta); t.appendChild(totalRow);
      totals.appendChild(t); container.appendChild(totals);

      // Footer
      const foot = document.createElement('div'); foot.style.borderTop = '1px solid #e2e8f0'; foot.style.paddingTop = '20px'; foot.style.textAlign = 'center'; foot.style.marginBottom = '30px';
      const msg = document.createElement('p'); msg.textContent = invoiceLanguage === 'ja' ? 'ご利用いただきありがとうございます。' : 'Thank you for your business!'; msg.style.margin = '0 0 10px 0'; msg.style.fontSize = '14px'; msg.style.fontWeight = 'bold'; msg.style.color = '#111827';
      const note = document.createElement('p'); note.textContent = invoiceLanguage === 'ja' ? 'この請求書に関するお問い合わせは billing@japandriver.com までご連絡ください。' : 'If you have any questions about this invoice, please contact us at billing@japandriver.com'; note.style.margin = '0 0 5px 0'; note.style.fontSize = '13px'; note.style.color = '#111827';
      const cf = document.createElement('p'); cf.textContent = 'Driver (Thailand) Company Limited • www.japandriver.com'; cf.style.margin = '10px 0 0 0'; cf.style.fontSize = '13px'; cf.style.color = '#666';
      foot.appendChild(msg); foot.appendChild(note); foot.appendChild(cf); container.appendChild(foot);

      document.body.appendChild(container);
      let pdfBlob: Blob | null = null;
      try {
        await new Promise(res => { if (logo.complete) res(null); else { logo.onload = () => res(null); logo.onerror = () => res(null); } });
        await new Promise(res => setTimeout(res, 300));
        const pdfName = `INV-JPDR-${String(quotation.quote_number || 0).padStart(6, '0')}.pdf`;
        const options: any = { 
          margin: [15, 15, 40, 15], 
          filename: pdfName, 
          image: { type: 'jpeg', quality: 1.0 }, 
          html2canvas: { 
            scale: 4, 
            backgroundColor: '#ffffff', 
            useCORS: true, 
            letterRendering: true, 
            allowTaint: false,
            windowWidth: 1200,
            windowHeight: 1800
          }, 
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }, 
          pagebreak: { mode: ['css', 'legacy'] } 
        };
        // Dynamic import to avoid SSR issues
        const html2pdf = (await import('html2pdf.js')).default;
        
        if (!email) {
          const worker = html2pdf().set(options).from(container); 
          await worker.save();
          toast({ title: 'Success', description: 'Invoice generated successfully' });
        } else {
          pdfBlob = await html2pdf().set({ ...options, filename: undefined }).from(container).outputPdf('blob');
        }
      } finally {
        if (document.body.contains(container)) document.body.removeChild(container);
      }
      return pdfBlob;
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({ title: 'Error', description: 'Failed to generate invoice. Please try again.', variant: 'destructive' });
      return null;
    }
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setProgressOpen(true);
    setProgressTitle('Generating Invoice PDF');
    setProgressLabel('Preparing...');
    setProgressValue(10);

    try {
      setProgressLabel('Generating PDF...');
      setProgressValue(50);
      
      // Use server-side PDF generation with proper discount calculations
      const response = await fetch('/api/quotations/generate-invoice-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_id: quotation.id,
          language: language as 'en' | 'ja'
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      setProgressLabel('Downloading...');
      setProgressValue(80);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `INV-JPDR-${String(quotation.quote_number || 0).padStart(6, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgressValue(100);
      setProgressLabel('Completed');
      setTimeout(() => setProgressOpen(false), 400);
      onSuccess?.();
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setProgressOpen(false);
      toast({ title: "Error", description: "Failed to download invoice. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };







  return (
    <>
      <Button 
        onClick={handleGeneratePdf} 
        disabled={isGenerating} 
        variant="outline"
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        {isGenerating ? (t('invoices.actions.generating') || 'Generating...') : (t('invoices.actions.downloadPdf') || 'Download Invoice')}
      </Button>
      
      {/* Only show Send Payment Link for non-final statuses */}
      {!['paid', 'converted'].includes(quotation.status) && isAdmin && (
        <Button 
          onClick={() => onSendPaymentLink?.()} 
          disabled={isSendingPaymentLink}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <CreditCard className="h-4 w-4" />
          {isSendingPaymentLink ? 'Sending...' : 'Send Payment Link'}
        </Button>
      )}
      




      {/* Progress Modal */}
      <Dialog open={progressOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{progressTitle}</DialogTitle>
            <DialogDescription className="sr-only">Processing</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Progress value={progressValue} />
            <div className="text-sm text-muted-foreground flex items-center justify-between">
              <span>{progressLabel}</span>
              <span className="font-medium text-foreground">{progressValue}%</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
