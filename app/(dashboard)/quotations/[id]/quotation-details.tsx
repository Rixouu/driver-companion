"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays } from 'date-fns';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Separator } from "@/components/ui/separator";
import { Progress } from '@/components/ui/progress';
import LoadingModal from '@/components/ui/loading-modal';
import { useProgressSteps } from '@/lib/hooks/use-progress-steps';
import { progressConfigs } from '@/lib/config/progressConfigs';
import { useCurrency } from '@/lib/services/currency-service';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { getQuotationUrl, getQuotationEditUrl } from '@/lib/utils/quotation-url';
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
  AlertTriangle,
  StickyNote,
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
  Eye,
  EyeOff,
  Receipt,
  Loader2,
  List,
  Plane,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Quotation, QuotationItem, QuotationStatus, PricingPackage, PricingPromotion, PackageType } from '@/types/quotations';
import { useQuotationService } from "@/lib/hooks/use-quotation-service";
import LoadingSpinner from '@/components/shared/loading-spinner';
import { QuotationPdfButton } from '@/components/quotations/quotation-pdf-button';
import { QuotationInvoiceButton } from '@/components/quotations/quotation-invoice-button';
import { SendReminderDialog } from '@/components/quotations/send-reminder-dialog';


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
import { QuotationShareButtons } from '@/components/quotations/quotation-share-buttons';
import { QuotationWorkflow } from '@/components/quotations/quotation-workflow/quotation-workflow';

