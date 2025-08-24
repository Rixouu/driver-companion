'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO, addDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import the existing approval panel component
import { QuotationDetailsApprovalPanel } from '@/components/quotations/quotation-details/approval-panel';
import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  CreditCard,
  Car,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  CheckCircle as CheckCircleIcon, 
  Mail as MailIcon, 
  MapPin as MapPinIcon, 
  RefreshCw, 
  X,
  Building as BuildingIcon,
  CreditCard as CreditCardIcon,
  Edit,
  Globe,
  Check,
  Package,
  Gift,
  Timer,
  Percent,
  Tag,
  TrendingUp,
  DollarSign,
  Calculator,
  Eye,
  Receipt,
  Download,
  Eye as EyeIcon,
  Share2,
  Printer,
  Sun,
  Moon,
  MessageCircle,
  Info
} from 'lucide-react';


interface QuotationData {
  id: string;
  title: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  billing_company_name?: string;
  billing_tax_number?: string;
  billing_address?: string;
  billing_street_name?: string;
  billing_street_number?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  status: string;
  quote_number: number;
  created_at: string;
  expiry_date: string;
  amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
  quotation_items: QuotationItem[];
  // Additional fields for full functionality
  service_type?: string;
  vehicle_type?: string;
  pickup_date?: string;
  pickup_time?: string;
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number;
  discount_percentage?: number;
  tax_percentage?: number;
  promotion_discount?: number;
  selected_promotion_name?: string;
  selected_promotion_description?: string;
  selected_promotion_code?: string;
  time_based_adjustment?: number;
  // Payment and workflow fields
  payment_link_sent_at?: string;
  payment_completed_at?: string;
  invoice_generated_at?: string;
  approved_at?: string;
  rejected_at?: string;
  last_sent_at?: string;
  reminder_sent_at?: string;
  booking_created_at?: string;
  receipt_url?: string;
  updated_at?: string;
}

interface QuotationItem {
  id: string;
  service_type_id: string;
  service_type_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vehicle_type?: string;
  vehicle_category?: string;
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number;
  pickup_date?: string;
  pickup_time?: string;
  time_based_adjustment?: string;
  time_based_rule_name?: string;
}

