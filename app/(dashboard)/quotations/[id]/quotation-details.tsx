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
import { PricingSummary } from '@/components/quotations/quotation-details/pricing-summary';
import { QuotationInfoCard } from '@/components/quotations/quotation-details/quotation-info-card';
import { ServiceCard } from '@/components/quotations/service-card';

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
        const packageId = (quotation as any).selected_package_id || (quotation as any).package_id || (quotation as any).pricing_package_id;
        const promotionCode = (quotation as any).promotion_code || (quotation as any).applied_promotion_code || (quotation as any).selected_promotion_code;
        
        // Load package if available
        if (packageId) {
          console.log('Loading package with ID:', packageId);
          try {
            const packages = await getPricingPackages(false, true);
            console.log('Available packages:', packages.length);
            const foundPackage = packages.find(pkg => pkg.id === packageId);
            if (foundPackage) {
              console.log('Found package:', foundPackage.name, 'with items:', foundPackage.items?.length || 0);
              setSelectedPackage(foundPackage);
            } else {
              console.log('Package not found in available packages');
            }
          } catch (error) {
            console.error('Error loading package:', error);
          }
        } else {
          console.log('No package ID found in quotation. Checked fields:', {
            selected_package_id: (quotation as any).selected_package_id,
            package_id: (quotation as any).package_id,
            pricing_package_id: (quotation as any).pricing_package_id,
            selected_package_name: (quotation as any).selected_package_name
          });
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

  // Status badge logic moved to QuotationInfoCard component

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

  // Helper functions moved to PricingBreakdown component

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
                    <Badge variant="outline" className={
                      quotation.status === 'approved' ? "text-green-500 border-green-200 bg-green-50" :
                      quotation.status === 'sent' ? "text-blue-500 border-blue-200 bg-blue-50" :
                      quotation.status === 'rejected' ? "text-red-500 border-red-200 bg-red-50" :
                      quotation.status === 'converted' ? "text-purple-500 border-purple-200 bg-purple-50" :
                      "text-gray-500 border-gray-200 bg-gray-50"
                    }>
                      {t(`quotations.status.${quotation.status}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <QuotationPdfButton 
                quotation={quotation} 
                selectedPackage={selectedPackage} 
                selectedPromotion={selectedPromotion}
                onSuccess={() => router.refresh()} 
              />
              
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
              
              {/* Selected Services Section using ServiceCard */}
              {quotation.quotation_items && quotation.quotation_items.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <Car className="h-5 w-5 mr-2 text-primary" />
                    <h2 className="text-xl font-semibold">{t('quotations.details.selectedServices')} ({quotation.quotation_items.length})</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {quotation.quotation_items.map((item, index) => {
                      // Convert QuotationItem to ServiceItemInput format for ServiceCard
                      const serviceItem = {
                        description: item.description,
                        service_type_id: item.service_type_id || '',
                        service_type_name: item.service_type_name || '',
                        vehicle_category: item.vehicle_category as string || '',
                        vehicle_type: item.vehicle_type || '',
                        duration_hours: item.duration_hours || 1,
                        service_days: item.service_days || 1,
                        hours_per_day: item.hours_per_day || null,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                        quantity: item.quantity,
                        sort_order: item.sort_order || index,
                        is_service_item: item.is_service_item !== false,
                        pickup_date: item.pickup_date || null,
                        pickup_time: item.pickup_time || null,
                        time_based_adjustment: (item as any).time_based_adjustment,
                        time_based_rule_name: (item as any).time_based_rule_name,
                      };
                      
                      return (
                        <ServiceCard
                          key={item.id}
                          item={serviceItem}
                          index={index}
                          formatCurrency={formatCurrency}
                          packages={selectedPackage ? [selectedPackage] : []}
                          selectedPackage={selectedPackage}
                          showActions={false}
                        />
                      );
                    })}
                    
                    <div className="pt-2 pb-4 flex justify-between items-center font-medium text-sm border-t">
                      <span>Total Amount (before discount/tax):</span>
                      <span>{formatCurrency(quotation.quotation_items.reduce((total, item) => total + (item.total_price || item.unit_price), 0))}</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* ✅ NEW PRICING SUMMARY COMPONENT - Complete Revamp */}
              <div className="mb-6">
                <PricingSummary 
                  quotationItems={quotation.quotation_items || []}
                  selectedPackage={selectedPackage}
                  selectedPromotion={selectedPromotion}
                  discountPercentage={quotation.discount_percentage || 0}
                  taxPercentage={quotation.tax_percentage || 0}
                  selectedCurrency={selectedCurrency}
                  onCurrencyChange={handleCurrencyChange}
                  formatCurrency={formatCurrency}
                  appliedTimeBasedRules={appliedTimeBasedRules}
                />
              </div>


              
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
          {/* Quotation Info Card - Now Using Component */}
          <QuotationInfoCard 
            quotation={{
              id: quotation.id,
              status: quotation.status,
              quote_number: quotation.quote_number?.toString(),
              created_at: quotation.created_at,
              expiry_date: quotation.expiry_date,
              last_sent_at: (quotation as any).last_sent_at,
              reminder_sent_at: (quotation as any).reminder_sent_at
            }}
            onRefresh={() => router.refresh()}
          />
          

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