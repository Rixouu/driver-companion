"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, addDays, isAfter } from 'date-fns';
import { Quotation, QuotationStatus } from '@/types/quotations';
import { 
  CalendarIcon, 
  ChevronDownIcon, 
  EyeIcon, 
  FileEditIcon, 
  MailIcon, 
  MoreHorizontalIcon, 
  PlusIcon, 
  SearchIcon, 
  TrashIcon,
  CopyIcon,
  BellIcon,
  AlertCircleIcon,
  RefreshCwIcon
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { EmptyState } from '@/components/empty-state';
import LoadingSpinner from '@/components/shared/loading-spinner';
import { QuotationFilters, QuotationFilterOptions } from './quotation-filters';
import { cn } from '@/lib/utils';
import { getQuotationStatusBadgeClasses } from '@/lib/utils/styles';
import { useToast } from '@/components/ui/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface QuotationListProps {
  quotations: Quotation[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
  onSend?: (id: string) => void;
  onRemind?: (id: string) => void;
  isOrganizationMember?: boolean;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  filterParams: {
    query?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
  };
}

export default function QuotationList({
  quotations,
  isLoading = false,
  onRefresh,
  onDelete,
  onSend,
  onRemind,
  isOrganizationMember = true,
  totalCount,
  totalPages,
  currentPage,
  filterParams
}: QuotationListProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const currentSearchParams = useSearchParams() ?? new URLSearchParams();

  const initialSearchQuery = currentSearchParams.get('query') || '';
  const initialStatusFilter = (currentSearchParams.get('status') as QuotationStatus | 'all') || 'all';
  const initialDateFrom = currentSearchParams.get('dateFrom') || '';
  const initialDateTo = currentSearchParams.get('dateTo') || '';
  const initialAmountMin = currentSearchParams.get('amountMin') ? parseFloat(currentSearchParams.get('amountMin')!) : undefined;
  const initialAmountMax = currentSearchParams.get('amountMax') ? parseFloat(currentSearchParams.get('amountMax')!) : undefined;

  const [filters, setFilters] = useState<QuotationFilterOptions>({
    statusFilter: initialStatusFilter,
    searchQuery: initialSearchQuery,
    sortBy: 'time',
    sortOrder: 'desc',
    dateFrom: initialDateFrom || undefined,
    dateTo: initialDateTo || undefined,
    amountMin: initialAmountMin,
    amountMax: initialAmountMax
  });

  // Check if quotation is expired - Updated to use 2 days from creation
  const isExpired = (quotation: Quotation) => {
    if (!quotation.created_at) return false;
    const now = new Date();
    const createdDate = new Date(quotation.created_at);
    const properExpiryDate = addDays(createdDate, 2);
    return isAfter(now, properExpiryDate);
  };

  // Derived list based on current filters
  const filteredQuotations = useMemo(() => {
    let list = [...quotations];

    // Apply status filter (client-side safeguard)
    if (filters.statusFilter !== 'all') {
      if (filters.statusFilter === 'expired') {
        list = list.filter((q) => q.status === 'expired' || isExpired(q));
      } else {
        list = list.filter((q) => q.status === filters.statusFilter);
      }
    }

    // Apply basic text search over customer name / email / quote number
    const q = filters.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((quotation) => {
        const numberMatch = String(quotation.quote_number ?? '').includes(q);
        const nameMatch = (quotation.customers?.name ?? '').toLowerCase().includes(q);
        const emailMatch = (quotation.customers?.email ?? '').toLowerCase().includes(q);
        return numberMatch || nameMatch || emailMatch;
      });
    }

    return list;
  }, [quotations, filters.statusFilter, filters.searchQuery]);

  const updateUrlWithFilters = useCallback(
    (newFilters: QuotationFilterOptions) => {
      const params = new URLSearchParams(currentSearchParams.toString());
      
      if (newFilters.searchQuery.trim() !== '') {
        params.set('query', newFilters.searchQuery.trim());
      } else {
        params.delete('query');
      }
      
      if (newFilters.statusFilter !== 'all') {
        params.set('status', newFilters.statusFilter);
      } else {
        params.delete('status');
      }
      
      if (newFilters.dateFrom) {
        params.set('dateFrom', newFilters.dateFrom);
      } else {
        params.delete('dateFrom');
      }
      
      if (newFilters.dateTo) {
        params.set('dateTo', newFilters.dateTo);
      } else {
        params.delete('dateTo');
      }
      
      if (newFilters.amountMin !== undefined) {
        params.set('amountMin', newFilters.amountMin.toString());
      } else {
        params.delete('amountMin');
      }
      
      if (newFilters.amountMax !== undefined) {
        params.set('amountMax', newFilters.amountMax.toString());
      } else {
        params.delete('amountMax');
      }
      
      if (pathname) router.push(`${pathname}?${params.toString()}` as any, { scroll: false });
    },
    [currentSearchParams, pathname, router]
  );

  useEffect(() => {
    setFilters({
      statusFilter: initialStatusFilter,
      searchQuery: initialSearchQuery,
      sortBy: 'time',
      sortOrder: 'desc',
      dateFrom: initialDateFrom || undefined,
      dateTo: initialDateTo || undefined,
      amountMin: initialAmountMin,
      amountMax: initialAmountMax
    });
  }, [initialSearchQuery, initialStatusFilter, initialDateFrom, initialDateTo, initialAmountMin, initialAmountMax]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (filters.searchQuery !== initialSearchQuery) {
        updateUrlWithFilters(filters);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.searchQuery, updateUrlWithFilters, initialSearchQuery]);
  
  const handleFiltersChange = useCallback(
    (newFilters: QuotationFilterOptions) => {
      setFilters(newFilters);
      updateUrlWithFilters(newFilters);
    },
    [updateUrlWithFilters]
  );

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    // Always use JPY currency format with ¥ symbol and no decimal places
    return `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate final amount after tax and discount for display - EXACTLY matching PDF/quotation-details logic
  const calculateFinalAmount = (quotation: Quotation) => {
    // ALWAYS prioritize total_amount if it exists - this is the final calculated amount
    if (quotation.total_amount && quotation.total_amount > 0) {
      return quotation.total_amount;
    }

    // If no total_amount, calculate exactly like PDF and quotation-details
    // First calculate service base total from items or fallback to amount
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if ((quotation as any).quotation_items && Array.isArray((quotation as any).quotation_items)) {
      (quotation as any).quotation_items.forEach((item: any) => {
        const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        serviceBaseTotal += itemBasePrice;
        
        if (item.time_based_adjustment) {
          const timeAdjustment = itemBasePrice * (item.time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    } else {
      serviceBaseTotal = quotation.amount || 0;
    }
    
    const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
    const packageTotal = 0; // Packages would need to be fetched separately
    const baseTotal = serviceTotal + packageTotal;
    
    const discountPercentage = quotation.discount_percentage || 0;
    const taxPercentage = quotation.tax_percentage || 0;
    
    // Use stored promotion discount (this is the calculated final discount amount)
    const promotionDiscount = quotation.promotion_discount || 0;
    
    // Calculate regular discount on base total
    const regularDiscount = baseTotal * (discountPercentage / 100);
    const totalDiscount = promotionDiscount + regularDiscount;
    
    // Calculate subtotal after all discounts
    const subtotal = Math.max(0, baseTotal - totalDiscount);
    
    // Calculate tax on subtotal (after discounts, not on base)
    const taxAmount = subtotal * (taxPercentage / 100);
    
    // Final total
    const finalTotal = subtotal + taxAmount;
    
    return finalTotal;
  };

  // Get expiry date properly - 2 days from creation
  const getExpiryDate = (quotation: Quotation) => {
    if (!quotation.created_at) return null;
    const createdDate = new Date(quotation.created_at);
    return addDays(createdDate, 2);
  };

  // Check if quotation needs reminder
  const needsReminder = (quotation: Quotation) => {
    // If not in 'sent' status, no reminder needed
    if (quotation.status !== 'sent') return false;
    
    // If already expired, no reminder needed
    if (isExpired(quotation)) return false;
    
    // Get quotation creation or last activity date
    const lastActivityDate = new Date(quotation.updated_at || quotation.created_at);
    const now = new Date();
    
    // If created more than 24 hours ago, needs reminder
    const hoursSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceActivity >= 24) return true;
    
    // Check if nearing expiry (24h before expiry)
    const expiryDate = getExpiryDate(quotation);
    if (!expiryDate) return false;
    
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  };

  const getFinalStatus = (quotation: Quotation): QuotationStatus => {
    if ((quotation.status === 'draft' || quotation.status === 'sent') && isExpired(quotation)) {
      return 'expired';
    }
    return quotation.status;
  };

  // Get status badge
  const getStatusBadge = (status: QuotationStatus, quotation: Quotation) => {
    // Expired handling (orange)
    const expiredBadge = (
      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20">
        {t('quotations.status.expired')}
      </Badge>
    );

    if ((status === 'draft' || status === 'sent') && isExpired(quotation)) {
      return expiredBadge;
    }

    // Otherwise, show the actual status
    switch (status) {
      case 'expired':
        return expiredBadge;
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
      case 'paid':
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20">
            {t('quotations.status.paid')}
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

  // Handle clicking on a row
  const handleRowClick = (id: string) => {
    router.push(`/quotations/${id}`);
  };

  // Handle edit click
  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/quotations/${id}/edit`);
  };

  // Handle view click
  const handleViewClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/quotations/${id}`);
  };

  // Handle delete click
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  // Handle send click
  const handleSendClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onSend) {
      onSend(id);
    }
  };

  // Handle duplicate click
  const handleDuplicateClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/quotations/create?duplicate=${id}`);
  };

  // Handle reminder click
  const handleRemindClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onRemind) {
      // Just call the callback - let the dialog handle its own toasts
      onRemind(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (filteredQuotations.length === 0 && (filters.searchQuery || filters.statusFilter !== 'all')) {
    return (
      <EmptyState
        icon={<SearchIcon className="h-10 w-10 text-muted-foreground" />}
        title={t('quotations.empty.noResultsTitle')}
        description={t('quotations.empty.noResultsDescription')}
        action={
          <Button variant="outline" onClick={() => {
            handleFiltersChange({
              ...filters,
              searchQuery: '',
              statusFilter: 'all',
              dateFrom: undefined,
              dateTo: undefined,
              amountMin: undefined,
              amountMax: undefined
            });
          }}>
            {t('quotations.empty.clearFilters')}
          </Button>
        }
      />
    );
  }

  if (filteredQuotations.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon className="h-10 w-10 text-muted-foreground" />}
        title={t('quotations.empty.title')}
        description={t('quotations.empty.description')}
        action={
          isOrganizationMember ? (
            <Button onClick={() => router.push('/quotations/create')}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t('quotations.empty.cta')}
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex justify-end">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onRefresh}
                className="h-9 w-9 shrink-0"
                disabled={isLoading}
              >
                <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        
        {/* Quotation Filters */}
        <QuotationFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalQuotations={totalCount}
        />

        <div className="p-4">
          <div className="md:hidden space-y-4">
            {filteredQuotations.map((quotation) => (
              <div 
                key={quotation.id}
                className="rounded-lg border bg-card shadow-md hover:ring-2 hover:ring-primary/40 cursor-pointer transition-all"
                onClick={() => handleRowClick(quotation.id)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono text-xs">#{quotation.quote_number}</div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const finalStatus = getFinalStatus(quotation);
                        return (
                          <Badge variant="outline" className={cn(getQuotationStatusBadgeClasses(finalStatus))}>
                            {t(`quotations.status.${finalStatus}`)}
                          </Badge>
                        );
                      })()}
                      {needsReminder(quotation) && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">
                          <AlertCircleIcon className="h-3 w-3 mr-1" />
                          {t('quotations.actions.remind')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="font-semibold mb-1">{quotation.title || t('common.untitled')}</div>
                  <div className="font-medium mb-1">{quotation.customers?.name || quotation.customer_name || '—'}</div>
                  <div className="text-xs text-muted-foreground mb-3 truncate">{quotation.customers?.email || quotation.customer_email}</div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {quotation.created_at && format(parseISO(quotation.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="font-semibold text-right">
                      {formatCurrency(calculateFinalAmount(quotation), quotation.currency || 'JPY')}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleViewClick(e, quotation.id); }}
                      title={t('quotations.actions.view')}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    
                    {isOrganizationMember && (
                      <>
                        {quotation.status === 'sent' && !isExpired(quotation) && onRemind && (
                          <Button 
                            variant={needsReminder(quotation) ? "secondary" : "ghost"} 
                            size="icon"
                            className={cn(
                              "h-8 w-8",
                              needsReminder(quotation) 
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                              'transition-colors'
                            )}
                            onClick={(e) => { e.stopPropagation(); handleRemindClick(e, quotation.id); }}
                            title={t('quotations.actions.remind')}
                          >
                            <BellIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); handleDuplicateClick(e, quotation.id); }}
                          title={t('quotations.actions.copy')}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                        
                        {(['draft', 'rejected'].includes(quotation.status) || isExpired(quotation)) && onDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-600"
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, quotation.id); }}
                            title={t('quotations.actions.delete')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {quotation.status === 'draft' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); handleEditClick(e, quotation.id); }}
                              title={t('quotations.actions.edit')}
                            >
                              <FileEditIcon className="h-4 w-4" />
                            </Button>
                           {onSend && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleSendClick(e, quotation.id); }}
                                title={t('quotations.actions.send')}
                              >
                                <MailIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[90px] text-left">{t('quotations.listColumns.id')}</TableHead>
                  <TableHead className="text-left">{t('quotations.listColumns.customer')}</TableHead>
                  <TableHead className="text-left">{t('quotations.listColumns.date')}</TableHead>
                  <TableHead className="text-left">{t('quotations.listColumns.amount')}</TableHead>
                  <TableHead className="text-left">{t('quotations.listColumns.status')}</TableHead>
                  <TableHead className="text-left">{t('quotations.listColumns.expiresOn')}</TableHead>
                  <TableHead className="text-left">{t('quotations.listColumns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow 
                    key={quotation.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(quotation.id)}
                  >
                    <TableCell className="font-mono text-xs sm:text-sm text-left">#{quotation.quote_number}</TableCell>
                    <TableCell className="text-left">
                      {isOrganizationMember ? (
                        quotation.customers?.name || quotation.customer_name || t('common.notAvailableShort')
                      ) : (
                        t('common.confidential')
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      {format(parseISO(quotation.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-left">
                      {formatCurrency(calculateFinalAmount(quotation), quotation.currency || 'JPY')}
                    </TableCell>
                    <TableCell className="text-left">
                      {(() => {
                        const finalStatus = getFinalStatus(quotation);
                        return (
                          <Badge variant="outline" className={cn(getQuotationStatusBadgeClasses(finalStatus))}>
                            {t(`quotations.status.${finalStatus}`)}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex flex-col items-start gap-1">
                        <span>{getExpiryDate(quotation) ? format(getExpiryDate(quotation)!, 'dd MMM yyyy') : t('common.notAvailableShort')}</span>
                        {needsReminder(quotation) && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700 inline-flex items-center mt-1">
                            <AlertCircleIcon className="h-3 w-3 mr-1" />
                            {t('quotations.actions.remind')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-start gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => handleViewClick(e, quotation.id)}
                          title={t('quotations.actions.view')}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>

                        {isOrganizationMember && quotation.status === 'draft' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleEditClick(e, quotation.id)}
                            title={t('quotations.actions.edit')}
                          >
                            <FileEditIcon className="h-4 w-4" />
                          </Button>
                        )}

                        {isOrganizationMember && quotation.status === 'draft' && onSend && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleSendClick(e, quotation.id)}
                            title={t('quotations.actions.send')}
                          >
                            <MailIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {isOrganizationMember && onRemind && (
                          <Button
                            variant={needsReminder(quotation) ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={(e) => handleRemindClick(e, quotation.id)}
                            title={t('quotations.actions.remind')}
                            className={cn(
                              needsReminder(quotation) 
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                              'transition-colors'
                            )}
                          >
                            <BellIcon className="h-4 w-4" />
                          </Button>
                        )}

                        {isOrganizationMember && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleDuplicateClick(e, quotation.id)}
                            title={t('quotations.actions.duplicate')}
                          >
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                        )}

                        {isOrganizationMember && (['draft','rejected'].includes(quotation.status) || isExpired(quotation)) && onDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleDeleteClick(e, quotation.id)}
                            title={t('quotations.actions.delete')}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent className="flex justify-center">
                {/* Previous Page */}
                <PaginationItem>
                  <PaginationPrevious 
                    href={`${pathname}?${new URLSearchParams({
                      ...Object.fromEntries(currentSearchParams.entries()),
                      page: (currentPage - 1).toString()
                    }).toString()}`}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href={`${pathname}?${new URLSearchParams({
                          ...Object.fromEntries(currentSearchParams.entries()),
                          page: pageNum.toString()
                        }).toString()}`}
                        isActive={pageNum === currentPage}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {/* Ellipsis for long page ranges */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Next Page */}
                <PaginationItem>
                  <PaginationNext 
                    href={`${pathname}?${new URLSearchParams({
                      ...Object.fromEntries(currentSearchParams.entries()),
                      page: (currentPage + 1).toString()
                    }).toString()}`}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            
            {/* Page Info */}
            <div className="text-center text-sm text-muted-foreground mt-2">
              Page {currentPage} of {totalPages} • Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} quotations
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 