import { Dialog, DialogTitle, DialogContent, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface QuotationDetailsProps {
  quotation: Quotation & {
    quotation_items: QuotationItem[];
    customers?: {
      name: string;
      email: string;
      phone?: string;
    };
    creator?: {
      id: string;
      full_name: string | null;
      email: string | null;
    } | null;
  };
  isOrganizationMember?: boolean;
}

// Helper function to process notes and convert literal \n to actual newlines
function processNotesText(text: string): string {
  if (!text) return '';
  // Convert literal \n strings to actual newlines
  return text.replace(/\\n/g, '\n');
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
  const workflowRef = useRef<{ openPaymentLinkDialog: () => void; openSendQuotationDialog: () => void }>(null);
  const { t } = useI18n();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(quotation?.display_currency || quotation?.currency || 'JPY');
  const [shouldMoveToMainContent, setShouldMoveToMainContent] = useState(false);
  
  // State for collapsible services
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  
  // Use dynamic currency service
  const { currencyData, isLoading: currencyLoading, formatCurrency: dynamicFormatCurrency, convertCurrency } = useCurrency('JPY');
  
  // Add state for packages, promotions, and time-based pricing
  
  // Toggle individual service expansion
  const toggleServiceExpansion = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };
  
  // Render compact service items list
  const renderCompactServiceItemsList = () => {
    if (!quotation.quotation_items || quotation.quotation_items.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <Car className="mx-auto h-6 w-6 mb-2 opacity-50" />
          <p className="text-sm">No services added yet</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {quotation.quotation_items.map((item, index) => {
          const isCharter = item.service_type_name?.toLowerCase().includes('charter') || false;
          const totalPrice = isCharter 
            ? item.unit_price * (item.service_days || 1)
            : (item.total_price || item.unit_price);
          
          // Calculate time-based adjustment display
          const hasTimeAdjustment = (item as any).time_based_adjustment && (item as any).time_based_adjustment !== 0;
          const timeAdjustmentText = hasTimeAdjustment 
            ? `${(item as any).time_based_adjustment! > 0 ? '+' : ''}${(item as any).time_based_adjustment}%`
            : '';
          
          const isExpanded = expandedServices.has(item.id);
          
          return (
            <div key={item.id} className="space-y-2">
              {/* Compact Service Card */}
              <div 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-all duration-300 cursor-pointer group hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => toggleServiceExpansion(item.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                  <div className="flex-shrink-0">
                    {isCharter ? (
                      <Car className="h-4 w-4 text-blue-600" />
                    ) : item.service_type_name?.toLowerCase().includes('airport') ? (
                      <Plane className="h-4 w-4 text-green-600" />
                    ) : (
                      <Package className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {item.service_type_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.vehicle_type}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {item.pickup_date && item.pickup_time && (
                        `${format(parseISO(item.pickup_date), 'MMM dd, yyyy')} at ${item.pickup_time}`
                      )}
                      {isCharter && item.service_days && item.hours_per_day && (
                        ` • ${item.service_days} days × ${item.hours_per_day}h/day`
                      )}
                      {hasTimeAdjustment && (
                        <span className="text-orange-500 dark:text-orange-400 font-medium">
                          {timeAdjustmentText && ` • ${timeAdjustmentText}`}
                          {(item as any).time_based_rule_name && ` ${(item as any).time_based_rule_name}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>
                  <div className="ml-2 transition-all duration-300 ease-in-out">
                    <div className={cn(
                      "transform transition-all duration-300 ease-in-out",
                      isExpanded ? "rotate-180 scale-110" : "rotate-0 scale-100"
                    )}>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expanded Service Details with Animation */}
              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
              )}>
                {isExpanded && (
                  <div className="ml-7 p-4 bg-muted/20 rounded-lg border border-muted/50 transform transition-all duration-500 ease-in-out animate-in slide-in-from-top-4 fade-in-0 zoom-in-95 delay-100">
                    <div className="space-y-3">
                      {/* Service Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">{t('quotations.details.serviceType')}:</span>
                          <p className="font-medium">{item.service_type_name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">{t('quotations.details.vehicle')}:</span>
                          <p className="font-medium">{item.vehicle_type}</p>
                        </div>
                        {item.pickup_date && item.pickup_time && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('quotations.details.dateAndTime')}:</span>
                            <p className="font-medium">
                              {format(parseISO(item.pickup_date), 'MMM dd, yyyy')} at {item.pickup_time}
                            </p>
                          </div>
                        )}
                        {isCharter && item.service_days && item.hours_per_day && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('quotations.details.duration')}:</span>
                            <p className="font-medium">{item.service_days} days × {item.hours_per_day}h/day</p>
                          </div>
                        )}
                        {(item as any).pickup_location && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('quotations.details.pickupLocation')}:</span>
                            <p className="font-medium">{(item as any).pickup_location}</p>
                          </div>
                        )}
                        {(item as any).dropoff_location && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('quotations.details.dropoffLocation')}:</span>
                            <p className="font-medium">{(item as any).dropoff_location}</p>
                          </div>
                        )}
                        {(item as any).flight_number && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('quotations.details.flightNumber')}:</span>
                            <p className="font-medium">{(item as any).flight_number}</p>
                          </div>
                        )}
                        {(item as any).terminal && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('quotations.details.terminal')}:</span>
                            <p className="font-medium">{(item as any).terminal}</p>
                          </div>
                        )}
                        {(item as any).number_of_passengers && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('quotations.details.passengers')}:</span>
                            <p className="font-medium">{(item as any).number_of_passengers}</p>
                          </div>
                        )}
                        {(item as any).number_of_bags && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('quotations.details.bags')}:</span>
                            <p className="font-medium">{(item as any).number_of_bags}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Pricing Details */}
                      <div className="pt-3 border-t border-muted/50 animate-in slide-in-from-bottom-2 fade-in-0 delay-200">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('quotations.details.unitPrice')}:</span>
                            <span className="font-medium">{formatCurrency(item.unit_price)}</span>
                          </div>
                          {isCharter && item.service_days && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">× {item.service_days} days:</span>
                              <span className="font-medium">{formatCurrency(item.unit_price * item.service_days)}</span>
                            </div>
                          )}
                          {hasTimeAdjustment && (
                            <div className="flex justify-between text-orange-500 dark:text-orange-400">
                              <span>{t('quotations.details.timeAdjustment')} ({timeAdjustmentText}):</span>
                              <span className="font-medium">
                                {formatCurrency(Math.abs((item.unit_price || 0) * (item.service_days || 1) * ((item as any).time_based_adjustment / 100)))}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-base pt-2 border-t border-muted/50">
                            <span>{t('quotations.details.total')}:</span>
                            <span>{formatCurrency(totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 pb-1 flex justify-between items-center font-medium text-sm border-t">
          <span>{t('quotationDetails.totalAmountBeforeDiscountTax')}</span>
          <span>{formatCurrency(quotation.quotation_items.reduce((total, item) => {
            // For Charter Services, calculate total based on duration (unit_price × service_days)
            if (item.service_type_name?.toLowerCase().includes('charter')) {
              const calculatedTotal = item.unit_price * (item.service_days || 1);
              return total + calculatedTotal;
            }
            // For other services, use existing logic
            return total + (item.total_price || item.unit_price);
          }, 0))}</span>
        </div>
      </div>
    );
  };
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<PricingPromotion | null>(null);
  const [appliedTimeBasedRules, setAppliedTimeBasedRules] = useState<any[]>([]);
  const [loadingPricingDetails, setLoadingPricingDetails] = useState(true);
  
  // Send Magic Link Dialog State
  const [isMagicLinkDialogOpen, setIsMagicLinkDialogOpen] = useState(false);
  const [magicLinkLanguage, setMagicLinkLanguage] = useState<'en' | 'ja'>('en');
  const [magicLinkBccEmails, setMagicLinkBccEmails] = useState<string>("booking@japandriver.com");
  const [magicLinkCustomerEmail, setMagicLinkCustomerEmail] = useState(quotation?.customer_email || '');
  
  // Send Reminder Dialog State
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  
  // Progress modal state
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTitle, setProgressTitle] = useState('Processing');
  const [progressVariant, setProgressVariant] = useState<'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice'>('default');
  const { progressValue, progressLabel, progressSteps, startProgress, resetProgress } = useProgressSteps();
  
  const { approveQuotation, rejectQuotation, sendQuotation, updateQuotation, getPricingPackages, getPricingPromotions } = useQuotationService();



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
          try {
            const packages = await getPricingPackages(false, true);
            const foundPackage = packages.find(pkg => pkg.id === packageId);
            if (foundPackage) {
              setSelectedPackage(foundPackage);
            }
          } catch (error) {
            console.error('Error loading package:', error);
          }
        } else {
          // No package ID found in quotation
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
  const formattedQuoteNumber = `QUO-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;

  // Enhanced currency formatting using dynamic rates
  const formatCurrency = (amount: number | string | undefined, currency: string = selectedCurrency) => {
    if (amount === undefined) return dynamicFormatCurrency(0, currency);
    
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Use dynamic currency service if available, fallback to static rates
    if (currencyData && !currencyLoading) {
      const convertedAmount = convertCurrency(numericAmount, 'JPY', currency);
      return dynamicFormatCurrency(convertedAmount, currency);
    }
    
    // Fallback to static rates (same as before)
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    };

    const convertedAmount = numericAmount * (exchangeRates[currency] / exchangeRates['JPY']);
    
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
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



  // Regenerate magic link for the quotation and send by email
  const handleRegenerateMagicLink = async () => {
    // Check if already processing to prevent duplicates
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setProgressOpen(true);
    setProgressTitle('Regenerating Magic Link');
    setProgressVariant('email');
    
    try {
      // Start progress simulation and API call in parallel
      const progressPromise = startProgress({
        steps: [
          { label: 'Creating new secure link...', value: 30 },
          { label: 'Generating token...', value: 60 },
          { label: 'Sending email to customer...', value: 80 }
        ],
        totalDuration: 1000
      });
      
      const response = await fetch('/api/quotations/send-email-unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation.id,
          customer_email: quotation.customer_email,
          language: magicLinkLanguage, // Use the selected language from the dialog
        }),
      });
      
      // Wait for both to complete
      await Promise.all([progressPromise, response]);
      
      if (response.ok) {
        toast({
          title: "Magic Link Regenerated & Sent",
          description: `New magic link has been sent to ${quotation.customer_email}`,
          variant: 'default',
        });
        
        setTimeout(() => {
          setProgressOpen(false);
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate magic link');
      }
    } catch (error) {
      console.error('Error regenerating magic link:', error);
      toast({
        title: "Failed to regenerate magic link",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: 'destructive',
      });
      setTimeout(() => setProgressOpen(false), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  // Send the quotation to the customer
  const handleSend = async () => {
    // DISABLED - This was causing duplicate email sends
    return;
    setIsLoading(true);
    setProgressOpen(true);
    setProgressVariant('email');
    setProgressTitle('Sending Quotation');
    
    try {
      // Start progress simulation and API call in parallel
      const progressPromise = startProgress(progressConfigs.sendEmail);
      
      const apiCall = fetch('/api/quotations/send-email-unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation.id,
          email: quotation.customer_email,
          language: 'en',
          bcc_emails: 'booking@japandriver.com'
        }),
      });
      
      // Wait for both to complete
      const [_, response] = await Promise.all([progressPromise, apiCall]);
      const success = response.ok;
      
      if (success) {
        toast({
          title: t('quotations.notifications.sendSuccess'),
          variant: 'default',
        });
        setTimeout(() => {
          setProgressOpen(false);
        router.refresh();
        }, 500);
      } else {
        throw new Error('Failed to send quotation');
      }
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast({
        title: t('quotations.notifications.error'),
        description: 'Failed to send quotation',
        variant: 'destructive',
      });
      setTimeout(() => setProgressOpen(false), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions moved to PricingBreakdown component



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
      {/* Enhanced Header with New Layout */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Top Row - Title and Status */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold mb-2 break-words">
            {quotation.title || t('quotations.details.untitled')}
          </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <p className="text-muted-foreground">
                      {t('quotations.details.quotationNumber', { defaultValue: 'Quotation Number #{id}' }).replace('{id}', formattedQuoteNumber)}
                      {quotation.creator && (
                        <span className="ml-2">
                          • {t('quotations.details.createdBy')} {quotation.creator.full_name || t('common.unknownUser', { defaultValue: 'Unknown User' })}
                        </span>
                      )}
                    </p>
                    {/* Universal Status Badge */}
                    <StatusBadge
                      status={quotation.status}
                      rejectedAt={(quotation as any).rejected_at}
                      approvedAt={(quotation as any).approved_at}
                      paymentCompletedAt={(quotation as any).payment_completed_at}
                      createdAt={quotation.created_at}
                    />
                </div>
              </div>
        </div>
        
              {/* Share and Edit buttons moved to top right */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 flex-shrink-0">
                <QuotationShareButtons quotation={quotation} />
                {isOrganizationMember && !['approved', 'rejected', 'converted', 'paid'].includes(quotation.status) && !(quotation as any).converted_to_booking_id && !(quotation as any).payment_completed_at && (
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto gap-2">
                    <Link href={getQuotationEditUrl(quotation) as any}>
                      <Edit className="h-4 w-4" />
                      {t('quotations.actions.edit')}
                    </Link>
          </Button>
                )}
              </div>
            </div>
            
            
            {/* Next Step Indicator */}
          {(() => {
            const getNextStep = () => {
              // Check if quotation is expired - hide next step banner
              const now = new Date();
              const createdDate = new Date(quotation.created_at);
              const properExpiryDate = addDays(createdDate, 3);
              const isExpired = now > properExpiryDate;
              
              if (isExpired && (quotation.status === 'draft' || quotation.status === 'sent') && !(quotation as any).approved_at && !(quotation as any).rejected_at) {
                return null; // Hide next step banner when expired
              }
              
              // Check if payment is completed first
              if ((quotation as any).payment_completed_at) {
                if ((quotation as any).booking_created_at) {
                  return 'CONVERTED'; // Special case for converted status
                }
                return 'Final step: Convert to Booking';
              }
              
              switch (quotation.status) {
                case 'draft':
                  return t('quotations.workflow.steps.sendToCustomer');
                case 'sent':
                  if ((quotation as any).approved_at) {
                    if ((quotation as any).invoice_generated_at) {
                      return 'Send Payment Link';
                    }
                    return 'Confirmed Payment';
                  }
                  return t('quotations.workflow.steps.waitingForApproval');
                case 'approved':
                  if ((quotation as any).invoice_generated_at) {
                    return 'Send Payment Link';
                  }
                  return 'Confirmed Payment';
                case 'paid':
                  return 'Convert to Booking';
                case 'rejected':
                  return 'REJECTED'; // Special case for rejected status
                default:
                  return null;
              }
            };
            
            const nextStep = getNextStep();
            
            // Check if quotation is expired - show red expired block instead of next step
            const now = new Date();
            const createdDate = new Date(quotation.created_at);
            const properExpiryDate = addDays(createdDate, 3);
            const isExpired = now > properExpiryDate;
            
            if (isExpired && (quotation.status === 'draft' || quotation.status === 'sent') && !(quotation as any).approved_at && !(quotation as any).rejected_at) {
              const daysUntilExpiry = Math.ceil((properExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                      Expired
                    </span>
                    <span className="text-xs text-red-600 dark:text-red-400">
                      (Expired {Math.abs(daysUntilExpiry)} day{Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Valid until {formatDateDDMMYYYY(properExpiryDate)} at {format(properExpiryDate, 'h:mm a')}
                    </span>
                  </div>
                </div>
              );
            }
            
            if (nextStep) {
              // Special handling for rejected status - show red banner
              if (nextStep === 'REJECTED' || quotation.status === 'rejected' || (quotation as any).rejected_at) {
                return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                      Quotation Rejected
                    </span>
                  </div>
                );
              }
              
              // Green success banner for converted to booking
              if (nextStep === 'CONVERTED' || quotation.status === 'converted' || (quotation as any).booking_created_at) {
                return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                      Successfully converted to booking
                    </span>
                  </div>
                );
              }
              
              // Special handling for "Final step" to avoid double prefix
              if (nextStep === 'Final step: Convert to Booking') {
                return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {nextStep}
                    </span>
                  </div>
                );
              }
              
              // Default blue banner for other next steps
              return (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {t('quotations.workflow.nextStep', { step: nextStep })}
                  </span>
                </div>
              );
            }
            return null;
          })()}
            
            {/* Action Buttons Row - Show for all statuses */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2 border-t">
              {/* Primary Action Buttons */}
              {quotation.status === 'approved' ? (
                <>
                  <QuotationInvoiceButton 
                    quotation={quotation} 
                    onSuccess={() => router.refresh()} 
                    onSendPaymentLink={() => workflowRef.current?.openPaymentLinkDialog()}
                  />
                </>
              ) : quotation.status === 'paid' || quotation.status === 'converted' || (quotation as any).payment_completed_at ? (
                <>
                  <QuotationInvoiceButton 
                    quotation={quotation} 
                    onSuccess={() => router.refresh()} 
                    onSendPaymentLink={() => workflowRef.current?.openPaymentLinkDialog()}
                  />
                </>
              ) : (quotation.status === 'rejected' || (quotation as any).rejected_at) ? (
                <>
                  <QuotationPdfButton 
                    quotation={quotation} 
                    selectedPackage={selectedPackage} 
                    selectedPromotion={selectedPromotion} 
                    onSuccess={() => router.refresh()} 
                  />
                </>
              ) : (
                <>
                  <QuotationPdfButton 
                    quotation={quotation} 
                    selectedPackage={selectedPackage} 
                    selectedPromotion={selectedPromotion} 
                    onSuccess={() => router.refresh()} 
                  />
                  {isOrganizationMember && quotation.status === 'draft' && (
            <Button
                      onClick={() => workflowRef.current?.openSendQuotationDialog()} 
              disabled={isLoading}
                      className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
                      <Mail className="h-4 w-4" />
                      {t('quotations.actions.send')}
            </Button>
                  )}
                </>
          )}
          
              {/* Regenerate Magic Link Button - Show for all statuses */}
              {isOrganizationMember && (
            <Button
              variant="outline"
                  onClick={() => setIsMagicLinkDialogOpen(true)} 
                  disabled={isLoading}
                  className="w-full sm:w-auto gap-2"
            >
                  <RefreshCw className="h-4 w-4" />
                  Send New Magic Link
            </Button>
          )}
        </div>
      </div>
        </CardContent>
      </Card>
      
      {/* Enhanced Loading States */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 shadow-lg">
          <LoadingSpinner />
            <p className="text-center mt-4 text-muted-foreground">Processing quotation...</p>
          </div>
        </div>
      )}

      {/* Skeleton Loading for Pricing Details */}
      {loadingPricingDetails && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
            {/* Main Content Skeleton */}
            <div className="xl:col-span-2 space-y-4 xl:space-y-6">
          <Card>
            <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Customer Info Skeleton */}
                    <div className="space-y-3">
                      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="h-20 bg-muted animate-pulse rounded-lg" />
                          <div className="h-16 bg-muted animate-pulse rounded-lg" />
                          <div className="h-16 bg-muted animate-pulse rounded-lg" />
                  </div>
                        <div className="space-y-3">
                          <div className="h-20 bg-muted animate-pulse rounded-lg" />
                          <div className="h-16 bg-muted animate-pulse rounded-lg" />
                        </div>
                  </div>
                </div>
                
                    {/* Services Skeleton */}
                    <div className="space-y-3">
                      <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Pricing Summary Skeleton */}
                    <div className="space-y-3">
                      <div className="h-6 w-28 bg-muted animate-pulse rounded" />
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex justify-between">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  </div>
                  
            {/* Sidebar Skeleton */}
            <div className="xl:col-span-1 space-y-4 xl:space-y-6">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-6 w-28 bg-muted animate-pulse rounded" />
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                        </div>
                      ))}
                      </div>
                    </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                    <div className="space-y-2">
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                        ))}
                </div>
              </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {!loadingPricingDetails && (
        <div className="space-y-6">
          {/* Main Content - Reorganized Layout */}
          <div className="space-y-6">

            {/* Row 2: Quotation Workflow (full width) */}
            <QuotationWorkflow
              ref={workflowRef}
              quotation={{
                id: quotation.id,
                status: quotation.status,
                created_at: quotation.created_at,
                expiry_date: quotation.expiry_date,
                last_sent_at: (quotation as any).last_sent_at,
                reminder_sent_at: (quotation as any).reminder_sent_at,
                approved_at: (quotation as any).approved_at,
                rejected_at: (quotation as any).rejected_at,
                invoice_generated_at: (quotation as any).invoice_generated_at,
                payment_completed_at: (quotation as any).payment_completed_at,
                payment_link_sent_at: (quotation as any).payment_link_sent_at,
                payment_link: (quotation as any).payment_link,
                payment_link_generated_at: (quotation as any).payment_link_generated_at,
                payment_link_expires_at: (quotation as any).payment_link_expires_at,
                booking_created_at: (quotation as any).booking_created_at || (quotation.status === 'converted' ? quotation.updated_at : undefined),
                quote_number: quotation.quote_number,
                customer_email: quotation.customer_email,
                customer_name: quotation.customer_name,
                amount: quotation.amount,
                total_amount: quotation.total_amount,
                currency: quotation.currency,
                receipt_url: (quotation as any).receipt_url,
              }}
              onRefresh={() => router.refresh()}
              onSendReminder={() => {
                // Open the send reminder dialog instead of directly calling API
                setIsReminderDialogOpen(true);
              }}
              onGenerateInvoice={async () => {
                setIsLoading(true);
                setProgressOpen(true);
                setProgressVariant('invoice');
                setProgressTitle('Sending Invoice');
                
                try {
                  // Start progress simulation
                  const progressPromise = startProgress({
                    steps: [
                      { label: 'Preparing invoice...', value: 30 },
                      { label: 'Generating PDF...', value: 60 },
                      { label: 'Sending email...', value: 90 }
                    ],
                    totalDuration: 2000
                  });
                  
                  // First generate the invoice PDF
                  const response = await fetch('/api/quotations/generate-invoice-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      quotation_id: quotation.id,
                      language: 'en'
                    })
                  });
                  
                  if (response.ok) {
                    const pdfBlob = await response.blob();
                    
                    // Send the PDF via email using the same logic as QuotationInvoiceButton
                    const formData = new FormData();
                    formData.append('email', quotation.customer_email);
                    formData.append('quotation_id', quotation.id);
                    formData.append('customer_name', quotation.customer_name || 'Customer');
                    formData.append('include_details', 'true');
                    formData.append('language', 'en');
                    formData.append('payment_link', '');
                    const formattedId = `INV-JPDR-${String(quotation.quote_number || 0).padStart(6, '0')}`;
                    formData.append('invoice_pdf', pdfBlob, `${formattedId}.pdf`);
                    
                    const emailResponse = await fetch('/api/quotations/send-payment-link-email', {
                      method: 'POST',
                      body: formData,
                    });
                    
                    // Wait for progress to complete
                    await progressPromise;
                    
                    if (emailResponse.ok) {
                      // Update the quotation status to mark invoice as generated
                      try {
                        await fetch(`/api/quotations/${quotation.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            invoice_generated_at: new Date().toISOString()
                          })
                        });
                      } catch (error) {
                        console.error('Error updating invoice status:', error);
                      }
                      
                      toast({
                        title: "Invoice sent successfully",
                        variant: 'default',
                      });
                      setTimeout(() => {
                        setProgressOpen(false);
                        router.refresh();
                      }, 500);
                    } else {
                      throw new Error('Failed to send invoice email');
                    }
                  } else {
                    throw new Error('Failed to generate invoice');
                  }
                } catch (error) {
                  console.error('Error sending invoice:', error);
                  toast({
                    title: "Failed to send invoice",
                    description: "Please try again later",
                    variant: 'destructive',
                  });
                  setTimeout(() => setProgressOpen(false), 1000);
                } finally {
                  setIsLoading(false);
                }
              }}
              onSendPaymentLink={() => {
                // Open the payment link dialog in QuotationWorkflow
                workflowRef.current?.openPaymentLinkDialog();
              }}
              onCreateBooking={async () => {
                // This is now handled in the QuotationWorkflow component
                // No need to duplicate the conversion logic here
              }}
              isOrganizationMember={isOrganizationMember}
            />

            {/* Row 3: Customer Information (full width) */}
            <Card>
              <CardContent className="pt-6">
              {/* Customer Information - Clean Design */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <User className="h-6 w-6 mr-3 text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold">{t('quotations.details.customerInfo')}</h2>
                    <p className="text-sm text-muted-foreground">{t('quotations.details.contactAndBillingDetails')}</p>
                  </div>
                </div>
                
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Contact Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          
                  <div>
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t('quotations.details.contactInfo')}</h4>
                      </div>
                      </div>
                      
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <User className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="text-lg text-foreground">{quotation.customer_name || t('common.notAvailable')}</div>
                              <span className="text-xs text-muted-foreground font-normal">{t('quotations.details.fullName')}</span>
                            </div>
                      </div>
                      
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Mail className="h-5 w-5 text-foreground" />
                        </div>
                            <div className="flex-1">
                              <div className="text-lg text-foreground">{quotation.customer_email}</div>
                              <span className="text-xs text-muted-foreground font-normal">{t('quotations.details.email')}</span>
                            </div>
                          </div>
                          
                          {quotation.customer_phone && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <Phone className="h-5 w-5 text-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="text-lg text-foreground">{quotation.customer_phone}</div>
                                <span className="text-xs text-muted-foreground font-normal">{t('quotations.details.phone')}</span>
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
                  
                  <div>
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t('quotations.details.billingAddress')}</h4>
                        </div>
                        </div>
                          
                          <div className="space-y-4">
                            {quotation.billing_company_name && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                  <Building className="h-5 w-5 text-foreground" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-lg">{quotation.billing_company_name}</div>
                                  <span className="text-xs text-muted-foreground font-normal">{t('quotations.details.companyName')}</span>
                                </div>
                        </div>
                      )}
                            
                            {quotation.billing_tax_number && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                  <CreditCard className="h-5 w-5 text-foreground" />
                    </div>
                                <div className="flex-1">
                                  <div className="text-lg text-foreground">{quotation.billing_tax_number}</div>
                                  <span className="text-xs text-muted-foreground font-normal">{t('quotations.details.taxId')}</span>
                  </div>
                </div>
                            )}
                            
                            {(quotation.billing_street_name || quotation.billing_city || quotation.billing_country) && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                  <MapPin className="h-5 w-5 text-foreground" />
                          </div>
                                <div className="flex-1">
                                  <div className="space-y-0.5 text-lg text-foreground">
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
                                        {quotation.billing_country && ` ${quotation.billing_country}`}
                        </div>
                      )}
                                  </div>
                                  <span className="text-xs text-muted-foreground font-normal">Billing Address</span>
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
              
            </CardContent>
          </Card>
        
            {/* Row 4: Services and Price Details (2 columns) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Services Section */}
          <Card>
                <CardContent className="pt-6">
                  {/* Selected Services Section using ServiceCard */}
                  {quotation.quotation_items && quotation.quotation_items.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Car className="h-6 w-6 mr-3 text-primary" />
                          <div>
                            <h2 className="text-xl font-semibold">{t('quotations.details.selectedServices')}</h2>
                            <p className="text-sm text-muted-foreground">{quotation.quotation_items.length} {t('quotations.details.servicesSelected')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                            className="h-8 px-2"
                          >
                            {isServicesExpanded ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                {t('quotations.details.compact')}
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                {t('quotations.details.expand')}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
              
                      {isServicesExpanded ? (
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
                              pickup_location: (item as any).pickup_location || '',
                              dropoff_location: (item as any).dropoff_location || '',
                              number_of_passengers: (item as any).number_of_passengers || null,
                              number_of_bags: (item as any).number_of_bags || null,
                              flight_number: (item as any).flight_number || '',
                              terminal: (item as any).terminal || '',
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
                            <span>{t('quotations.details.totalAmountBeforeDiscountTax')}</span>
                            <span>{formatCurrency(quotation.quotation_items.reduce((total, item) => {
                              // For Charter Services, calculate total based on duration (unit_price × service_days)
                              if (item.service_type_name?.toLowerCase().includes('charter')) {
                                const calculatedTotal = item.unit_price * (item.service_days || 1);
                                return total + calculatedTotal;
                              }
                              // For other services, use existing logic
                              return total + (item.total_price || item.unit_price);
                            }, 0))}</span>
                          </div>
                        </div>
                      ) : (
                        renderCompactServiceItemsList()
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Price Details Section */}
              <Card>
                <CardContent className="pt-6">
                  {/* ✅ ENHANCED PRICING SUMMARY with Dynamic Currency */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calculator className="h-6 w-6 text-primary" />
                        <div>
                          <h2 className="text-xl font-semibold">{t('quotations.details.priceDetails')}</h2>
                          <p className="text-sm text-muted-foreground">{t('quotations.details.detailedPricingInformation')}</p>
                </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {currencyLoading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>{t('quotations.details.loadingRates')}</span>
                          </div>
                        )}
                        <CurrencySelector
                          selectedCurrency={selectedCurrency}
                          onCurrencyChange={handleCurrencyChange}
                          baseCurrency="JPY"
                          compact={true}
                          showRefreshButton={true}
                          showRateInfo={true}
                        />
                      </div>
                    </div>
                    
                    <PricingSummary 
                      quotationItems={quotation.quotation_items || []}
                      selectedPackage={selectedPackage}
                      selectedPromotion={selectedPromotion}
                      discountPercentage={quotation.discount_percentage || 0}
                      taxPercentage={quotation.tax_percentage || 0}
                      formatCurrency={formatCurrency}
                    />
              </div>
            </CardContent>
          </Card>
            </div>
          
            {/* Row 5: Quotation Approval (full width) */}
            {['draft', 'sent'].includes(quotation.status) && !['approved', 'paid', 'rejected', 'converted'].includes(quotation.status) && !(quotation as any).approved_at && !(quotation as any).payment_completed_at && !(quotation as any).rejected_at && (
              <QuotationDetailsApprovalPanel 
                isProcessing={isLoading}
                customerName={quotation.customer_name}
                quotation={quotation as any}
                onApprove={async (notes, signature, bccEmails) => {
                  setIsLoading(true);
                  setProgressOpen(true);
                  setProgressVariant('approval');
                  setProgressTitle('Approving Quotation');
                  
                  try {
                    // Start progress simulation and API call in parallel
                    const progressPromise = startProgress(progressConfigs.approval);
                    
                    const apiCall = fetch('/api/quotations/approve', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        id: quotation.id,
                        notes: notes,
                        signature: signature,
                        bcc_emails: bccEmails
                      }),
                    });
                    
                    // Wait for both to complete
                    const [_, response] = await Promise.all([progressPromise, apiCall]);
                    const success = response.ok;
                    
                    if (success) {
                      toast({
                        title: t('quotations.notifications.approveSuccess'),
                        variant: 'default',
                      });
                      setTimeout(() => {
                        setProgressOpen(false);
                      router.refresh();
                      }, 500);
                    } else {
                      throw new Error('Failed to approve quotation');
                    }
                  } catch (error) {
                    console.error('Error approving quotation:', error);
                    toast({
                      title: t('quotations.notifications.error'),
                      description: 'Failed to approve quotation',
                      variant: 'destructive',
                    });
                    setTimeout(() => setProgressOpen(false), 1000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                onReject={async (reason, signature, bccEmails) => {
                  setIsLoading(true);
                  setProgressOpen(true);
                  setProgressVariant('rejection');
                  setProgressTitle('Rejecting Quotation');
                  
                  try {
                    // Start progress simulation and API call in parallel
                    const progressPromise = startProgress(progressConfigs.rejection);
                    
                    const apiCall = fetch('/api/quotations/reject', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        id: quotation.id,
                        email: quotation.customer_email,
                        reason: reason,
                        signature: signature,
                        language: 'en',
                        bcc_emails: bccEmails
                      }),
                    });
                    
                    // Wait for both to complete
                    const [_, response] = await Promise.all([progressPromise, apiCall]);
                    const success = response.ok;
                    
                    if (success) {
                      toast({
                        title: t('quotations.notifications.rejectSuccess'),
                        variant: 'default',
                      });
                      setTimeout(() => {
                        setProgressOpen(false);
                      router.refresh();
                      }, 500);
                    } else {
                      throw new Error('Failed to reject quotation');
                    }
                  } catch (error) {
                    console.error('Error rejecting quotation:', error);
                    toast({
                      title: t('quotations.notifications.error'),
                      description: 'Failed to reject quotation',
                      variant: 'destructive',
                    });
                    setTimeout(() => setProgressOpen(false), 1000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
          )}
          
            {/* Row 6: Notes and Comments (dynamic columns) */}
            {(() => {
              const notesCount = [
                quotation.customer_notes,
                quotation.merchant_notes,
                quotation.general_notes
              ].filter(Boolean).length;
              
              if (notesCount === 0) return null;
              
              // Dynamic grid classes based on number of notes
              const gridClasses = notesCount === 1 
                ? "grid grid-cols-1" 
                : notesCount === 2 
                ? "grid grid-cols-1 md:grid-cols-2" 
                : "grid grid-cols-1 md:grid-cols-3";
              
              return (
                <div className="space-y-6">
                  <div className="flex items-center mb-4">
                    <StickyNote className="h-6 w-6 mr-3 text-primary" />
                    <div>
                      <h2 className="text-xl font-semibold">{t('quotationDetails.notesAndComments')}</h2>
                      <p className="text-sm text-muted-foreground">{t('quotationDetails.additionalInformationFeedback')}</p>
            </div>
                  </div>
                  <div className={`${gridClasses} gap-6`}>
                {quotation.customer_notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('quotationDetails.customerNotes')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-sm leading-relaxed bg-muted/30 rounded-md p-3 border-l-4 border-l-blue-500 whitespace-pre-wrap break-words"
                      >
                        {processNotesText(quotation.customer_notes)}
            </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('quotationDetails.customerNotesDescription')}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {quotation.merchant_notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        {t('quotationDetails.internalNotes')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-sm leading-relaxed bg-muted/30 rounded-md p-3 border-l-4 border-l-orange-500 whitespace-pre-wrap break-words"
                      >
                        {processNotesText(quotation.merchant_notes)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('quotationDetails.internalNotesDescription')}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {quotation.general_notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t('quotationDetails.generalNotes')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-sm leading-relaxed bg-muted/30 rounded-md p-3 border-l-4 border-l-gray-500 whitespace-pre-wrap break-words"
                      >
                        {processNotesText(quotation.general_notes)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('quotationDetails.generalNotesDescription')}
                      </p>
                    </CardContent>
                  </Card>
                )}
                  </div>
                </div>
              );
            })()}

        </div>
        
          

          




      </div>
      )}

      {/* Send Magic Link Dialog */}
      <Dialog open={isMagicLinkDialogOpen} onOpenChange={setIsMagicLinkDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Send New Magic Link
            </DialogTitle>
            <DialogDescription>
              Send a new magic link to the customer for accessing this quotation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="magic-link-customer-email">Customer Email</Label>
              <Input
                id="magic-link-customer-email"
                type="email"
                value={magicLinkCustomerEmail}
                onChange={(e) => setMagicLinkCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email will be sent to the customer's registered email address
              </p>
          </div>
            
            <div>
              <Label htmlFor="magic-link-bcc-emails">BCC Emails</Label>
              <Input
                id="magic-link-bcc-emails"
                value={magicLinkBccEmails}
                onChange={(e) => setMagicLinkBccEmails(e.target.value)}
                placeholder="Enter email addresses separated by commas"
                className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: booking@japandriver.com. Add more emails separated by commas.
              </p>
        </div>
            
            <div>
              <Label>Language</Label>
              <Select value={magicLinkLanguage} onValueChange={(value: 'en' | 'ja') => setMagicLinkLanguage(value)}>
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
                <li>• New secure magic link for quotation access</li>
                <li>• Customer information and contact details</li>
                <li>• Quotation reference and details</li>
                <li>• Company branding and contact information</li>
                <li>• Secure access instructions</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMagicLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                setIsMagicLinkDialogOpen(false);
                await handleRegenerateMagicLink();
              }}
              disabled={isLoading}
              className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Send Magic Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Progress Modal */}
      <LoadingModal
        open={progressOpen}
        title={progressTitle}
        label={progressLabel}
        value={progressValue}
        variant={progressVariant}
        showSteps={progressSteps.length > 0}
        steps={progressSteps}
        onOpenChange={setProgressOpen}
      />

      {/* Send Reminder Dialog */}
      {quotation && (
        <SendReminderDialog
          quotation={quotation}
          open={isReminderDialogOpen}
          onOpenChange={setIsReminderDialogOpen}
        />
      )}
    </div>
  );
} 