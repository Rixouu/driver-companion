"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Calendar,
  CheckCircle, 
  Clock, 
  Mail, 
  MapPin, 
  RefreshCw, 
  X,
  FileText,
  Building,
  User,
  CreditCard,
  Edit,
  Globe,
  Check,
  Package,
  Gift,
  Timer,
  Percent,
  Car,
  Tag,
  TrendingUp,
  Phone,
  DollarSign,
  Calculator,
  Eye
} from 'lucide-react';
import { Quotation, QuotationItem, QuotationStatus, PricingPackage, PricingPromotion, PackageType } from '@/types/quotations';
import { useQuotationService } from "@/lib/hooks/useQuotationService";
import LoadingSpinner from '@/components/shared/loading-spinner';
import { QuotationPdfButton } from '@/components/quotations/quotation-pdf-button';
import { useQuotationMessages } from '@/lib/hooks/useQuotationMessages';
import { QuotationActivityFeed } from '@/components/quotations/quotation-activity-feed';
import { QuotationMessageBlock } from '@/components/quotations/quotation-message-block';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

// Import the componentized parts
import { QuotationDetailsApprovalPanel } from '@/components/quotations/quotation-details/approval-panel';
import { PriceDetails } from '@/components/quotations/quotation-details/price-details';

interface QuotationDetailsProps {
  quotation: Quotation & {
    quotation_items: QuotationItem[];
    customers?: {
      name: string;
      email: string;
      phone?: string;
    }
  };
  isOrganizationMember?: boolean;
}

// Interface for time-based rules
interface TimeBasedRule {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  adjustment_percentage: number;
  applicable_days: number[];
  priority: number;
  is_active: boolean;
  category_id?: string;
  service_type_id?: string;
}

// Interface for enhanced quotation item with time adjustments
interface EnhancedQuotationItem extends QuotationItem {
  time_based_adjustment?: number;
  time_based_rule_name?: string;
}

