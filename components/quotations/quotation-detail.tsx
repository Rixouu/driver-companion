'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { Quotation } from '@/types/quotations';
import { formatDate } from '@/lib/utils/date-utils';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuotationDetailProps {
  id: string;
}

export function QuotationDetail({ id }: QuotationDetailProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('JPY');
  const [quotationItems, setQuotationItems] = useState<any[]>([]);
  const { toast } = useToast();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    async function fetchQuotation() {
      try {
        setIsLoading(true);
        console.log(`[QUOTATION DEBUG] Fetching quotation with ID: ${id}`);
        const response = await fetch(`/api/quotations/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch quotation: ${await response.text()}`);
        }
        
        const data = await response.json();
        console.log('[QUOTATION DEBUG] Quotation data:', data);
        setQuotation(data);
        // Initialize currency from the quotation
        setSelectedCurrency(data.display_currency || data.currency || 'JPY');
        
        // Fetch quotation items separately
        await fetchQuotationItems(id);
      } catch (error) {
        console.error('[QUOTATION DEBUG] Error loading quotation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quotation details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchQuotation();
  }, [id, toast]);
  
  // Add a new function to fetch quotation items
  async function fetchQuotationItems(quotationId: string) {
    try {
      console.log(`[QUOTATION DEBUG] Fetching quotation items for ID: ${quotationId}`);
      const response = await fetch(`/api/quotations/${quotationId}/items`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quotation items: ${await response.text()}`);
      }
      
      const { data } = await response.json();
      console.log('[QUOTATION DEBUG] Fetched quotation items:', data);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('[QUOTATION DEBUG] No quotation items returned from API');
        // If API returns no items, try direct DB query
        const directItems = await fetchDirectItems(quotationId);
        if (directItems && directItems.length > 0) {
          console.log('[QUOTATION DEBUG] Got items from direct query:', directItems);
          setQuotationItems(directItems);
        } else {
          console.log('[QUOTATION DEBUG] No items found in direct query either');
          setQuotationItems([]);
        }
        return;
      }
      
      // Set all items, regardless of is_service_item flag
      console.log('[QUOTATION DEBUG] Setting quotation items:', data);
      setQuotationItems(data);
    } catch (error) {
      console.error('[QUOTATION DEBUG] Error loading quotation items:', error);
      // Try direct fetch if API fails
      const directItems = await fetchDirectItems(quotationId);
      if (directItems && directItems.length > 0) {
        console.log('[QUOTATION DEBUG] Got items from direct query after API error:', directItems);
        setQuotationItems(directItems);
      } else {
        console.log('[QUOTATION DEBUG] No items found in direct query after API error');
        toast({
          title: 'Warning',
          description: 'Could not load all quotation service details.',
          variant: 'destructive',
        });
      }
    }
  }

  // Add a direct DB query function as fallback
  async function fetchDirectItems(quotationId: string) {
    try {
      console.log(`[QUOTATION DEBUG] Attempting direct DB query for quotation items: ${quotationId}`);
      const response = await fetch('/api/quotations/direct-items?id=' + quotationId);
      if (response.ok) {
        const { data } = await response.json();
        console.log('[QUOTATION DEBUG] Direct DB query results:', data);
        return data;
      }
      console.log('[QUOTATION DEBUG] Direct DB query failed:', await response.text());
      return null;
    } catch (error) {
      console.error('[QUOTATION DEBUG] Error in direct items fetch:', error);
      return null;
    }
  }

  // Format currency with exchange rates
  const formatCurrency = (amount: number | string | undefined) => {
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
    const convertedAmount = numericAmount * (exchangeRates[selectedCurrency] / exchangeRates[(quotation?.currency || 'JPY')]);
    
    // Format based on currency
    if (selectedCurrency === 'JPY' || selectedCurrency === 'CNY') {
      return selectedCurrency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (selectedCurrency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2
      }).format(convertedAmount);
    }
  };

  if (isLoading) {
    return <QuotationDetailSkeleton />;
  }

  if (!quotation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4">
            <h2 className="text-xl font-semibold mb-2">Quotation Not Found</h2>
            <p className="text-muted-foreground">
              The quotation you are looking for does not exist or has been deleted.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500';
      case 'sent':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'expired':
        return 'bg-amber-500';
      case 'converted':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Filter service items - show all items regardless of any flags
  const serviceItems = quotationItems.length > 0 
    ? quotationItems  // Show all items from the API
    : [];  // Empty array if no items found
  
  console.log('[QUOTATION DEBUG] Final service items for rendering:', serviceItems);
  const hasMultipleServices = serviceItems.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">
            {t('quotations.details.quotationNumber', { id: quotation.quote_number.toString() })}
          </CardTitle>
          <Badge className={getStatusBadgeColor(quotation.status)}>
            {t(`quotations.details.quotationStatus.${quotation.status}`)}
          </Badge>
        </div>
        <p className="text-muted-foreground">{quotation.title}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                {t('quotations.details.customerInfo')}
              </h3>
              <div className="space-y-1">
                <p><span className="font-medium">{t('quotations.details.fields.customerName')}:</span> {quotation.customer_name || 'N/A'}</p>
                <p><span className="font-medium">{t('quotations.details.fields.email')}:</span> {quotation.customer_email}</p>
                {quotation.customer_phone && (
                  <p><span className="font-medium">{t('quotations.details.fields.phone')}:</span> {quotation.customer_phone}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                {t('quotations.details.dates')}
              </h3>
              <div className="space-y-1">
                <p><span className="font-medium">{t('quotations.details.created')}:</span> {formatDate(quotation.created_at)}</p>
                <p>
                  <span className="font-medium">{t('quotations.details.expiry')}:</span> {formatDate(quotation.expiry_date)}
                  {quotation.status === 'expired' 
                    ? ` (${t('quotations.details.expired', { date: formatDate(quotation.expiry_date) })})` 
                    : ` (${t('quotations.details.validUntil', { date: formatDate(quotation.expiry_date) })})`}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">
              {t('quotations.details.serviceInfo')}
            </h3>
            
            {hasMultipleServices ? (
              // Multi-service display with more detail
              <div className="space-y-4">
                {serviceItems.map((item, index) => (
                  <div key={index} className="border rounded-md p-3 bg-muted/20">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-base">
                        {item.service_type_name || item.description || 'Service'}
                      </h4>
                      <Badge variant="outline" className="ml-2">
                        {item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <div className="space-y-2">
                        <p><span className="font-medium">{t('quotations.details.fields.vehicleType')}:</span> {item.vehicle_type}</p>
                        <p><span className="font-medium">Vehicle Category:</span> {item.vehicle_category || 'Standard'}</p>
                        
                        {quotation?.pickup_date && (
                          <p><span className="font-medium">{t('quotations.details.fields.pickupDate')}:</span> {formatDate(quotation.pickup_date)}</p>
                        )}
                        
                        {quotation?.pickup_time && (
                          <p><span className="font-medium">{t('quotations.details.fields.pickupTime')}:</span> {quotation.pickup_time}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {item.service_type_name?.toLowerCase().includes('charter') ? (
                          <>
                            {item.service_days && (
                              <p>
                                <span className="font-medium">{t('quotations.details.fields.days')}:</span> {item.service_days} {t('quotations.details.days')}
                              </p>
                            )}
                            
                            {item.hours_per_day && (
                              <p>
                                <span className="font-medium">{t('quotations.details.fields.hoursPerDay')}:</span> {item.hours_per_day} {t('quotations.details.hours')}
                              </p>
                            )}
                          </>
                        ) : (
                          <p>
                            <span className="font-medium">{t('quotations.details.fields.duration')}:</span> {item.duration_hours || 1} {t('quotations.details.hours')}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center mt-3 pt-1 border-t">
                          <span className="font-medium">Unit Price:</span>
                          <span>{formatCurrency(item.unit_price)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total:</span>
                          <span>{formatCurrency(item.total_price || (item.unit_price * (item.quantity || 1)))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Original single service display (keep as is)
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p><span className="font-medium">{t('quotations.details.fields.serviceType')}:</span> {quotation.service_type}</p>
                  <p><span className="font-medium">{t('quotations.details.fields.vehicleType')}:</span> {quotation.vehicle_type}</p>
                  {quotation.pickup_date && (
                    <p><span className="font-medium">{t('quotations.details.fields.pickupDate')}:</span> {formatDate(quotation.pickup_date)}</p>
                  )}
                  {quotation.pickup_time && (
                    <p><span className="font-medium">{t('quotations.details.fields.pickupTime')}:</span> {quotation.pickup_time}</p>
                  )}
                </div>
                <div className="space-y-1">
                  {quotation.duration_hours && (
                    <p>
                      <span className="font-medium">{t('quotations.details.fields.duration')}:</span> {quotation.duration_hours} {t('quotations.details.hours')}
                    </p>
                  )}
                  {quotation.pickup_location && (
                    <p><span className="font-medium">{t('quotations.details.pickup')}:</span> {quotation.pickup_location}</p>
                  )}
                  {quotation.dropoff_location && (
                    <p><span className="font-medium">{t('quotations.details.dropoff')}:</span> {quotation.dropoff_location}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 flex justify-between items-center">
              <span>{t('quotations.details.pricing')}</span>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={selectedCurrency}
                  onValueChange={setSelectedCurrency}
                >
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
            </h3>
            <div className="p-4 bg-muted rounded-md">
              {hasMultipleServices ? (
                // Enhanced pricing display for multi-service quotations
                <>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Services:</h4>
                    {serviceItems.map((item, index) => (
                      <div key={item.id} className="flex justify-between items-center text-sm pl-4 py-1">
                        <span className="truncate max-w-[70%]">{item.description}</span>
                        <span>{formatCurrency(item.total_price || (item.unit_price * (item.quantity || 1)))}</span>
                      </div>
                    ))}
                    <Separator className="my-2" />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>{t('quotations.details.fields.amount')}:</span>
                    <span>{formatCurrency(quotation.amount)}</span>
                  </div>
                  
                  {quotation.discount_percentage && quotation.discount_percentage > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>{t('quotations.details.fields.discount')} ({quotation.discount_percentage}%):</span>
                      <span>- {formatCurrency(quotation.amount * (quotation.discount_percentage / 100))}</span>
                    </div>
                  )}
                  
                  {quotation.tax_percentage && quotation.tax_percentage > 0 && (
                    <div className="flex justify-between items-center">
                      <span>{t('quotations.details.fields.tax')} ({quotation.tax_percentage}%):</span>
                      <span>{formatCurrency(quotation.amount * (1 - (quotation.discount_percentage || 0) / 100) * (quotation.tax_percentage / 100))}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t">
                    <span>{t('quotations.details.fields.totalAmount')}:</span>
                    <span>{formatCurrency(quotation.total_amount)}</span>
                  </div>
                </>
              ) : (
                // Original pricing display
                <>
                  <div className="flex justify-between items-center">
                    <span>{t('quotations.details.fields.amount')}:</span>
                    <span>{formatCurrency(quotation.amount)}</span>
                  </div>
                  {quotation.discount_percentage && quotation.discount_percentage > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>{t('quotations.details.fields.discount')} ({quotation.discount_percentage}%):</span>
                      <span>- {formatCurrency(quotation.amount * (quotation.discount_percentage / 100))}</span>
                    </div>
                  )}
                  {quotation.tax_percentage && quotation.tax_percentage > 0 && (
                    <div className="flex justify-between items-center">
                      <span>{t('quotations.details.fields.tax')} ({quotation.tax_percentage}%):</span>
                      <span>{formatCurrency(quotation.amount * (1 - (quotation.discount_percentage || 0) / 100) * (quotation.tax_percentage / 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t">
                    <span>{t('quotations.details.fields.totalAmount')}:</span>
                    <span>{formatCurrency(quotation.total_amount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuotationDetailSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Customer Info Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
          
          {/* Service Info Skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
          
          {/* Pricing Skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 