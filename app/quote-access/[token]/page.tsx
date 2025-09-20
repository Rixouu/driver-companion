"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Clock, 
  Car, 
  Package,
  Calculator,
  Download,
  Share2,
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Timer,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  StickyNote
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils/formatting';
import { addDays } from 'date-fns';
import { QuotationDetailsApprovalPanel } from '@/components/quotations/quotation-details/approval-panel';
import { QuotationShareButtons } from '@/components/quotations/quotation-share-buttons';
import { toast } from 'sonner';

interface QuotationData {
  id: string;
  title: string;
  quote_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  billing_company_name?: string;
  billing_tax_number?: string;
  created_at: string;
  status: string;
  amount: number;
  total_amount: number;
  currency: string;
  last_sent_at?: string;
  approved_at?: string;
  payment_completed_at?: string;
  payment_link_sent_at?: string;
  selected_promotion_name?: string;
  promotion_discount?: number;
  quotation_items: Array<{
    id: string;
    service_type_name: string;
  vehicle_type?: string;
  pickup_date?: string;
  pickup_time?: string;
  duration_hours?: number;
  service_days?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  time_based_adjustment?: string;
  }>;
  customer_notes?: string;
  merchant_notes?: string;
}

export default function QuoteAccessPage() {
  const params = useParams();
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('JPY');
  const [isDownloadingQuotation, setIsDownloadingQuotation] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const formatCurrencyWithCurrency = (amount: number, currency = selectedCurrency) => {
    // Simple currency conversion rates (in production, these should come from an API)
    const conversionRates: { [key: string]: number } = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.24,
      'CNY': 0.048,
      'SGD': 0.0091
    };

    const convertedAmount = amount * (conversionRates[currency] || 1);
    const currencySymbols: { [key: string]: string } = {
      'JPY': '¥',
      'USD': '$',
      'EUR': '€',
      'THB': '฿',
      'CNY': '¥',
      'SGD': '$'
    };
    
    return `${currencySymbols[currency] || '¥'}${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      sent: { variant: 'default' as const, label: 'Sent' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
      converted: { variant: 'default' as const, label: 'Converted' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDownloadQuotation = async () => {
    if (!quotation) return;
    
    setIsDownloadingQuotation(true);
    try {
      const response = await fetch(`/api/quotations/generate-pdf-magic-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({ token: params?.token }),
        });

        if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Quotation downloaded successfully!');
      } catch (error) {
      console.error('Error downloading quotation:', error);
      toast.error(`Failed to download quotation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
      setIsDownloadingQuotation(false);
    }
  };


  const handleApprove = async (notes: string, signature: string, bccEmails: string) => {
    if (!quotation) return;
    
    setIsApproving(true);
    try {
      const response = await fetch('/api/quotations/approve-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: quotation.id,
          notes: notes,
          signature: signature
        }),
      });
      
      if (response.ok) {
        toast.success('Quotation approved successfully!');
        // Refresh the page or update state
          window.location.reload();
      } else {
        throw new Error('Failed to approve quotation');
      }
    } catch (error) {
      console.error('Error approving quotation:', error);
      toast.error('Failed to approve quotation. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async (reason: string, signature: string, bccEmails: string) => {
    if (!quotation) return;
    
    setIsRejecting(true);
    try {
      const response = await fetch('/api/quotations/reject-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: quotation.id,
          reason: reason,
          signature: signature
        }),
      });
      
      if (response.ok) {
        toast.success('Quotation rejected successfully!');
        // Refresh the page or update state
          window.location.reload();
      } else {
        throw new Error('Failed to reject quotation');
      }
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      toast.error('Failed to reject quotation. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };
  
  useEffect(() => {
    const fetchQuotation = async () => {
      if (!params?.token) return;
      
      try {
        const response = await fetch('/api/quotations/validate-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({ token: params.token }),
        });

        if (!response.ok) {
          throw new Error('Invalid or expired magic link');
        }

        const data = await response.json();
        setQuotation(data.quotation);
    } catch (error) {
        console.error('Error fetching quotation:', error);
        setError(error instanceof Error ? error.message : 'Failed to load quotation');
    } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [params?.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error || 'Quotation not found'}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
           {/* Header with logo, title, and status */}
           <div className="space-y-4 sm:space-y-0 sm:flex sm:items-start sm:gap-4 mb-6">
             {/* Mobile: 2x2 Grid Layout */}
             <div className="sm:hidden space-y-4">
               {/* Row 1: Logo + Title */}
               <div className="flex items-center gap-3">
                 <img 
                   src="/img/driver-quotation-logo.png" 
                   alt="Driver Logo" 
                   className="h-10 w-10 object-contain flex-shrink-0"
                 />
                 <h1 className="text-lg font-bold text-foreground flex-1 leading-tight">
                   {quotation.title || 'Untitled Quotation'}
                 </h1>
               </div>
               
               {/* Row 2: Quote Info Grid */}
               <div className="grid grid-cols-2 gap-3">
                 {/* Top Left: Quote Number */}
                 <div className="bg-muted/20 rounded-lg p-3">
                   <div className="text-xs text-muted-foreground mb-1">Quote Number</div>
                   <div className="text-sm font-semibold text-foreground">
                     #{quotation.quote_number?.toString().padStart(6, '0')}
                   </div>
                 </div>
                 
                 {/* Top Right: Status */}
                 <div className="bg-muted/20 rounded-lg p-3">
                   <div className="text-xs text-muted-foreground mb-1">Status</div>
                   <div className={`text-sm font-semibold ${
                     quotation.status === 'sent' ? 'text-green-600 dark:text-green-400' :
                     quotation.status === 'approved' ? 'text-blue-600 dark:text-blue-400' :
                     quotation.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                     quotation.status === 'converted' ? 'text-purple-600 dark:text-purple-400' :
                     'text-gray-600 dark:text-gray-400'
                   }`}>
                     {quotation.status === 'sent' ? 'Sent' : 
                      quotation.status === 'approved' ? 'Approved' : 
                      quotation.status === 'rejected' ? 'Rejected' : 
                      quotation.status === 'converted' ? 'Converted' : 'Draft'}
                   </div>
                 </div>
                 
                 {/* Bottom Left: Customer */}
                 <div className="bg-muted/20 rounded-lg p-3">
                   <div className="text-xs text-muted-foreground mb-1">Customer</div>
                   <div className="text-sm font-medium text-foreground truncate">
                     {quotation.customer_name}
                   </div>
                 </div>
                 
                 {/* Bottom Right: Valid Until */}
                 <div className="bg-muted/20 rounded-lg p-3">
                   <div className="text-xs text-muted-foreground mb-1">Valid Until</div>
                   <div className="text-sm font-medium text-foreground">
                     {addDays(new Date(quotation.created_at), 7).toLocaleDateString()}
                   </div>
                 </div>
               </div>
               
               {/* Created Date - Full Width */}
               <div className="bg-muted/20 rounded-lg p-3">
                 <div className="text-xs text-muted-foreground mb-1">Created</div>
                 <div className="text-sm font-medium text-foreground">
                   {new Date(quotation.created_at).toLocaleDateString('en-US', {
                     weekday: 'long',
                     year: 'numeric',
                     month: 'long',
                     day: 'numeric'
                   })}
                 </div>
               </div>
             </div>
             
             {/* Desktop: Original Layout */}
             <div className="hidden sm:flex sm:items-start gap-4">
               <img 
                 src="/img/driver-quotation-logo.png" 
                 alt="Driver Logo" 
                 className="h-10 w-auto object-contain flex-shrink-0"
               />
               <div className="flex-1 min-w-0">
                 <h1 className="text-2xl lg:text-3xl font-bold mb-3 break-words">
                   {quotation.title || 'Untitled Quotation'}
                 </h1>
                 <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                   <span className="font-medium">Quote #{quotation.quote_number?.toString().padStart(6, '0')}</span>
                   <span>•</span>
                   <span className="break-normal">{quotation.customer_name}</span>
                   <span>•</span>
                   <span>Created {new Date(quotation.created_at).toLocaleDateString()}</span>
                   <span>•</span>
                   <span className="font-medium text-foreground">
                     {quotation.status === 'sent' ? 'Sent' : 
                      quotation.status === 'approved' ? 'Approved' : 
                      quotation.status === 'rejected' ? 'Rejected' : 
                      quotation.status === 'converted' ? 'Converted' : 'Draft'}
                   </span>
                   <span>•</span>
                   <span>Valid until {addDays(new Date(quotation.created_at), 7).toLocaleDateString()}</span>
                 </div>
               </div>
             </div>
           </div>
          
          {/* Next Step Indicator */}
          {(() => {
            let nextStepText = '';
            if (quotation.status === 'draft') {
              nextStepText = 'Next step: Quotation will be sent to customer';
            } else if (quotation.status === 'sent') {
              nextStepText = 'Next step: Waiting for customer approval';
            } else if (quotation.status === 'approved') {
              nextStepText = 'Next step: Payment processing';
            } else if (quotation.status === 'converted') {
              nextStepText = 'Next step: Service confirmed';
            } else {
              nextStepText = 'Next step: Review quotation';
            }

            return (
               <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                     <span className="text-blue-900 dark:text-blue-100 font-medium text-sm sm:text-base">{nextStepText}</span>
                   </div>
                   {/* Mobile: 50/50 buttons */}
                   <div className="sm:hidden grid grid-cols-2 gap-2">
                     <QuotationShareButtons quotation={quotation as any} />
                     <Button 
                       onClick={handleDownloadQuotation}
                       disabled={isDownloadingQuotation}
                       size="sm"
                       className="h-8 text-xs"
                     >
                       <Download className="h-4 w-4 mr-2" />
                       {isDownloadingQuotation ? 'Downloading...' : 'Download'}
                     </Button>
                   </div>
                   {/* Desktop: Original layout */}
                   <div className="hidden sm:flex items-center gap-2 flex-wrap">
                     <QuotationShareButtons quotation={quotation as any} />
                     <Button 
                       onClick={handleDownloadQuotation}
                       disabled={isDownloadingQuotation}
                       size="sm"
                       className="h-8 text-sm"
                     >
                       <Download className="h-4 w-4 mr-2" />
                       {isDownloadingQuotation ? 'Downloading...' : 'Download Quotation'}
                     </Button>
                   </div>
                 </div>
               </div>
            );
          })()}
        </div>
      </div>
          
       {/* Compact Workflow Section */}
       <div className="bg-muted/30 border-b">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
               <h2 className="text-lg font-semibold">Your Quotation Journey</h2>
               <p className="text-sm text-muted-foreground mt-1">Click on any step to see detailed information</p>
             </div>
             {/* Mobile: 3 column 2 row grid */}
             <div className="sm:hidden grid grid-cols-3 gap-2">
               {/* Row 1 */}
               <div 
                 className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
                 onClick={() => setExpandedStep(expandedStep === 'created' ? null : 'created')}
               >
                 <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center border-2 border-green-400 dark:border-green-500 shadow-sm">
                   <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                 </div>
                 <div className="text-center">
                   <div className="text-xs font-semibold text-green-600 dark:text-green-400">Created</div>
                   <div className="text-xs text-muted-foreground">Tap for details</div>
                 </div>
               </div>

               <div 
                 className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
                 onClick={() => setExpandedStep(expandedStep === 'sent' ? null : 'sent')}
               >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                   quotation?.status === 'sent' || quotation?.last_sent_at
                     ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500' 
                     : 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'
                 }`}>
                   {quotation?.status === 'sent' || quotation?.last_sent_at ? (
                     <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                   ) : (
                     <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                   )}
                 </div>
                 <div className="text-center">
                   <div className={`text-xs font-semibold ${
                     quotation?.status === 'sent' || quotation?.last_sent_at
                       ? 'text-green-600 dark:text-green-400' 
                       : 'text-muted-foreground'
                   }`}>Sent</div>
                   <div className="text-xs text-muted-foreground">Tap for details</div>
                 </div>
               </div>

               <div 
                 className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
                 onClick={() => setExpandedStep(expandedStep === 'approval' ? null : 'approval')}
               >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                   quotation?.approved_at 
                     ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500' 
                     : quotation?.status === 'sent'
                     ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500'
                     : 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'
                 }`}>
                   {quotation?.approved_at ? (
                     <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                   ) : quotation?.status === 'sent' ? (
                     <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                   ) : (
                     <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                   )}
                 </div>
                 <div className="text-center">
                   <div className={`text-xs font-semibold ${
                     quotation?.approved_at 
                       ? 'text-green-600 dark:text-green-400' 
                       : quotation?.status === 'sent'
                       ? 'text-blue-600 dark:text-blue-400'
                       : 'text-muted-foreground'
                   }`}>Approval</div>
                   <div className="text-xs text-muted-foreground">Tap for details</div>
                 </div>
               </div>

               {/* Row 2 */}
               <div 
                 className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
                 onClick={() => setExpandedStep(expandedStep === 'payment' ? null : 'payment')}
               >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                   quotation?.payment_completed_at 
                     ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500' 
                     : quotation?.payment_link_sent_at
                     ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500'
                     : 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'
                 }`}>
                   {quotation?.payment_completed_at ? (
                     <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                   ) : quotation?.payment_link_sent_at ? (
                     <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                   ) : (
                     <CreditCard className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                   )}
                 </div>
                 <div className="text-center">
                   <div className={`text-xs font-semibold ${
                     quotation?.payment_completed_at 
                       ? 'text-green-600 dark:text-green-400' 
                       : quotation?.payment_link_sent_at
                       ? 'text-blue-600 dark:text-blue-400'
                       : 'text-muted-foreground'
                   }`}>Payment</div>
                   <div className="text-xs text-muted-foreground">Tap for details</div>
                 </div>
               </div>

               <div 
                 className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
                 onClick={() => setExpandedStep(expandedStep === 'confirmed' ? null : 'confirmed')}
               >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                   quotation?.status === 'converted' 
                     ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500' 
                     : 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'
                 }`}>
                   {quotation?.status === 'converted' ? (
                     <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                   ) : (
                     <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                   )}
                 </div>
                 <div className="text-center">
                   <div className={`text-xs font-semibold ${
                     quotation?.status === 'converted' 
                       ? 'text-green-600 dark:text-green-400' 
                       : 'text-muted-foreground'
                   }`}>Confirmed</div>
                   <div className="text-xs text-muted-foreground">Tap for details</div>
                 </div>
               </div>

               {/* Empty cell for 3x2 grid */}
               <div></div>
             </div>
             
             {/* Desktop: Horizontal layout */}
             <div className="hidden sm:flex items-center gap-2 lg:gap-4 overflow-x-auto pb-2 lg:pb-0">
              {/* Step 1: Created - Always completed */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                onClick={() => setExpandedStep(expandedStep === 'created' ? null : 'created')}
              >
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center border-2 border-green-400 dark:border-green-500 shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">Created</span>
                  <div className="text-xs text-muted-foreground">Click for details</div>
                </div>
              </div>

              {/* Step 2: Sent */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                onClick={() => setExpandedStep(expandedStep === 'sent' ? null : 'sent')}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                  quotation?.status === 'sent' || quotation?.last_sent_at
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500' 
                    : 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'
                }`}>
                  {quotation?.status === 'sent' || quotation?.last_sent_at ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${
                    quotation?.status === 'sent' || quotation?.last_sent_at
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-muted-foreground'
                  }`}>Sent</span>
                  <div className="text-xs text-muted-foreground">Click for details</div>
                </div>
              </div>

              {/* Step 3: Approval */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                onClick={() => setExpandedStep(expandedStep === 'approval' ? null : 'approval')}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                  quotation?.approved_at 
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500' 
                    : quotation?.status === 'sent'
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'
                }`}>
                  {quotation?.approved_at ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : quotation?.status === 'sent' ? (
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${
                    quotation?.approved_at 
                      ? 'text-green-600 dark:text-green-400' 
                      : quotation?.status === 'sent'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground'
                  }`}>Approval</span>
                  <div className="text-xs text-muted-foreground">Click for details</div>
                </div>
              </div>

              {/* Step 4: Payment */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                onClick={() => setExpandedStep(expandedStep === 'payment' ? null : 'payment')}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                  quotation?.payment_completed_at 
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500' 
                    : quotation?.payment_link_sent_at
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'
                }`}>
                  {quotation?.payment_completed_at ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : quotation?.payment_link_sent_at ? (
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
          </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${
                    quotation?.payment_completed_at 
                      ? 'text-green-600 dark:text-green-400' 
                      : quotation?.payment_link_sent_at
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground'
                  }`}>Payment</span>
                  <div className="text-xs text-muted-foreground">Click for details</div>
        </div>
      </div>

              {/* Step 5: Confirmed */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                onClick={() => setExpandedStep(expandedStep === 'confirmed' ? null : 'confirmed')}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                  quotation?.status === 'converted' 
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500' 
                    : 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-600'
                }`}>
                  {quotation?.status === 'converted' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${
                    quotation?.status === 'converted' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-muted-foreground'
                  }`}>Confirmed</span>
                  <div className="text-xs text-muted-foreground">Click for details</div>
                      </div>
              </div>
                      </div>
                    </div>
                    
          {/* Expanded Step Details */}
          {expandedStep && (
            <div className="mt-4 p-4 bg-background rounded-lg border border-muted/30 animate-in slide-in-from-top-2 duration-200">
              {expandedStep === 'created' && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600 dark:text-green-400">✓ Quotation Created</h4>
                  <p className="text-sm text-muted-foreground">
                    Your quotation was created on {new Date(quotation?.created_at || '').toLocaleDateString()} at {new Date(quotation?.created_at || '').toLocaleTimeString()}
                  </p>
                        </div>
              )}
              
              {expandedStep === 'sent' && (
                <div className="space-y-2">
                  <h4 className={`font-semibold ${quotation?.status === 'sent' || quotation?.last_sent_at ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {quotation?.status === 'sent' || quotation?.last_sent_at ? '✓ Quotation Sent' : '⏳ Not Sent Yet'}
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {quotation?.last_sent_at 
                        ? `Sent on ${new Date(quotation.last_sent_at).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} at ${new Date(quotation.last_sent_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}`
                        : quotation?.status === 'sent'
                        ? `Status: Sent (sent on ${new Date(quotation?.created_at || '').toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} at ${new Date(quotation?.created_at || '').toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })})`
                        : 'This quotation has not been sent to the customer yet'
                      }
                    </p>
                    {quotation?.status === 'sent' && (
                      <p className="text-xs text-muted-foreground">
                        The quotation is now available for customer review and approval
                      </p>
                    )}
                      </div>
                </div>
              )}
              
              {expandedStep === 'approval' && (
                <div className="space-y-2">
                  <h4 className={`font-semibold ${
                    quotation?.approved_at 
                      ? 'text-green-600 dark:text-green-400' 
                      : quotation?.status === 'sent'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground'
                  }`}>
                    {quotation?.approved_at ? '✓ Approved' : quotation?.status === 'sent' ? '⏳ Waiting for Approval' : '⏳ Pending'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {quotation?.approved_at 
                      ? `Approved on ${new Date(quotation.approved_at).toLocaleDateString()} at ${new Date(quotation.approved_at).toLocaleTimeString()}`
                      : quotation?.status === 'sent'
                      ? 'Waiting for customer to review and approve this quotation'
                      : 'This step will be available after the quotation is sent'
                    }
                  </p>
                        </div>
              )}
              
              {expandedStep === 'payment' && (
                <div className="space-y-2">
                  <h4 className={`font-semibold ${
                    quotation?.payment_completed_at 
                      ? 'text-green-600 dark:text-green-400' 
                      : quotation?.payment_link_sent_at
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground'
                  }`}>
                    {quotation?.payment_completed_at ? '✓ Payment Completed' : quotation?.payment_link_sent_at ? '⏳ Payment Link Sent' : '⏳ Pending'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {quotation?.payment_completed_at 
                      ? `Payment completed on ${new Date(quotation.payment_completed_at).toLocaleDateString()} at ${new Date(quotation.payment_completed_at).toLocaleTimeString()}`
                      : quotation?.payment_link_sent_at
                      ? `Payment link sent on ${new Date(quotation.payment_link_sent_at).toLocaleDateString()}`
                      : 'Payment will be processed after quotation approval'
                    }
                  </p>
                      </div>
              )}
              
              {expandedStep === 'confirmed' && (
                <div className="space-y-2">
                  <h4 className={`font-semibold ${
                    quotation?.status === 'converted' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-muted-foreground'
                  }`}>
                    {quotation?.status === 'converted' ? '✓ Service Confirmed' : '⏳ Pending Confirmation'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {quotation?.status === 'converted' 
                      ? 'Your service has been confirmed and is ready to proceed'
                      : 'Service confirmation will be provided after payment completion'
                    }
                  </p>
                          </div>
              )}
                        </div>
                      )}
                    </div>
                  </div>
                  
      {/* Main Content - Full Width */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Customer Information */}
          <Card>
            <CardHeader>
                    <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                      <div>
                  <CardTitle className="text-xl">Customer Information</CardTitle>
                  <CardDescription>Contact and billing details</CardDescription>
                      </div>
                    </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Contact Details */}
                <div className="space-y-4 sm:space-y-6">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Details</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                          </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{quotation.customer_name}</div>
                        <div className="text-sm text-muted-foreground">Full Name</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{quotation.customer_email}</div>
                        <div className="text-sm text-muted-foreground">Email Address</div>
                      </div>
                    </div>
                    {quotation.customer_phone && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{quotation.customer_phone}</div>
                          <div className="text-sm text-muted-foreground">Phone Number</div>
                        </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Billing Information */}
                <div className="space-y-4 sm:space-y-6">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Billing Information</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{quotation.billing_company_name || 'Individual Customer'}</div>
                        <div className="text-sm text-muted-foreground">Company Name</div>
                      </div>
                    </div>
                      {quotation.billing_tax_number && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{quotation.billing_tax_number}</div>
                          <div className="text-sm text-muted-foreground">Tax ID</div>
                        </div>
                          </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                            </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{quotation.customer_address || 'Address not provided'}</div>
                        <div className="text-sm text-muted-foreground">Billing Address</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Service Details & Pricing - Connected Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Service Details - Scalable for Multiple Services */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Service Details</CardTitle>
                    <CardDescription>{quotation?.quotation_items?.length || 0} service{(quotation?.quotation_items?.length || 0) !== 1 ? 's' : ''} selected</CardDescription>
                </div>
                        </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quotation?.quotation_items?.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {/* Vehicle Image - Smaller for scalability */}
                        <div className="w-12 h-12 bg-muted/20 rounded-lg overflow-hidden border flex items-center justify-center flex-shrink-0">
                          {item.vehicle_type ? (
                            <img 
                              src={`/img/${item.vehicle_type.toLowerCase().replace(/\s+/g, '-').replace('executive-lounge', 'executive')}.jpg`}
                              alt={item.vehicle_type}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-primary/10 flex items-center justify-center ${item.vehicle_type ? 'hidden' : 'flex'}`}>
                            <Car className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      
                        {/* Service Info - Compact */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 truncate">
                            {item.service_type_name || 'Service'}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-1 truncate">
                            {item.vehicle_type || 'Premium Vehicle'}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            #{index + 1} • {item.id.slice(-8)}
                        </div>
                        </div>
                      </div>
                      
                      {/* Service Details Grid - Compact */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground mb-1">Pickup Date</div>
                          <div className="font-medium">
                            {item.pickup_date ? new Date(item.pickup_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            }) : 'TBD'}
                        </div>
                          </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Pickup Time</div>
                          <div className="font-medium">{item.pickup_time || 'TBD'}</div>
                      </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Duration</div>
                          <div className="font-medium">
                            {item.duration_hours ? `${item.duration_hours}h` : 'TBD'}
                            {item.service_days && item.service_days > 1 && ` × ${item.service_days}d`}
                          </div>
                          </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Vehicle</div>
                          <div className="font-medium truncate">{item.vehicle_type || 'Premium'}</div>
                        </div>
                        </div>
                        
                      {/* Additional Info - Only if needed */}
                      {(item.quantity && item.quantity > 1) || (item.time_based_adjustment && parseFloat(item.time_based_adjustment) > 0) ? (
                        <div className="mt-3 pt-3 border-t border-muted/30">
                          <div className="flex flex-wrap gap-3 text-xs">
                            {item.quantity && item.quantity > 1 && (
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Qty:</span>
                                <span className="font-medium">{item.quantity}</span>
                          </div>
                        )}
                        {item.time_based_adjustment && parseFloat(item.time_based_adjustment) > 0 && (
                              <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3 text-orange-600" />
                                <span className="text-orange-600 font-medium">
                                  +{item.time_based_adjustment}% overtime
                                </span>
                        </div>
                        )}
                        </div>
                      </div>
                      ) : null}
                    </div>
                  ))}
                    </div>
              </CardContent>
            </Card>

            {/* Price Breakdown with Approve/Reject Buttons */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-xl">Price Breakdown</CardTitle>
                      <CardDescription>Detailed pricing information</CardDescription>
                  </div>
                  </div>
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="THB">THB (฿)</SelectItem>
                        <SelectItem value="CNY">CNY (¥)</SelectItem>
                        <SelectItem value="SGD">SGD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Service Items */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Service Items</h4>
                    <div className="space-y-3">
                      {quotation?.quotation_items?.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-start py-2 border-b border-muted/30 last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.service_type_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.service_days && item.service_days > 1 ? (
                                <span>
                                  {item.service_days} day(s) × {formatCurrencyWithCurrency(item.unit_price, selectedCurrency)} = {formatCurrencyWithCurrency(item.unit_price * item.service_days, selectedCurrency)}
                                </span>
                                                              ) : (
                                <span>
                                  Qty: {item.quantity} × {formatCurrencyWithCurrency(item.unit_price, selectedCurrency)} = {formatCurrencyWithCurrency(item.unit_price * item.quantity, selectedCurrency)}
                                  </span>
                              )}
                            </div>
                            {item.time_based_adjustment && parseFloat(item.time_based_adjustment) > 0 && (
                              <div className="text-xs text-orange-600 mt-1">
                                + Overtime ({item.time_based_adjustment}%): +{formatCurrencyWithCurrency((item.unit_price * parseFloat(item.time_based_adjustment)) / 100, selectedCurrency)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-primary">{formatCurrencyWithCurrency(item.total_price, selectedCurrency)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                    </div>
                    
                  {/* Summary */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Services Subtotal</span>
                        <span>{formatCurrencyWithCurrency(quotation.amount, selectedCurrency)}</span>
                      </div>
                      
                      {quotation.selected_promotion_name && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Promotion: {quotation.selected_promotion_name}</span>
                          <span>-{formatCurrencyWithCurrency(quotation.promotion_discount || 0, selectedCurrency)}</span>
                      </div>
                    )}
                    
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrencyWithCurrency(quotation.amount - (quotation.promotion_discount || 0), selectedCurrency)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Tax (10%)</span>
                        <span>+{formatCurrencyWithCurrency(((quotation.amount - (quotation.promotion_discount || 0)) * 10) / 100, selectedCurrency)}</span>
                      </div>
                    
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total Amount Due</span>
                        <span className="text-primary">{formatCurrencyWithCurrency(quotation.total_amount, selectedCurrency)}</span>
                  </div>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quotation Approval - Full Width */}
            {['draft', 'sent'].includes(quotation.status) && (
              <Card>
                <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Quotation Approval</CardTitle>
                    <CardDescription>Review this quotation and either approve to proceed or reject with detailed feedback</CardDescription>
                  </div>
                </div>
                </CardHeader>
                <CardContent>
                  <QuotationDetailsApprovalPanel
                    isProcessing={isApproving || isRejecting}
                    customerName={quotation.customer_name}
                    quotation={quotation as any}
                  onApprove={async (notes, signature) => {
                    setIsApproving(true);
                    try {
                      await handleApprove(notes, signature || '', '');
                    } finally {
                      setIsApproving(false);
                    }
                  }}
                  onReject={async (reason, signature) => {
                    setIsRejecting(true);
                    try {
                      await handleReject(reason, signature || '', '');
                    } finally {
                      setIsRejecting(false);
                    }
                  }}
                    showBccFields={false}
                  hideHeader={true}
                  />
                </CardContent>
              </Card>
            )}

          {/* Customer Notes */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                <StickyNote className="h-6 w-6 text-primary" />
                      <div>
                  <CardTitle className="text-xl">Customer Notes</CardTitle>
                  <CardDescription>Additional information and comments</CardDescription>
                        </div>
                      </div>
              </CardHeader>
            <CardContent>
              <Textarea
                value={quotation.customer_notes || ''}
                readOnly
                placeholder="No customer notes provided"
                className="min-h-[100px]"
              />
              </CardContent>
            </Card>
                    </div>
                  </div>

      {/* Footer */}
      <div className="border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>This magic link will expire on {addDays(new Date(quotation?.created_at || new Date()), 7).toLocaleDateString()}</p>
            <p className="mt-1 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Secure access via magic link (valid for 7 days)
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}