export function QuotationDetails({ quotation, isOrganizationMember = true }: QuotationDetailsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(quotation?.display_currency || quotation?.currency || 'JPY');
  const [shouldMoveToMainContent, setShouldMoveToMainContent] = useState(false);
  
  // Add state for packages, promotions, and time-based pricing
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<PricingPromotion | null>(null);
  const [appliedTimeBasedRules, setAppliedTimeBasedRules] = useState<any[]>([]);
  const [loadingPricingDetails, setLoadingPricingDetails] = useState(true);
  
  const { approveQuotation, rejectQuotation, sendQuotation, updateQuotation, getPricingPackages, getPricingPromotions } = useQuotationService();

  // Add the messages hook
  const {
    activities,
    messages,
    isLoadingActivities,
    isLoadingMessages,
    sendMessage,
    refreshActivities,
    refreshMessages
  } = useQuotationMessages(quotation.id);

  // Load packages, promotions, and time-based pricing data
  useEffect(() => {
    const loadPricingDetails = async () => {
      setLoadingPricingDetails(true);
      try {
        // Check if quotation has a package ID or promotion code
        const packageId = (quotation as any).package_id || (quotation as any).pricing_package_id || (quotation as any).selected_package_id;
        const promotionCode = (quotation as any).promotion_code || (quotation as any).applied_promotion_code || (quotation as any).selected_promotion_code;
        
        // Load package if available
        if (packageId) {
          try {
            const packages = await getPricingPackages(false, true);
            const foundPackage = packages.find(pkg => pkg.id === packageId);
            if (foundPackage) {
              setSelectedPackage(foundPackage);
            }
          } catch (error) {
            console.error('Error loading package:', error);
          }
        } else if ((quotation as any).selected_package_name) {
          // Create a temporary package object from stored data
          setSelectedPackage({
            id: (quotation as any).selected_package_id || 'stored-package',
            name: (quotation as any).selected_package_name,
            description: (quotation as any).selected_package_description || '',
            package_type: 'bundle' as PackageType,
            base_price: (quotation as any).package_discount || 0,
            currency: 'JPY',
            is_featured: false,
            is_active: true,
            sort_order: 0,
            created_at: '',
            updated_at: '',
            items: []
          } as any);
        }
        
        // Load promotion if available
        if (promotionCode) {
          try {
            const promotions = await getPricingPromotions(false);
            const foundPromotion = promotions.find(promo => promo.code === promotionCode);
            if (foundPromotion) {
              setSelectedPromotion(foundPromotion);
            }
          } catch (error) {
            console.error('Error loading promotion:', error);
          }
        } else if ((quotation as any).selected_promotion_name) {
          // Create a temporary promotion object from stored name
          setSelectedPromotion({
            id: (quotation as any).selected_promotion_id || 'stored-promotion',
            name: (quotation as any).selected_promotion_name,
            code: (quotation as any).selected_promotion_code || 'APPLIED',
            description: (quotation as any).selected_promotion_description || '',
            discount_type: 'percentage',
            discount_value: 0,
            is_active: true,
            created_at: '',
            updated_at: ''
          } as any);
        }
        
        // Load time-based pricing rules if pickup date and time are available
        if (quotation.pickup_date && quotation.pickup_time) {
          try {
            const response = await fetch('/api/admin/pricing/time-based-rules?active_only=true');
            if (response.ok) {
              const allRules = await response.json();
              
              // Filter rules that would apply to this quotation
              const pickupDateTime = new Date(`${quotation.pickup_date}T${quotation.pickup_time}`);
              const dayOfWeek = pickupDateTime.getDay();
              const timeOfDay = pickupDateTime.getHours() * 60 + pickupDateTime.getMinutes();
              
              const applicableRules = allRules.filter((rule: TimeBasedRule) => {
                if (!rule.is_active) return false;
                
                // Check if rule applies to this day
                const applicableDays = rule.applicable_days || [];
                if (applicableDays.length > 0 && !applicableDays.includes(dayOfWeek)) {
                  return false;
                }
                
                // Check if rule applies to this time
                if (rule.start_time && rule.end_time) {
                  const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
                  const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
                  
                  const startTime = startHours * 60 + startMinutes;
                  const endTime = endHours * 60 + endMinutes;
                  
                  // Handle overnight time ranges
                  if (startTime > endTime) {
                    return timeOfDay >= startTime || timeOfDay <= endTime;
                  } else {
                    return timeOfDay >= startTime && timeOfDay <= endTime;
                  }
                }
                
                return true;
              });
              
              setAppliedTimeBasedRules(applicableRules);
            }
          } catch (error) {
            console.error('Error loading time-based rules:', error);
          }
        }
      } catch (error) {
        console.error('Error loading pricing details:', error);
      } finally {
        setLoadingPricingDetails(false);
      }
    };
    
    loadPricingDetails();
  }, [
    quotation.id, 
    (quotation as any).package_id, 
    (quotation as any).promotion_code, 
    (quotation as any).selected_package_name, 
    (quotation as any).selected_promotion_name, 
    quotation.pickup_date, 
    quotation.pickup_time
  ]);

  // Format quotation number with JPDR prefix and padding
  const formattedQuoteNumber = `JPDR-${quotation?.quote_number?.toString().padStart(4, '0') || 'N/A'}`;

  // Format currency with the appropriate locale and symbol
  const formatCurrency = (amount: number | string | undefined, currency: string = selectedCurrency) => {
    if (amount === undefined) return `¥0`;
    
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

    // Convert amount to selected currency
    const convertedAmount = numericAmount * (exchangeRates[currency] / exchangeRates['JPY']);
    
    // Format based on currency
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
    // Use locale and currency code for others
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(convertedAmount);
  };

  // Check if the quotation is expired
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  // Get status badge based on the quotation status
  const getStatusBadge = (status: QuotationStatus, expiryDate: string) => {
    // If status is draft or sent and the quotation is expired, show expired badge
    if ((status === 'draft' || status === 'sent') && isExpired(expiryDate)) {
      return (
        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20">
          {t('quotations.status.expired')}
        </Badge>
      );
    }

    // Otherwise, show the actual status
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-900/20">
            {t('quotations.status.draft')}
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            {t('quotations.status.sent')}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50 dark:bg-green-900/20">
            {t('quotations.status.approved')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20">
            {t('quotations.status.rejected')}
          </Badge>
        );
      case 'converted':
        return (
          <Badge variant="outline" className="text-purple-500 border-purple-200 bg-purple-50 dark:bg-purple-900/20">
            {t('quotations.status.converted')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            {status}
          </Badge>
        );
    }
  };

  // Go back to quotations list
  const handleBack = () => {
    router.push('/quotations');
  };

  // Send the quotation to the customer
  const handleSend = async () => {
    setIsLoading(true);
    try {
      const success = await sendQuotation(quotation.id);
      if (success) {
        toast({
          title: t('quotations.notifications.sendSuccess'),
          variant: 'default',
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: t('quotations.notifications.error'),
        description: 'Failed to send quotation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fix helper functions for calculating amounts
  const calculateDiscountAmount = (amount: number | string, discountPercentage: number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numericAmount * (discountPercentage / 100);
  };

  const calculateSubtotalAmount = (amount: number | string, discountPercentage: number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const discountAmount = calculateDiscountAmount(numericAmount, discountPercentage);
    return numericAmount - discountAmount;
  };

  const calculateTaxAmount = (subtotalAmount: number | string, taxPercentage: number) => {
    const numericSubtotal = typeof subtotalAmount === 'string' ? parseFloat(subtotalAmount) : subtotalAmount;
    return numericSubtotal * (taxPercentage / 100);
  };

  // Function to handle both refreshing activities and messages
  const handleRefreshActivityFeed = () => {
    refreshActivities();
    refreshMessages();
  };

  // Add scroll handler for approval positioning
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight / 2) {
        setShouldMoveToMainContent(true);
      } else {
        setShouldMoveToMainContent(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [quotation.id]);

  // Handler for currency change that updates the database
  const handleCurrencyChange = async (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    
    // Save the selected currency to the database
    try {
      await updateQuotation(quotation.id, {
        display_currency: newCurrency
      });
    } catch (error) {
      console.error('Error updating display currency:', error);
      toast({
        title: t('quotations.notifications.error'),
        description: 'Failed to update currency preference',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Revamped Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left side - Quotation info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold mb-2 break-words">
                    {quotation.title || t('quotations.details.untitled')}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                    <p className="text-muted-foreground">
                      {t('quotations.details.quotationNumber', { defaultValue: 'Quotation Number #{id}' }).replace('{id}', formattedQuoteNumber)}
                    </p>
                    {getStatusBadge(quotation.status, quotation.expiry_date)}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Created</span>
                      <span className="font-medium">
                        {quotation.created_at ? format(parseISO(quotation.created_at), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Expires</span>
                      <span className="font-medium">
                        {quotation.expiry_date ? format(parseISO(quotation.expiry_date), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total</span>
                      {(() => {
                        const calculateTotals = () => {
                          const serviceTotal = quotation.quotation_items?.reduce((total, item) => total + (item.total_price || item.unit_price), 0) || 0;
                          const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
                          const baseTotal = serviceTotal + packageTotal;
                          
                          const discountPercentage = quotation.discount_percentage || 0;
                          const taxPercentage = quotation.tax_percentage || 0;
                          
                          const promotionDiscount = selectedPromotion ? 
                            (selectedPromotion.discount_type === 'percentage' ? 
                              baseTotal * (selectedPromotion.discount_value / 100) : 
                              selectedPromotion.discount_value) : 0;
                          
                          const regularDiscount = baseTotal * (discountPercentage / 100);
                          const totalDiscount = promotionDiscount + regularDiscount;
                          
                          const subtotal = Math.max(0, baseTotal - totalDiscount);
                          const taxAmount = subtotal * (taxPercentage / 100);
                          const finalTotal = subtotal + taxAmount;
                          
                          return finalTotal;
                        };
                        
                        const total = calculateTotals();
                        return (
                          <span className="font-bold text-lg">
                            {formatCurrency(total)}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <QuotationPdfButton quotation={quotation} onSuccess={() => router.refresh()} />
              
              {isOrganizationMember && quotation.status === 'draft' && (
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mail className="h-4 w-4" />
                  {t('quotations.actions.send')}
                </Button>
              )}
              
              {isOrganizationMember && (
                <Button variant="outline" asChild className="gap-2">
                  <Link href={`/quotations/${quotation.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    {t('quotations.actions.edit')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
        {/* Main Content - 2 columns on XL screens, full width on smaller */}
        <div className="xl:col-span-2 space-y-4 xl:space-y-6">
          <Card>
            <CardContent className="pt-6">
              {/* Customer Information - Clean Design */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-semibold">{t('quotations.details.customerInfo')}</h2>
                </div>
                
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Contact Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-muted">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{t('quotations.details.contactInfo')}</h3>
                            <p className="text-sm text-muted-foreground">{t('quotations.details.primaryContact')}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.customerName')}</span>
                              <div className="font-semibold">{quotation.customer_name || t('common.notAvailable')}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.email')}</span>
                              <div className="font-semibold">{quotation.customer_email}</div>
                            </div>
                          </div>
                          
                          {quotation.customer_phone && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.phone')}</span>
                                <div className="font-semibold">{quotation.customer_phone}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Billing Address if available */}
                      {(quotation.billing_company_name || 
                        quotation.billing_tax_number || 
                        quotation.billing_street_name || 
                        quotation.billing_city ||
                        quotation.billing_country) && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-muted">
                              <Building className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{t('quotations.details.billingAddress')}</h3>
                              <p className="text-sm text-muted-foreground">{t('quotations.details.invoicingDetails')}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {quotation.billing_company_name && (
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.companyName')}</span>
                                  <div className="font-semibold">{quotation.billing_company_name}</div>
                                </div>
                              </div>
                            )}
                            
                            {quotation.billing_tax_number && (
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.taxId')}</span>
                                  <div className="font-semibold">{quotation.billing_tax_number}</div>
                                </div>
                              </div>
                            )}
                            
                            {(quotation.billing_street_name || quotation.billing_city || quotation.billing_country) && (
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.address')}</span>
                                  <div className="space-y-0.5 text-sm">
                                    {quotation.billing_street_name && (
                                      <div className="font-medium">
                                        {quotation.billing_street_name} {quotation.billing_street_number || ''}
                                      </div>
                                    )}
                                    {(quotation.billing_city || quotation.billing_state || quotation.billing_postal_code) && (
                                      <div>
                                        {quotation.billing_city}
                                        {quotation.billing_state && quotation.billing_city ? `, ${quotation.billing_state}` : quotation.billing_state}
                                        {quotation.billing_postal_code && (quotation.billing_city || quotation.billing_state) ? ' ' : ''}
                                        {quotation.billing_postal_code}
                                      </div>
                                    )}
                                    {quotation.billing_country && <div className="font-medium">{quotation.billing_country}</div>}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* If no billing address, show a placeholder */}
                      {!(quotation.billing_company_name || 
                        quotation.billing_tax_number || 
                        quotation.billing_street_name || 
                        quotation.billing_city ||
                        quotation.billing_country) && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-muted">
                              <Building className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{t('quotations.details.billingAddress')}</h3>
                              <p className="text-sm text-muted-foreground">{t('quotations.details.noBillingInfo')}</p>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                            <p className="text-sm text-muted-foreground text-center">
                              {t('quotations.details.noBillingAddress')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Separator className="my-6" />
              
              {/* Service Information - Fixed Container */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <Car className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-semibold">{t('quotations.details.serviceInfo')}</h2>
                </div>
                
                {quotation.quotation_items && quotation.quotation_items.length > 0 ? (
                  <div className="space-y-4">
                    {quotation.quotation_items.length === 1 ? (
                      // Single service display - Clean Design
                      <Card>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Service Details */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  quotation.quotation_items[0].service_type_name?.toLowerCase().includes('charter') 
                                    ? "bg-blue-100 dark:bg-blue-900/30" 
                                    : "bg-emerald-100 dark:bg-emerald-900/30"
                                )}>
                                  <Car className={cn(
                                    "h-4 w-4",
                                    quotation.quotation_items[0].service_type_name?.toLowerCase().includes('charter') 
                                      ? "text-blue-600 dark:text-blue-400" 
                                      : "text-emerald-600 dark:text-emerald-400"
                                  )} />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{t('quotations.details.serviceDetails')}</h3>
                                  <p className="text-sm text-muted-foreground">{t('quotations.details.serviceConfiguration')}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.serviceType')}</span>
                                  <Badge variant="secondary" className="font-medium">
                                    {quotation.quotation_items[0].service_type_name || quotation.service_type || t('common.notAvailable')}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.vehicleType')}</span>
                                  <span className="font-semibold">
                                    {quotation.quotation_items[0].vehicle_type || quotation.vehicle_type || t('common.notAvailable')}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.serviceDuration')}</span>
                                  <div className="text-right">
                                    <div className="font-semibold">
                                      {quotation.quotation_items[0].hours_per_day || quotation.quotation_items[0].duration_hours || 1} {t('quotations.details.hours')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {quotation.quotation_items[0].service_days || 1} {t('quotations.details.days')} {t('quotations.details.total')}
                                    </div>
                                  </div>
                                </div>

                                {quotation.passenger_count && (
                                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.passengerCount')}</span>
                                    <div className="flex items-center gap-1">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold">{quotation.passenger_count}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Schedule Details */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{t('quotations.details.schedule')}</h3>
                                  <p className="text-sm text-muted-foreground">{t('quotations.details.serviceSchedule')}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.pickupDate')}</span>
                                  <div className="text-right">
                                    <div className="font-semibold">
                                      {quotation.pickup_date ? format(parseISO(quotation.pickup_date), 'MMM dd, yyyy') : t('common.notAvailable')}
                                    </div>
                                    {quotation.pickup_date && (
                                      <div className="text-xs text-muted-foreground">
                                        {format(parseISO(quotation.pickup_date), 'EEEE')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.pickupTime')}</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{quotation.pickup_time || t('common.notAvailable')}</span>
                                  </div>
                                </div>
                                
                                {quotation.quotation_items[0].description && (
                                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{t('quotations.details.serviceDescription')}</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">{quotation.quotation_items[0].description}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      // Multiple services display - Fixed Container
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{t('quotations.details.multipleServices')}</h3>
                            <p className="text-sm text-muted-foreground">
                              {quotation.quotation_items.length} services selected
                            </p>
                          </div>
                          <Badge variant="outline" className="px-3 py-1">
                            {quotation.quotation_items.length} services
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {quotation.quotation_items.map((item, index) => (
                            <Card key={item.id || index} className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant={
                                        item.service_type_name?.toLowerCase().includes('charter') ? "default" : "secondary"
                                      } className="text-xs flex-shrink-0">
                                        {item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                                      </Badge>
                                      <span className="font-medium truncate">{item.description}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                      <span><strong>Vehicle:</strong> {item.vehicle_type}</span>
                                      <span>
                                        <strong>Duration:</strong> {
                                          item.service_type_name?.toLowerCase().includes('charter') 
                                            ? `${item.service_days || 1} day(s) × ${item.hours_per_day || 8}h`
                                            : `${item.duration_hours || 1} hour(s)`
                                        }
                                      </span>
                                      {item.pickup_date && (
                                        <span><strong>Date:</strong> {format(new Date(item.pickup_date), 'MMM d')}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="font-bold text-lg">{formatCurrency(item.total_price || item.unit_price)}</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Fallback display if no items (legacy format) - Clean
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/30">
                              <Car className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-lg">{t('quotations.details.serviceDetails')}</h3>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.serviceType')}</span>
                              <span className="font-semibold">{quotation.service_type || t('quotations.details.charterHourly')}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.vehicleType')}</span>
                              <span className="font-semibold">{quotation.vehicle_type || t('quotations.details.mercedesVClass')}</span>
                            </div>
                            
                            {(quotation.duration_hours || quotation.service_days) && (
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.duration')}</span>
                                <div className="text-right">
                                  <div className="font-semibold">
                                    {quotation.duration_hours && `${quotation.duration_hours} ${t('quotations.details.hours')}`}
                                    {quotation.duration_hours && quotation.service_days && ' × '}
                                    {quotation.service_days && `${quotation.service_days} ${t('quotations.details.days')}`}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                                                                              <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-muted">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">{t('quotations.details.schedule')}</h3>
                              </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.pickupDate')}</span>
                              <span className="font-semibold">
                                {quotation.pickup_date ? format(parseISO(quotation.pickup_date), 'MMM dd, yyyy') : t('common.notAvailable')}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.pickupTime')}</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{quotation.pickup_time || t('common.notAvailable')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <Separator className="my-6" />
              
              {/* Packages, Promotions, and Time-based Pricing Section */}
              {(selectedPackage || selectedPromotion || appliedTimeBasedRules.length > 0) && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <Tag className="h-5 w-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">{t('quotations.details.pricingFeatures') || 'Applied Pricing Features'}</h2>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      {/* Package Information */}
                      {selectedPackage && (
                        <Card className="border border-purple-200 dark:border-purple-800">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold">
                                    {t('quotations.details.packageSelected') || 'Package Selected'}
                                  </h3>
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                    {selectedPackage.package_type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{t('quotations.details.specialOffer')}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-base mb-1">{selectedPackage.name}</h4>
                              <p className="text-sm text-muted-foreground">{selectedPackage.description}</p>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                {t('quotations.details.packagePrice') || 'Package Price'}
                              </span>
                              <span className="font-bold text-lg">
                                {formatCurrency(selectedPackage.base_price)}
                              </span>
                            </div>
                            
                            {selectedPackage.items && selectedPackage.items.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-1 w-8 bg-muted rounded"></div>
                                  <p className="text-xs font-medium text-muted-foreground">
                                    {t('quotations.details.includedServices') || 'Included Services'}
                                  </p>
                                </div>
                                <div className="space-y-1.5">
                                  {selectedPackage.items.slice(0, 3).map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-xs bg-muted/30 p-2 rounded">
                                      <span>• {item.name}</span>
                                      <span className="font-medium">{formatCurrency(item.price)}</span>
                                    </div>
                                  ))}
                                  {selectedPackage.items.length > 3 && (
                                    <div className="text-center">
                                      <Badge variant="outline" className="text-xs">
                                        +{selectedPackage.items.length - 3} {t('quotations.details.moreServices') || 'more services'}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Promotion Information */}
                      {selectedPromotion && (
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg">
                                <Gift className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold">
                                    {t('quotations.details.promotionApplied') || 'Promotion Applied'}
                                  </h3>
                                  <Badge variant="secondary" className="font-mono">
                                    {selectedPromotion.code}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{t('quotations.details.discountApplied')}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-base mb-1">{selectedPromotion.name}</h4>
                              <p className="text-sm text-muted-foreground">{selectedPromotion.description}</p>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                {t('quotations.details.discount') || 'Discount Value'}
                              </span>
                              <div className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                                <span className="font-bold text-lg">
                                  {selectedPromotion.discount_type === 'percentage' 
                                    ? `${selectedPromotion.discount_value}%`
                                    : formatCurrency(selectedPromotion.discount_value)
                                  }
                                </span>
                              </div>
                            </div>
                            
                            {((selectedPromotion as any).valid_from || selectedPromotion.start_date || (selectedPromotion as any).valid_to || selectedPromotion.end_date) && (
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {(selectedPromotion.start_date && selectedPromotion.end_date) ? (
                                    <span>{t('quotations.details.validPeriod')}: {format(new Date(selectedPromotion.start_date), 'MMM d')} - {format(new Date(selectedPromotion.end_date), 'MMM d, yyyy')}</span>
                                  ) : selectedPromotion.end_date ? (
                                    <span>{t('quotations.details.validUntil')}: {format(new Date(selectedPromotion.end_date), 'MMM d, yyyy')}</span>
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    {/* Time-based Pricing Rules - Simplified */}
                    {appliedTimeBasedRules.length > 0 && (
                      <Card className="mt-4">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            <h3 className="font-medium">
                              {t('quotations.details.timeBasedPricing') || 'Time-Based Pricing'}
                            </h3>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Pricing adjustments based on pickup time and demand.
                          </p>
                          
                          <div className="space-y-2">
                            {appliedTimeBasedRules.map((rule, index) => (
                              <div key={rule.id || index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <div>
                                  <span className="font-medium text-sm">{rule.name}</span>
                                  <div className="text-xs text-muted-foreground">
                                    {rule.start_time} - {rule.end_time}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {rule.adjustment_percentage > 0 ? '+' : ''}{rule.adjustment_percentage}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <Separator className="my-6" />
                </>
              )}
              
              {/* Enhanced Price Details */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-semibold">{t('quotations.details.pricingSummary')}</h2>
                </div>
                
                {(() => {
                  const calculateTotals = () => {
                    // Calculate service totals including time-based adjustments
                    let serviceBaseTotal = 0;
                    let serviceTimeAdjustment = 0;
                    
                    if (quotation.quotation_items && quotation.quotation_items.length > 0) {
                      quotation.quotation_items.forEach(item => {
                        const itemBasePrice = item.unit_price * (item.service_days || 1);
                        serviceBaseTotal += itemBasePrice;
                        
                        // Check for time-based adjustment on this item
                        if ((item as any).time_based_adjustment) {
                          const timeAdjustment = itemBasePrice * ((item as any).time_based_adjustment / 100);
                          serviceTimeAdjustment += timeAdjustment;
                        }
                      });
                    }
                    
                    const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
                    const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
                    const baseTotal = serviceTotal + packageTotal;
                    
                    const discountPercentage = quotation.discount_percentage || 0;
                    const taxPercentage = quotation.tax_percentage || 0;
                    
                    const promotionDiscount = selectedPromotion ? 
                      (selectedPromotion.discount_type === 'percentage' ? 
                        baseTotal * (selectedPromotion.discount_value / 100) : 
                        selectedPromotion.discount_value) : 0;
                    
                    const regularDiscount = baseTotal * (discountPercentage / 100);
                    const totalDiscount = promotionDiscount + regularDiscount;
                    
                    const subtotal = Math.max(0, baseTotal - totalDiscount);
                    const taxAmount = subtotal * (taxPercentage / 100);
                    const finalTotal = subtotal + taxAmount;
                    
                    return {
                      serviceBaseTotal,
                      serviceTimeAdjustment,
                      serviceTotal,
                      packageTotal,
                      baseTotal,
                      promotionDiscount,
                      regularDiscount,
                      totalDiscount,
                      subtotal,
                      taxAmount,
                      finalTotal
                    };
                  };

                  const totals = calculateTotals();
                  
                  return (
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Calculator className="h-4 w-4" />
                              {t('quotations.details.pricingBreakdown')}
                            </CardTitle>
                            <CardDescription>
                              {t('quotations.details.detailedBreakdown')}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                              <SelectTrigger className="w-[110px] h-8">
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
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Services Breakdown */}
                        {quotation.quotation_items && quotation.quotation_items.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm font-medium border-b pb-2">
                              <span>{t('quotations.details.selectedServices')} ({quotation.quotation_items.length})</span>
                              <span className="font-semibold">{formatCurrency(totals.serviceTotal)}</span>
                            </div>
                            {quotation.quotation_items.map((item, index) => {
                              const itemBasePrice = item.unit_price * (item.service_days || 1);
                              const timeAdjustment = (item as any).time_based_adjustment ? 
                                itemBasePrice * ((item as any).time_based_adjustment / 100) : 0;
                              
                              return (
                                <div key={index} className="bg-muted/30 rounded-lg p-3 border">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={
                                          item.service_type_name?.toLowerCase().includes('charter') ? "default" : "secondary"
                                        } className="text-xs">
                                          {item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                                        </Badge>
                                        <span className="font-medium text-sm">{item.description}</span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span className="font-medium">Vehicle:</span>
                                        <span>{item.vehicle_type}</span>
                                        
                                        {item.service_type_name?.toLowerCase().includes('charter') ? (
                                          <>
                                            <span className="font-medium">Duration:</span>
                                            <span className="font-medium text-blue-600">
                                              {item.service_days} day{item.service_days !== 1 ? 's' : ''} × {item.hours_per_day}h/day
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="font-medium">Duration:</span>
                                            <span>{item.duration_hours} hour(s)</span>
                                          </>
                                        )}
                                        
                                        {item.pickup_date && (
                                          <>
                                            <span className="font-medium">Date:</span>
                                            <span>{format(new Date(item.pickup_date), 'MMM d, yyyy')}</span>
                                          </>
                                        )}
                                        
                                        {item.pickup_time && (
                                          <>
                                            <span className="font-medium">Time:</span>
                                            <span>{item.pickup_time}</span>
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Show time-based adjustment breakdown for this item */}
                                      {timeAdjustment !== 0 && (
                                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border">
                                          <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Base Price:</span>
                                              <span>{formatCurrency(itemBasePrice)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className={cn(
                                                "flex items-center gap-1",
                                                timeAdjustment > 0 ? "text-orange-600" : "text-green-600"
                                              )}>
                                                <Timer className="h-3 w-3" />
                                                Time Adjustment ({(item as any).time_based_adjustment}%)
                                              </span>
                                              <span className={cn(
                                                timeAdjustment > 0 ? "text-orange-600" : "text-green-600"
                                              )}>
                                                {timeAdjustment > 0 ? '+' : ''}{formatCurrency(timeAdjustment)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="font-semibold">{formatCurrency(item.total_price || item.unit_price)}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Package Information */}
                        {selectedPackage && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm font-medium text-purple-600 border-b border-purple-200 pb-2">
                              <span>{t('quotations.details.selectedPackage')}: {selectedPackage.name}</span>
                              <span className="font-semibold">{formatCurrency(selectedPackage.base_price)}</span>
                            </div>
                          </div>
                        )}
                        
                        <Separator className="my-4" />
                        
                        {/* Services Base Total */}
                        {totals.serviceBaseTotal > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Services Base Total</span>
                            <span>{formatCurrency(totals.serviceBaseTotal)}</span>
                          </div>
                        )}
                        
                        {/* Time-based Adjustments */}
                        {totals.serviceTimeAdjustment !== 0 && (
                          <div className="flex justify-between text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                            <span className="flex items-center gap-2">
                              <Timer className="h-4 w-4" />
                              Time-based Service Adjustments
                            </span>
                            <span>{totals.serviceTimeAdjustment > 0 ? '+' : ''}{formatCurrency(totals.serviceTimeAdjustment)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-base font-semibold bg-muted/50 p-3 rounded">
                          <span>{t('quotations.details.subtotal')}</span>
                          <span>{formatCurrency(totals.baseTotal)}</span>
                        </div>
                        
                        {/* Discounts */}
                        {(totals.promotionDiscount > 0 || totals.regularDiscount > 0) && (
                          <div className="space-y-2">
                            {totals.promotionDiscount > 0 && (
                              <div className="flex justify-between text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <span className="flex items-center gap-2">
                                  <Gift className="h-4 w-4" />
                                  {t('quotations.details.promotionDiscount')} ({selectedPromotion?.name})
                                </span>
                                <span className="font-medium">-{formatCurrency(totals.promotionDiscount)}</span>
                              </div>
                            )}
                            
                            {totals.regularDiscount > 0 && (
                              <div className="flex justify-between text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                <span className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  {t('quotations.details.discount')} ({quotation.discount_percentage || 0}%)
                                </span>
                                <span className="font-medium">-{formatCurrency(totals.regularDiscount)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {totals.totalDiscount > 0 && (
                          <>
                            <Separator />
                            <div className="flex justify-between text-sm font-medium">
                              <span>After Discounts</span>
                              <span>{formatCurrency(totals.subtotal)}</span>
                            </div>
                          </>
                        )}
                        
                        {(quotation.tax_percentage || 0) > 0 && (
                          <div className="flex justify-between text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            <span className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              {t('quotations.details.tax')} ({quotation.tax_percentage || 0}%)
                            </span>
                            <span className="font-medium">+{formatCurrency(totals.taxAmount)}</span>
                          </div>
                        )}
                        
                        <Separator className="my-4" />
                        
                        {/* Total Savings */}
                        {totals.totalDiscount > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Savings</span>
                              <span className="text-sm font-bold text-green-700 dark:text-green-300">{formatCurrency(totals.totalDiscount)}</span>
                            </div>
                            <Progress 
                              value={Math.min((totals.totalDiscount / totals.baseTotal) * 100, 100)} 
                              className="h-2"
                            />
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {((totals.totalDiscount / totals.baseTotal) * 100).toFixed(1)}% savings
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-green-700 dark:text-green-300">{t('quotations.details.totalAmount')}</span>
                            <span className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.finalTotal)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

              {/* Time-based Pricing - Simplified */}
              {quotation.quotation_items?.some(item => 
                (item as any).time_based_adjustment !== undefined && (item as any).time_based_adjustment !== 0
              ) && (
                <>
                  <Separator className="my-6" />
                  <div className="mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          <CardTitle className="text-base">
                            {t('quotations.details.timePricing.title') || 'Time-based Pricing'}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Pricing adjustments applied based on service timing.
                        </p>
                        
                        <div className="space-y-3">
                          {quotation.quotation_items
                            ?.filter(item => (item as any).time_based_adjustment !== undefined && (item as any).time_based_adjustment !== 0)
                            .map((item, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium text-sm">{item.description}</div>
                                    {(item.pickup_date || item.pickup_time) && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {item.pickup_date && format(new Date(item.pickup_date), 'MMM d, yyyy')}
                                        {item.pickup_date && item.pickup_time && ' at '}
                                        {item.pickup_time && format(new Date(`2024-01-01T${item.pickup_time}`), 'h:mm a')}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {(item as any).time_based_adjustment > 0 ? '+' : ''}{(item as any).time_based_adjustment}%
                                  </Badge>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Base Price:</span>
                                  <span>{formatCurrency(item.unit_price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Time Adjustment:</span>
                                  <span>
                                    {((item as any).time_based_adjustment || 0) > 0 ? '+' : ''}{formatCurrency((item.unit_price * (item.service_days || 1)) * Math.abs((item as any).time_based_adjustment || 0) / 100)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm font-medium pt-2 border-t mt-2">
                                  <span>Final Price:</span>
                                  <span>{formatCurrency(item.total_price || item.unit_price)}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
              
              {/* Conditional Approval Panel placement - under price details when scrolled */}
              {shouldMoveToMainContent && ['draft', 'sent'].includes(quotation.status) && (
                <div className="mt-6">
                  <QuotationDetailsApprovalPanel 
                    quotationId={quotation.id}
                    isProcessing={isLoading}
                    onApprove={async (notes) => {
                      setIsLoading(true);
                      try {
                        const success = await approveQuotation({
                          quotation_id: quotation.id,
                          notes: notes
                        });
                        if (success) {
                          toast({
                            title: t('quotations.notifications.approveSuccess'),
                            variant: 'default',
                          });
                          router.refresh();
                        }
                      } catch (error) {
                        console.error('Error approving quotation:', error);
                        toast({
                          title: t('quotations.notifications.error'),
                          description: 'Failed to approve quotation',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    onReject={async (reason) => {
                      setIsLoading(true);
                      try {
                        const success = await rejectQuotation({
                          quotation_id: quotation.id,
                          rejected_reason: reason
                        });
                        if (success) {
                          toast({
                            title: t('quotations.notifications.rejectSuccess'),
                            variant: 'default',
                          });
                          router.refresh();
                        }
                      } catch (error) {
                        console.error('Error rejecting quotation:', error);
                        toast({
                          title: t('quotations.notifications.error'),
                          description: 'Failed to reject quotation',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  />
                </div>
              )}
              
              {/* Customer Notes and Merchant Notes sections */}
              {(quotation.customer_notes || quotation.merchant_notes) && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <div className="flex items-center mb-4">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">{t('quotations.details.notesAndTerms')}</h2>
                    </div>
                    <div className="space-y-6">
                      {quotation.customer_notes && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            {t('quotations.details.notes') || 'Notes'}
                          </h3>
                          <div className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-muted/30">
                            {quotation.customer_notes}
                          </div>
                        </div>
                      )}
                      
                      {quotation.merchant_notes && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            {t('quotations.details.termsAndConditions') || 'Terms and Conditions'}
                          </h3>
                          <div className="text-sm whitespace-pre-wrap">
                            {quotation.merchant_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Message Block - Clean */}
          {quotation.status !== 'approved' && (
            <Card className="mt-8 lg:mt-12">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {t('quotations.messageBlock.title') || 'Conversation'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Messages and updates</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <QuotationMessageBlock 
                  messages={messages}
                  isLoading={isLoadingMessages}
                  onSendMessage={sendMessage}
                />
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar - Enhanced */}
        <div className="xl:col-span-1 space-y-4 xl:space-y-6">
          {/* Quotation Info Card - Clean */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('quotations.details.info') || 'Quotation Information'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Status and details</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <span className="text-sm font-medium text-muted-foreground">{t('quotations.details.status')}</span>
                {getStatusBadge(quotation.status, quotation.expiry_date)}
              </div>
              
              {quotation.status === 'sent' && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    {isExpired(quotation.expiry_date)
                      ? (t('quotations.details.expired') || "Expired on {date}").replace('{date}', format(new Date(quotation.expiry_date), 'PPP'))
                      : (t('quotations.details.validUntil') || "Valid until {date}").replace('{date}', format(new Date(quotation.expiry_date), 'PPP'))}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.created')}</span>
                    <div className="font-semibold">{format(parseISO(quotation.created_at), 'PPP')}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.expiry')}</span>
                    <div className="font-semibold">{format(parseISO(quotation.expiry_date), 'PPP')}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground font-medium">{t('quotations.details.validFor')}</span>
                    <div className="font-semibold">
                      2 {t('quotations.details.days')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          

          {/* Default Approval Panel placement - in sidebar above activity feed */}
          {!shouldMoveToMainContent && ['draft', 'sent'].includes(quotation.status) && (
            <div className="mt-4 xl:mt-6">
              <QuotationDetailsApprovalPanel 
                quotationId={quotation.id}
                isProcessing={isLoading}
                onApprove={async (notes) => {
                  setIsLoading(true);
                  try {
                    const success = await approveQuotation({
                      quotation_id: quotation.id,
                      notes: notes
                    });
                    if (success) {
                      toast({
                        title: t('quotations.notifications.approveSuccess'),
                        variant: 'default',
                      });
                      router.refresh();
                    }
                  } catch (error) {
                    console.error('Error approving quotation:', error);
                    toast({
                      title: t('quotations.notifications.error'),
                      description: 'Failed to approve quotation',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                onReject={async (reason) => {
                  setIsLoading(true);
                  try {
                    const success = await rejectQuotation({
                      quotation_id: quotation.id,
                      rejected_reason: reason
                    });
                    if (success) {
                      toast({
                        title: t('quotations.notifications.rejectSuccess'),
                        variant: 'default',
                      });
                      router.refresh();
                    }
                  } catch (error) {
                    console.error('Error rejecting quotation:', error);
                    toast({
                      title: t('quotations.notifications.error'),
                      description: 'Failed to reject quotation',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </div>
          )}


          {/* Activity Feed - Clean */}
          <div className="mt-4 xl:mt-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">
                      {t('quotations.details.activityFeed') || 'Activity Feed'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Recent actions and updates</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshActivityFeed}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <QuotationActivityFeed 
                  activities={activities} 
                  isLoading={isLoadingActivities}
                  onRefresh={handleRefreshActivityFeed}
                />
              </CardContent>
            </Card>
          </div>

         
        </div>
      </div>
    </div>
  );
} 