export default function QuoteAccessPage() {
  const params = useParams();
  const token = params.token as string;
  
  // Enhanced currency formatter with dynamic conversion
  const [selectedCurrency, setSelectedCurrency] = useState<string>('JPY');
  
  const formatCurrency = (amount: number, currency: string = selectedCurrency) => {
    if (amount === undefined || amount === null) return `¥0`;
    
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
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
    const originalCurrency = quotation?.currency || 'JPY';
    const convertedAmount = numericAmount * (exchangeRates[currency] / exchangeRates[originalCurrency]);
    
    // Format based on currency
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (currency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(convertedAmount);
    }
  };
  
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  
  // Progress modal state
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressTitle, setProgressTitle] = useState('Processing');
  const [progressLabel, setProgressLabel] = useState('Starting...');
  
  // Theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Loading states for actions
  const [isDownloadingQuotation, setIsDownloadingQuotation] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  // Calculate expiry status when quotation is loaded
  const daysUntilExpiry = quotation ? (() => {
    const now = new Date();
    const createdDate = new Date(quotation.created_at);
    const properExpiryDate = addDays(createdDate, 2);
    return Math.ceil((properExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })() : null;
  
  // Share functionality state
  const [isShareOpen, setIsShareOpen] = useState(false);
  


  // Handle theme mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const validateTokenAndLoadQuotation = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 [Quote Access] Validating token:', token);
        
        const response = await fetch(`/api/quotations/validate-magic-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        console.log('🔍 [Quote Access] API response status:', response.status);
        console.log('🔍 [Quote Access] API response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('🔍 [Quote Access] API error data:', errorData);
          if (response.status === 410) {
            setIsExpired(true);
            setError('This magic link has expired.');
          } else {
            setError(errorData.error || 'Invalid or expired magic link');
          }
          return;
        }

        const data = await response.json();
        console.log('🔍 [Quote Access] API success data:', data);
        setQuotation(data.quotation);
        
      } catch (error) {
        console.error('❌ [Quote Access] Error loading quotation:', error);
        setError('Failed to load quotation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      validateTokenAndLoadQuotation();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="p-6">
            {isExpired ? (
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold mb-2">
              {isExpired ? 'Magic Link Expired' : 'Access Denied'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || 'Unable to access this quotation'}
            </p>
            {isExpired && (
              <p className="text-sm text-muted-foreground">
                Magic links are valid for 7 days. Please contact us for a new link.
              </p>
            )}
            <Button 
              onClick={() => window.history.back()} 
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper functions for approval/rejection
  const handleApprove = async (notes: string, signature?: string) => {
    if (!quotation) return;
    
    setIsApproving(true);
    setProgressOpen(true);
    setProgressTitle('Approving Quotation');
    setProgressLabel('Updating status...');
    setProgressValue(10);
    
    try {
      // Simulate progress steps
      const steps = [
        { label: 'Updating status...', value: 30 },
        { label: 'Recording activity...', value: 60 },
        { label: 'Sending email notification...', value: 80 }
      ];
      
      for (const step of steps) {
        setProgressLabel(step.label);
        setProgressValue(step.value);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const response = await fetch('/api/quotations/approve-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation.id,
          notes: notes,
          signature: signature
        }),
      });
      
      if (response.ok) {
        // Send approval email
        try {
          await fetch('/api/quotations/approve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: quotation.id,
              notes: notes,
              skipStatusCheck: true
            }),
          });
        } catch (emailError) {
          console.warn('Email notification failed:', emailError);
          // Don't fail the approval if email fails
        }
        
        setProgressValue(100);
        setProgressLabel('Completed');
        toast({
          title: 'Quotation approved successfully',
          description: 'Email notification sent to customer',
          variant: 'default',
        });
        setTimeout(() => {
          setProgressOpen(false);
          // Refresh the quotation data
          window.location.reload();
        }, 500);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error approving quotation:', error);
      setProgressLabel('Failed');
      toast({
        title: 'Error',
        description: 'Failed to approve quotation. Please try again.',
        variant: 'destructive',
      });
      setTimeout(() => setProgressOpen(false), 1000);
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async (reason: string, signature?: string) => {
    if (!quotation) return;
    
    setIsRejecting(true);
    setProgressOpen(true);
    setProgressTitle('Rejecting Quotation');
    setProgressLabel('Updating status...');
    setProgressValue(10);
    
    try {
      // Simulate progress steps
      const steps = [
        { label: 'Updating status...', value: 30 },
        { label: 'Recording activity...', value: 60 },
        { label: 'Sending email notification...', value: 80 }
      ];
      
      for (const step of steps) {
        setProgressLabel(step.label);
        setProgressValue(step.value);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const response = await fetch('/api/quotations/reject-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation.id,
          reason: reason,
          signature: signature
        }),
      });
      
      if (response.ok) {
        // Send rejection email
        try {
          await fetch('/api/quotations/reject', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: quotation.id,
              reason: reason,
              skipStatusCheck: true
            }),
          });
        } catch (emailError) {
          console.warn('Email notification failed:', emailError);
          // Don't fail the rejection if email fails
        }
        
        setProgressValue(100);
        setProgressLabel('Completed');
        toast({
          title: 'Quotation rejected successfully',
          description: 'Email notification sent to customer',
          variant: 'default',
        });
        setTimeout(() => {
          setProgressOpen(false);
          // Refresh the quotation data
          window.location.reload();
        }, 500);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      setProgressLabel('Failed');
      toast({
        title: 'Error',
        description: 'Failed to reject quotation. Please try again.',
        variant: 'destructive',
      });
      setTimeout(() => setProgressOpen(false), 1000);
    } finally {
      setIsRejecting(false);
    }
  };
  
  // Download functions
  const handleDownloadQuotation = async () => {
    if (!quotation) return;
    
    setIsDownloadingQuotation(true);
    setProgressOpen(true);
    setProgressTitle('Downloading Quotation');
    setProgressLabel('Generating PDF...');
    setProgressValue(10);
    
    try {
      // Simulate progress steps
      const steps = [
        { label: 'Generating PDF...', value: 30 },
        { label: 'Processing content...', value: 60 },
        { label: 'Preparing download...', value: 80 }
      ];
      
      for (const step of steps) {
        setProgressLabel(step.label);
        setProgressValue(step.value);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const response = await fetch('/api/quotations/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation.id,
          language: 'en'
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quotation-QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setProgressValue(100);
        setProgressLabel('Completed');
        toast({
          title: 'Quotation downloaded successfully',
          variant: 'default',
        });
        setTimeout(() => setProgressOpen(false), 500);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error downloading quotation:', error);
      setProgressLabel('Failed');
      toast({
        title: 'Error',
        description: 'Failed to download quotation. Please try again.',
        variant: 'destructive',
      });
      setTimeout(() => setProgressOpen(false), 1000);
    } finally {
      setIsDownloadingQuotation(false);
    }
  };
  
  const handleDownloadInvoice = async () => {
    if (!quotation) return;
    
    setIsDownloadingInvoice(true);
    setProgressOpen(true);
    setProgressTitle('Downloading Invoice');
    setProgressLabel('Generating PDF...');
    setProgressValue(10);
    
    try {
      // Simulate progress steps
      const steps = [
        { label: 'Generating PDF...', value: 30 },
        { label: 'Processing content...', value: 60 },
        { label: 'Preparing download...', value: 80 }
      ];
      
      for (const step of steps) {
        setProgressLabel(step.label);
        setProgressValue(step.value);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const response = await fetch('/api/quotations/generate-invoice-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation.id,
          language: 'en'
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-INV-JPDR-${quotation.quote_number?.toString().padStart(6, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setProgressValue(100);
        setProgressLabel('Completed');
        toast({
          title: 'Invoice downloaded successfully',
          variant: 'default',
        });
        setTimeout(() => setProgressOpen(false), 500);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setProgressLabel('Failed');
      toast({
        title: 'Error',
        description: 'Failed to download invoice. Please try again.',
        variant: 'destructive',
      });
      setTimeout(() => setProgressOpen(false), 1000);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };
  
  const handleDownloadReceipt = () => {
    if (quotation?.receipt_url) {
      window.open(quotation.receipt_url, '_blank');
    }
  };
  
  // Share functionality
  const handleWhatsAppShare = () => {
    if (!quotation) return;
    
    const formattedQuoteNumber = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    const shareMessage = `Check out this quotation: ${quotation.title || 'Untitled'} (${formattedQuoteNumber})\n\n${currentUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    
    window.open(whatsappUrl, '_blank');
    setIsShareOpen(false);
    
    toast({
      title: 'Opened WhatsApp',
      description: 'Share the quotation via WhatsApp',
    });
  };

  const handleLineShare = () => {
    if (!quotation) return;
    
    const formattedQuoteNumber = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    const shareMessage = `Check out this quotation: ${quotation.title || 'Untitled'} (${formattedQuoteNumber})\n\n${currentUrl}`;
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareMessage)}`;
    
    window.open(lineUrl, '_blank');
    setIsShareOpen(false);
    
    toast({
      title: 'Opened LINE',
      description: 'Share the quotation via LINE',
    });
  };

  const handleCopyLink = async () => {
    if (!quotation) return;
    
    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      await navigator.clipboard.writeText(currentUrl);
      setIsShareOpen(false);
      
      toast({
        title: 'Link copied!',
        description: 'Quotation link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy link',
        description: 'Please copy the URL manually',
        variant: 'destructive',
      });
    }
  };
  

  

 
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary', text: 'Draft' },
      sent: { variant: 'default', text: 'Sent' },
      approved: { variant: 'default', text: 'Approved' },
      rejected: { variant: 'destructive', text: 'Rejected' },
      converted: { variant: 'default', text: 'Converted to Booking' },
      paid: { variant: 'default', text: 'Paid' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline', text: status };
    
    return (
      <Badge variant={config.variant as any}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          {/* Top bar with logo and theme toggle */}
                      <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img 
                  src="/img/driver-header-logo.png" 
                  alt="DRIVER Logo" 
                  className="h-8 w-auto"
                />
               
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  disabled={!mounted}
                >
                  {mounted && theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLineShare} className="gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      LINE
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          
          <div className="text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{quotation.title || 'Quotation'}</h1>
            <p className="text-xl text-muted-foreground">
              Quote #{quotation.quote_number} • {quotation.customer_name}
            </p>
            <div className="flex items-center justify-center gap-2">
              {getStatusBadge(quotation.status)}
              <span className="text-sm text-muted-foreground">
                Created {formatDate(quotation.created_at)}
              </span>
            </div>
          </div>
          
          {/* Next Step Indicator */}

          
          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-3 pt-4 border-t mt-4">
            {/* Download buttons */}
            <Button 
              onClick={handleDownloadQuotation} 
              variant="outline" 
              className="gap-2"
              disabled={isDownloadingQuotation}
            >
              {isDownloadingQuotation ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Quotation
                </>
              )}
            </Button>
            
            {quotation.status === 'approved' && (
              <Button 
                onClick={handleDownloadInvoice} 
                variant="outline" 
                className="gap-2"
                disabled={isDownloadingInvoice}
              >
                {isDownloadingInvoice ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Download Invoice
                  </>
                )}
              </Button>
            )}
            
            {quotation.receipt_url && (
              <Button 
                onClick={handleDownloadReceipt} 
                variant="outline" 
                className="gap-2"
                disabled={isDownloadingReceipt}
              >
                {isDownloadingReceipt ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4" />
                    Download Receipt
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
          {/* Main Content - 2 columns on XL screens, full width on smaller */}
          <div className="xl:col-span-2 space-y-6">
            {/* Customer Information - Clean Design */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Customer Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Personal Information</h3>
                        <p className="text-sm text-muted-foreground">Customer contact details</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Full Name</span>
                        </div>
                        <div className="text-sm">{quotation.customer_name}</div>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Email</span>
                        </div>
                        <div className="text-sm">{quotation.customer_email}</div>
                      </div>
                      
                      {quotation.customer_phone && (
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Phone</span>
                          </div>
                          <div className="text-sm">{quotation.customer_phone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Billing Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Building className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Billing Information</h3>
                        <p className="text-sm text-muted-foreground">Company and billing details</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {quotation.billing_company_name && (
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Company</span>
                          </div>
                          <div className="text-sm">{quotation.billing_company_name}</div>
                        </div>
                      )}
                      
                      {quotation.billing_tax_number && (
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Tax Number</span>
                          </div>
                          <div className="text-sm">{quotation.billing_tax_number}</div>
                        </div>
                      )}
                      
                      {/* Billing Address - Always show this section */}
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Address</span>
                          </div>
                          <div className="text-sm space-y-1">
                            {quotation.billing_street_name && (
                              <div>{quotation.billing_street_name}</div>
                            )}
                            <div>
                              {quotation.billing_city && `${quotation.billing_city}`}
                              {quotation.billing_state && `, ${quotation.billing_state}`}
                              {quotation.billing_postal_code && ` ${quotation.billing_postal_code}`}
                              {quotation.billing_country && `, ${quotation.billing_country}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Selected Services - Enhanced Design */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-primary" />
                  <CardTitle>Selected Services ({quotation.quotation_items.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {quotation.quotation_items.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {item.service_type_name}
                          </h3>
                          {item.vehicle_type && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.vehicle_type}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="text-right">
                                                  <div className="text-lg font-bold text-primary">
                          {formatCurrency(item.total_price, selectedCurrency)}
                        </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {item.service_days && item.service_days > 1 ? 'Duration:' : 'Quantity:'}
                          </span>
                          <span className="font-medium">
                            {item.service_days && item.service_days > 1 
                              ? `${item.service_days} day(s) × ${formatCurrency(item.unit_price, selectedCurrency)} = ${formatCurrency(item.total_price, selectedCurrency)}`
                              : item.quantity
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {item.service_days && item.service_days > 1 ? 'Unit Price:' : 'Unit Price:'}
                          </span>
                          <span className="font-medium">
                            {item.service_days && item.service_days > 1 
                              ? formatCurrency(item.unit_price, selectedCurrency)
                              : formatCurrency(item.unit_price, selectedCurrency)
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* Service-specific details - ALWAYS SHOW */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Pickup Date:</span>
                          <span className="font-medium">{formatDate((item.pickup_date || quotation.pickup_date) || '')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Pickup Time:</span>
                          <span className="font-medium">{item.pickup_time || quotation.pickup_time}</span>
                        </div>
                      </div>
                      
                      {/* Duration and time-based adjustments - ALWAYS SHOW */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{item.duration_hours || quotation.duration_hours} hour(s)</span>
                        </div>
                        
                        {item.time_based_adjustment && parseFloat(item.time_based_adjustment) > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Time Adjustment:</span>
                            <span className="font-medium text-orange-600">
                              +{formatCurrency((item.unit_price * parseFloat(item.time_based_adjustment)) / 100, selectedCurrency)} (+{item.time_based_adjustment}%)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Service days for multi-day services - ALWAYS SHOW */}
                      {(item.service_days && item.service_days > 1) || (quotation.service_days && quotation.service_days > 1) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Service Duration:</span>
                            <span className="font-medium">{(item.service_days || quotation.service_days)} day(s) × {(item.hours_per_day || quotation.hours_per_day || 1)}h/day</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Total Hours:</span>
                            <span className="font-medium">{(item.service_days || quotation.service_days) * (item.hours_per_day || quotation.hours_per_day || 1)}h total</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Price breakdown */}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Base Price:</span>
                          <span className="font-medium">{formatCurrency(item.unit_price, selectedCurrency)}</span>
                        </div>
                        
                        {/* Show service days breakdown for multi-day services */}
                        {item.service_days && item.service_days > 1 && (
                          <div className="flex justify-between items-center text-sm text-blue-600">
                            <span>Service Days ({item.service_days} day(s) × {formatCurrency(item.unit_price, selectedCurrency)}):</span>
                            <span className="font-medium">+{formatCurrency(item.total_price - item.unit_price, selectedCurrency)}</span>
                          </div>
                        )}
                        
                        {item.time_based_adjustment && parseFloat(item.time_based_adjustment) > 0 && (
                          <div className="flex justify-between items-center text-sm text-orange-600">
                            <span>Time Adjustment ({item.time_based_adjustment}%):</span>
                            <span className="font-medium">+{formatCurrency((item.unit_price * parseFloat(item.time_based_adjustment)) / 100, selectedCurrency)}</span>
                        </div>
                        )}
                        
                        <div className="flex justify-between items-center text-sm font-semibold border-t pt-2 mt-2">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(item.total_price, selectedCurrency)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Services Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Services Subtotal</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(quotation.amount, quotation.currency)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Price Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-primary" />
                    <CardTitle>Price Details</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
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
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-6 w-6 p-0 cursor-help flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
                            <Clock className="h-4 w-4 text-orange-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="w-auto">
                          <div className="space-y-3 max-w-xs">
                            <div>
                              <p className="font-medium">Exchange Rate Information</p>
                              {selectedCurrency !== 'JPY' && (
                                <div className="space-y-1 mt-2">
                                  <p className="text-sm font-medium text-blue-600">
                                    1 JPY = {formatCurrency(1, selectedCurrency).replace(/[^\d.,]/g, '')} {selectedCurrency}
                                  </p>
                                  <p className="text-sm font-medium text-blue-600">
                                    1 {selectedCurrency} = {(1 / (selectedCurrency === 'USD' ? 0.0067 : selectedCurrency === 'EUR' ? 0.0062 : selectedCurrency === 'THB' ? 0.22 : selectedCurrency === 'CNY' ? 0.048 : 0.0091)).toFixed(4)} JPY
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Source:</span>
                                <span className="font-medium text-green-600">Fixed rates</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Updated:</span>
                                <span className="font-medium text-green-600">Real-time</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Base:</span>
                                <span className="font-medium">JPY</span>
                              </div>
                            </div>

                            {/* Show all available exchange rates */}
                            <div className="pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-2">All Rates (1 JPY):</p>
                              <div className="space-y-1">
                                {['USD', 'EUR', 'THB', 'CNY', 'SGD'].map((code) => (
                                  <div key={code} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">{code}:</span>
                                    <span className="font-mono font-medium">
                                      {code === 'USD' ? '0.0067' : code === 'EUR' ? '0.0062' : code === 'THB' ? '0.22' : code === 'CNY' ? '0.048' : '0.0091'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Rates are for reference only and may not reflect real-time market conditions.
                              </p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Services Breakdown - Compact Design with Better Spacing */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Service Items
                    </h3>
                    {quotation.quotation_items.map((item, index) => (
                      <div key={item.id} className={`p-2.5 rounded border ${index % 2 === 0 ? 'bg-muted/20' : 'bg-background'} border-muted/30`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground text-xs mb-1 truncate">{item.service_type_name}</div>
                            <div className="text-xs text-muted-foreground mb-1.5">
                              {item.service_days && item.service_days > 1 ? (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {item.service_days} day(s) × {formatCurrency(item.unit_price, selectedCurrency)} = {formatCurrency(item.total_price, selectedCurrency)}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  Qty: {item.quantity} × {formatCurrency(item.unit_price, selectedCurrency)}
                                </span>
                              )}
                            </div>
                            
                            {/* Show overtime if applicable */}
                            {item.time_based_adjustment && parseFloat(item.time_based_adjustment) > 0 && (
                              <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1 py-0.5 rounded">
                                <Timer className="h-3 w-3" />
                                +{formatCurrency((item.unit_price * parseFloat(item.time_based_adjustment)) / 100, selectedCurrency)} ({item.time_based_adjustment}% overtime)
                              </div>
                            )}
                            
                            {/* Show overtime if applicable from main quotation */}
                            {quotation.time_based_adjustment && parseFloat(quotation.time_based_adjustment.toString()) > 0 && !item.time_based_adjustment && (
                              <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1 py-0.5 rounded">
                                <Timer className="h-3 w-3" />
                                +{formatCurrency((quotation.amount * parseFloat(quotation.time_based_adjustment.toString())) / 100, selectedCurrency)} ({item.time_based_adjustment}% overtime)
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-primary">{formatCurrency(item.total_price, selectedCurrency)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary Section - Enhanced Compact */}
                  <div className="space-y-3 bg-muted/30 rounded-lg p-3 border border-muted/50">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Summary
                    </h3>
                    
                    {/* Services Subtotal */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium text-foreground">Services Subtotal</span>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(quotation.amount, selectedCurrency)}</span>
                    </div>
                    
                    {/* Regular Discount Percentage */}
                    {quotation.discount_percentage && quotation.discount_percentage > 0 && (
                      <div className="flex justify-between items-center py-1 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        <span className="flex items-center gap-1 text-sm">
                          <Percent className="h-3 w-3" />
                          Discount ({quotation.discount_percentage}%)
                        </span>
                        <span className="text-sm font-semibold">-{formatCurrency((quotation.amount * quotation.discount_percentage) / 100, selectedCurrency)}</span>
                      </div>
                    )}
                    
                    {/* Promotion Discount */}
                    {quotation.promotion_discount && quotation.promotion_discount > 0 && (
                      <div className="flex justify-between items-center py-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        <span className="flex items-center gap-1 text-sm">
                          <Gift className="h-3 w-3" />
                          Promotion: {quotation.selected_promotion_name || 'Discount'} ({Math.round((quotation.promotion_discount / quotation.amount) * 100)}%)
                        </span>
                        <span className="text-sm font-semibold">-{formatCurrency(quotation.promotion_discount, selectedCurrency)}</span>
                      </div>
                    )}
                    
                    {/* Subtotal after discounts */}
                    {(quotation.discount_percentage && quotation.discount_percentage > 0) || (quotation.promotion_discount && quotation.promotion_discount > 0) ? (
                      <div className="flex justify-between items-center py-1 border-t border-muted/30 pt-2">
                        <span className="text-sm font-medium text-foreground">Subtotal</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(
                            quotation.amount - 
                            ((quotation.discount_percentage || 0) * quotation.amount / 100) - 
                            (quotation.promotion_discount || 0), 
                            selectedCurrency
                          )}
                        </span>
                      </div>
                    ) : null}
                    
                    {/* Tax */}
                    {quotation.tax_percentage && quotation.tax_percentage > 0 && (
                      <div className="flex justify-between items-center py-1 text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        <span className="flex items-center gap-1 text-sm">
                          <Percent className="h-3 w-3" />
                          Tax ({quotation.tax_percentage}%)
                        </span>
                        <span className="text-sm font-semibold">+{formatCurrency(
                          ((quotation.amount - 
                            ((quotation.discount_percentage || 0) * quotation.amount / 100) - 
                            (quotation.promotion_discount || 0)) * quotation.tax_percentage) / 100, 
                          selectedCurrency
                        )}</span>
                      </div>
                    )}
                    
                  </div>
                  
                  {/* Total Amount Due - Separate section with same styling as Services Subtotal */}
                  <div className="bg-muted/30 rounded-lg p-3 border border-muted/50">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium text-foreground">Total Amount Due</span>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(quotation.total_amount, selectedCurrency)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            {(quotation.notes || quotation.terms) && (
              <>
                <Separator />
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <CardTitle>Additional Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {quotation.notes && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                        <div className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-muted/30">
                          {quotation.notes}
                        </div>
                      </div>
                    )}
                    
                    {quotation.terms && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Terms & Conditions</h3>
                        <div className="text-sm whitespace-pre-wrap">
                          {quotation.terms}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Footer */}
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                This magic link will expire on {formatDate(quotation.expiry_date)}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Secure access via magic link</span>
              </div>
            </div>
          </div>
          
          {/* Sidebar - Right Column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Quotation Status Card */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  Quotation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <Badge variant="default" className="font-medium">
                      {quotation.status === 'draft' ? 'Draft' :
                       quotation.status === 'sent' ? 'Sent' :
                       quotation.status === 'approved' ? 'Approved' :
                       quotation.status === 'rejected' ? 'Rejected' :
                       quotation.status === 'paid' ? 'Paid' :
                       quotation.status === 'converted' ? 'Converted' :
                       'Unknown'}
                    </Badge>
                  </div>
                </div>
                
                {/* Next Step Indicator - Compact */}
                {(() => {
                  let nextStepText = '';
                  if (quotation.status === 'draft') {
                    nextStepText = 'Send to customer';
                  } else if (quotation.status === 'sent') {
                    nextStepText = 'Wait for approval';
                  } else if (quotation.status === 'approved' && !quotation.invoice_generated_at) {
                    nextStepText = 'Generate invoice';
                  } else if (quotation.invoice_generated_at && !quotation.payment_link_sent_at && !quotation.payment_completed_at) {
                    nextStepText = 'Send payment link';
                  } else if (quotation.payment_link_sent_at && !quotation.payment_completed_at) {
                    nextStepText = 'Wait for payment';
                  } else if (quotation.payment_completed_at && quotation.status !== 'converted') {
                    nextStepText = 'Convert to booking';
                  }
                  
                  if (nextStepText) {
                    return (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Next:</span> {nextStepText}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Show expiration only for non-approved quotations */}
                {daysUntilExpiry !== null && !['approved', 'paid', 'converted'].includes(quotation.status) && (
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-600 text-green-700 dark:text-green-200">
                    <div className="text-sm font-semibold mb-1">
                      {daysUntilExpiry > 0 ? (
                        `Valid for ${daysUntilExpiry} more day${daysUntilExpiry !== 1 ? 's' : ''}`
                      ) : daysUntilExpiry === 0 ? (
                        'Expires today'
                      ) : (
                        `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago`
                      )}
                    </div>
                    {daysUntilExpiry >= 0 && (
                      <div className="text-xs opacity-90">
                        Valid until {formatDate(addDays(new Date(quotation.created_at), 2).toISOString())}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quotation Workflow */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Quotation Workflow
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Track the progress of this quotation through each stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Draft Created */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center border-2 border-green-500">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">Draft Created</div>
                      <div className="text-xs text-muted-foreground">
                        Quotation has been created and saved as draft
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(quotation.created_at)} at {new Date(quotation.created_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </Badge>
                    </div>
                  </div>

                  {/* Quotation Sent */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      quotation.status === 'sent' || quotation.status === 'approved' || quotation.status === 'paid' || quotation.status === 'converted'
                        ? 'bg-green-600 border-green-500' : 'bg-gray-600 border-gray-500'
                    }`}>
                      {quotation.status === 'sent' || quotation.status === 'approved' || quotation.status === 'paid' || quotation.status === 'converted' ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <Mail className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">Quotation Sent</div>
                      <div className="text-xs text-muted-foreground">
                        Quotation has been sent to customer for review
                      </div>
                      {quotation.last_sent_at ? (
                        <Badge variant="outline" className="text-xs">
                          {formatDate(quotation.last_sent_at)} at {new Date(quotation.last_sent_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Badge>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Pending</div>
                      )}
                    </div>
                  </div>

                  {/* Customer Approved */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      quotation.status === 'approved' || quotation.status === 'paid' || quotation.status === 'converted'
                        ? 'bg-green-600 border-green-500' : 'bg-gray-600 border-gray-500'
                    }`}>
                      {quotation.status === 'approved' || quotation.status === 'paid' || quotation.status === 'converted' ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">Customer Approved</div>
                      <div className="text-xs text-muted-foreground">
                        Customer has approved the quotation
                      </div>
                      {quotation.approved_at ? (
                        <Badge variant="outline" className="text-xs">
                          {formatDate(quotation.approved_at)} at {new Date(quotation.approved_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Badge>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Pending</div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Generated */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      quotation.invoice_generated_at || quotation.status === 'paid' || quotation.status === 'converted'
                        ? 'bg-green-600 border-green-500' : 'bg-gray-600 border-gray-500'
                    }`}>
                      {quotation.invoice_generated_at || quotation.status === 'paid' || quotation.status === 'converted' ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">Invoice Generated</div>
                      <div className="text-xs text-muted-foreground">
                        Invoice has been generated and payment link sent
                      </div>
                      {quotation.invoice_generated_at ? (
                        <Badge variant="outline" className="text-xs">
                          {formatDate(quotation.invoice_generated_at)} at {new Date(quotation.invoice_generated_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Badge>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Pending</div>
                      )}
                    </div>
                  </div>

                  {/* Payment Link Sent */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      quotation.status === 'paid' || quotation.status === 'converted'
                        ? 'bg-green-600 border-green-500' : 'bg-gray-600 border-gray-500'
                    }`}>
                      {quotation.status === 'paid' || quotation.status === 'converted' ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">Payment Link Sent</div>
                      <div className="text-xs text-muted-foreground">
                        Secure payment link has been sent to customer
                      </div>
                      {quotation.invoice_generated_at ? (
                        <Badge variant="outline" className="text-xs">
                          {formatDate(quotation.invoice_generated_at)} at {new Date(quotation.invoice_generated_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Badge>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Pending</div>
                      )}
                    </div>
                  </div>

                  {/* Payment Completed */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      quotation.status === 'paid' || quotation.status === 'converted'
                        ? 'bg-green-600 border-green-500' : 'bg-gray-600 border-gray-500'
                    }`}>
                      {quotation.status === 'paid' || quotation.status === 'converted' ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">Payment Completed</div>
                      <div className="text-xs text-muted-foreground">
                        Payment has been received and confirmed
                      </div>
                      {quotation.payment_completed_at ? (
                        <Badge variant="outline" className="text-xs">
                          {formatDate(quotation.payment_completed_at)} at {new Date(quotation.payment_completed_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Badge>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Pending</div>
                      )}
                    </div>
                  </div>

                  {/* Converted to Booking */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      quotation.status === 'converted'
                        ? 'bg-green-600 border-green-500' : 'bg-gray-600 border-gray-500'
                    }`}>
                      {quotation.status === 'converted' ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <Car className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">Converted to Booking</div>
                      <div className="text-xs text-muted-foreground">
                        Quotation has been converted to a confirmed booking
                      </div>
                      {quotation.status === 'converted' ? (
                        <Badge variant="outline" className="text-xs">
                          {formatDate(quotation.updated_at || quotation.created_at)} at {new Date(quotation.updated_at || quotation.created_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Badge>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Pending</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quotation Approval Panel - Moved to sidebar */}
            {['draft', 'sent'].includes(quotation.status) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Customer Actions
                  </CardTitle>
                  <CardDescription>
                    Approve or reject this quotation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuotationDetailsApprovalPanel
                    isProcessing={isApproving || isRejecting}
                    customerName={quotation.customer_name}
                    quotation={quotation as any}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>





      {/* Progress Modal */}
      {progressOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-foreground">{progressTitle}</h3>
            <div className="space-y-3">
              <Progress value={progressValue} />
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>{progressLabel}</span>
                <span className="font-medium text-foreground">{progressValue}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
