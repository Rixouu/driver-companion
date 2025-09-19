"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, addDays, isAfter } from 'date-fns';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';
import { Quotation, QuotationStatus } from '@/types/quotations';
import { getQuotationUrl, getQuotationEditUrl, getQuotationDuplicateUrl } from '@/lib/utils/quotation-url';
import { 
  CalendarIcon, 
  ChevronDownIcon, 
  EyeIcon, 
  FileEditIcon, 
  MailIcon, 
  PlusIcon, 
  SearchIcon, 
  TrashIcon,
  CopyIcon,
  BellIcon,
  AlertCircleIcon,
  Filter,
  TrendingUp,
  DollarSign,
  FileText,
  Clock,
  Download
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { EmptyState } from '@/components/empty-state';

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
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
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
  onDelete,
  onBulkDelete,
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
  
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());

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
    // For Charter Services, always recalculate to ensure correct amount
    if (quotation.service_type?.toLowerCase().includes('charter')) {
      // Skip the total_amount check for Charter Services and recalculate
    } else if (quotation.total_amount && quotation.total_amount > 0) {
      // For other services, use total_amount if it exists
      return quotation.total_amount;
    }

    // If no total_amount, calculate exactly like PDF and quotation-details
    // First calculate service base total from items or fallback to amount
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if ((quotation as any).quotation_items && Array.isArray((quotation as any).quotation_items)) {
      (quotation as any).quotation_items.forEach((item: any) => {
        // For Charter Services, calculate as unit_price × service_days
        let itemBasePrice;
        if (quotation.service_type?.toLowerCase().includes('charter')) {
          itemBasePrice = item.unit_price * (item.service_days || 1);
        } else {
          itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        }
        serviceBaseTotal += itemBasePrice;
        
        if (item.time_based_adjustment) {
          const timeAdjustment = itemBasePrice * (item.time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    } else {
      // For Charter Services without items, calculate from main quotation fields
      if (quotation.service_type?.toLowerCase().includes('charter')) {
        serviceBaseTotal = (quotation.amount || 0) * (quotation.service_days || 1);
      } else {
        serviceBaseTotal = quotation.amount || 0;
      }
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
    // Only show reminders for 'sent' and 'approved' statuses (not converted, paid, rejected, expired)
    if (!['sent', 'approved'].includes(quotation.status)) return false;
    
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
  const handleRowClick = (quotation: Quotation) => {
    router.push(getQuotationUrl(quotation));
  };

  // Handle edit click
  const handleEditClick = (e: React.MouseEvent, quotation: Quotation) => {
    e.stopPropagation();
    router.push(getQuotationEditUrl(quotation));
  };

  // Handle view click
  const handleViewClick = (e: React.MouseEvent, quotation: Quotation) => {
    e.stopPropagation();
    router.push(getQuotationUrl(quotation));
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
  const handleDuplicateClick = (e: React.MouseEvent, quotation: Quotation) => {
    e.stopPropagation();
    router.push(getQuotationDuplicateUrl(quotation));
  };

  // Handle reminder click
  const handleRemindClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onRemind) {
      // Just call the callback - let the dialog handle its own toasts
      onRemind(id);
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedQuotations.size === filteredQuotations.length) {
      setSelectedQuotations(new Set());
    } else {
      setSelectedQuotations(new Set(filteredQuotations.map(quotation => quotation.id)));
    }
  };

  const handleSelectQuotation = (quotationId: string) => {
    const newSelected = new Set(selectedQuotations);
    if (newSelected.has(quotationId)) {
      newSelected.delete(quotationId);
    } else {
      newSelected.add(quotationId);
    }
    setSelectedQuotations(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedQuotations(new Set());
  };

  const handleDeleteSelected = () => {
    if (onBulkDelete && selectedQuotations.size > 0) {
      onBulkDelete(Array.from(selectedQuotations));
      setSelectedQuotations(new Set());
    }
  };

  const handleExportSelected = () => {
    // TODO: Implement CSV export for selected quotations
    console.log('Exporting quotations:', Array.from(selectedQuotations));
    toast({
      title: "Export Started",
      description: `Exporting ${selectedQuotations.size} quotations to CSV...`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton for status filter */}
        <div className="p-4 bg-muted/10 border-b">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </div>
        
        {/* Loading skeleton for filters */}
        <div className="border-b">
          <div className="p-4">
            <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        
        {/* Loading skeleton for table */}
        <div className="p-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
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
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
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
            <Button className="w-full sm:w-auto" onClick={() => router.push('/quotations/create')}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t('quotations.empty.cta')}
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Quotations - Blue */}
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Total Quotations</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{quotations.length.toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* Total Revenue - Green */}
        <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(quotations.reduce((sum, q) => sum + calculateFinalAmount(q), 0), 'JPY')}
            </div>
          </CardContent>
        </Card>

        {/* Pending Quotations - Orange */}
        <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">Pending Quotations</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {quotations.filter(q => ['draft', 'sent'].includes(q.status)).length}
            </div>
          </CardContent>
        </Card>

        {/* Converted Quotations - Purple */}
        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">Converted</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {quotations.filter(q => q.status === 'converted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations by number, customer, email..."
            value={filters.searchQuery}
            onChange={(e) => handleFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Advanced Filters */}
        <div className="border rounded-lg">
          <Button
            variant="ghost"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full justify-between p-4 rounded-none border-b-0"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Advanced Filters</span>
            </div>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {filtersOpen && (
            <QuotationFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              totalQuotations={totalCount}
              className="border-t p-4 space-y-4"
            />
          )}
        </div>

        {/* Quotation Count and View Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredQuotations.length} quotations
          </div>
        </div>

        {/* Select All Bar */}
        <div className="flex flex-col gap-3 px-4 py-3 bg-muted/20 rounded-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedQuotations.size === filteredQuotations.length && filteredQuotations.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              aria-label="Select all quotations"
            />
            <span className="text-sm font-medium text-muted-foreground">Select All</span>
            {selectedQuotations.size > 0 && (
              <span className="text-sm text-muted-foreground">
                ({selectedQuotations.size} of {filteredQuotations.length} selected)
              </span>
            )}
          </div>

          {/* Multi-select Actions */}
          {selectedQuotations.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <TrashIcon className="h-4 w-4" />
                <span className="hidden xs:inline">Delete</span>
                <span className="xs:hidden">Del</span>
                <span className="ml-1">({selectedQuotations.size})</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                className="flex-1 sm:flex-none"
              >
                <span className="hidden xs:inline">Clear Selection</span>
                <span className="xs:hidden">Clear</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4" />
                <span className="hidden xs:inline">Export CSV</span>
                <span className="xs:hidden">Export</span>
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Table View with Headers */}
        <div className="hidden sm:block space-y-3">
          {/* Column Headers */}
          <div className="grid grid-cols-12 items-center gap-4 px-4 py-3 bg-muted/20 rounded-lg">
            <div className="col-span-1">
              <span className="text-sm font-medium text-muted-foreground">Select</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-muted-foreground">ID</span>
            </div>
            <div className="col-span-3">
              <span className="text-sm font-medium text-muted-foreground">Customer</span>
            </div>
            <div className="col-span-2">
              <span className="text-sm font-medium text-muted-foreground">Date</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-muted-foreground">Reminder</span>
            </div>
            <div className="col-span-2">
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
            </div>
            <div className="col-span-2">
              <span className="text-sm font-medium text-muted-foreground">Actions</span>
            </div>
          </div>

          {/* Desktop Quotation Rows */}
          {filteredQuotations.map((quotation) => (
            <Card key={quotation.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden bg-card/95 backdrop-blur" onClick={() => handleRowClick(quotation)}>
              <div className="grid grid-cols-12 items-center gap-4 p-4">
                {/* Selection Checkbox */}
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuotations.has(quotation.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectQuotation(quotation.id);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    aria-label={`Select quotation ${quotation.quote_number}`}
                  />
                </div>
                
                {/* ID Column */}
                <div className="col-span-1 flex items-center gap-3">
                  <div className="font-mono text-sm text-muted-foreground">#{quotation.quote_number}</div>
                </div>
                
                {/* Customer Column - Name and Email */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {quotation.title || t('common.untitled')}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {quotation.customers?.name || quotation.customer_name || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {quotation.customers?.email || quotation.customer_email}
                    </p>
                  </div>
                </div>
                
                {/* Date Column */}
                <div className="col-span-2 space-y-1 flex flex-col items-start justify-start">
                  <div className="text-sm text-foreground">
                    {quotation.created_at && formatDateDDMMYYYY(quotation.created_at)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expires: {getExpiryDate(quotation) ? formatDateDDMMYYYY(getExpiryDate(quotation)!) : '—'}
                  </div>
                </div>
                
                {/* Reminder Column */}
                <div className="col-span-1 flex items-center justify-center">
                  {needsReminder(quotation) ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (onRemind) handleRemindClick(e, quotation.id); 
                        }}
                        className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-full transition-colors"
                        title="Send reminder"
                      >
                        <BellIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">—</div>
                  )}
                </div>
                
                {/* Amount Column */}
                <div className="col-span-2 flex flex-col items-start justify-start">
                  <div className="font-semibold text-sm text-foreground mb-2">
                    {formatCurrency(calculateFinalAmount(quotation), quotation.currency || 'JPY')}
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const finalStatus = getFinalStatus(quotation);
                      return (
                        <Badge variant="outline" className={cn(getQuotationStatusBadgeClasses(finalStatus))}>
                          {t(`quotations.status.${finalStatus}`)}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Actions Column */}
                <div className="col-span-2 flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleViewClick(e, quotation); }}
                    className="flex items-center gap-2"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDuplicateClick(e, quotation); }}
                    className="flex items-center gap-2"
                  >
                    <CopyIcon className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-4">
          {filteredQuotations.map((quotation) => (
            <Card key={quotation.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden bg-card/95 backdrop-blur" onClick={() => handleRowClick(quotation)}>
              <div className="p-4">
                {/* Header with Selection and Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedQuotations.has(quotation.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectQuotation(quotation.id);
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      aria-label={`Select quotation ${quotation.quote_number}`}
                    />
                    <div className="font-mono text-sm text-muted-foreground">#{quotation.quote_number}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const finalStatus = getFinalStatus(quotation);
                      return (
                        <Badge variant="outline" className={cn(getQuotationStatusBadgeClasses(finalStatus))}>
                          {t(`quotations.status.${finalStatus}`)}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Content */}
                <div className="space-y-2 mb-4">
                  <div className="font-semibold text-lg">{quotation.title || t('common.untitled')}</div>
                  <div className="font-medium">{quotation.customers?.name || quotation.customer_name || '—'}</div>
                  <div className="text-sm text-muted-foreground">{quotation.customers?.email || quotation.customer_email}</div>
                </div>
                
                {/* Footer with Date, Amount, and Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <div>
                      <span>{quotation.created_at && format(parseISO(quotation.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div>
                      <span>Expires: {getExpiryDate(quotation) ? format(getExpiryDate(quotation)!, 'MMM d, yyyy') : '—'}</span>
                    </div>
                    {needsReminder(quotation) && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Needs Reminder</span>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (onRemind) handleRemindClick(e, quotation.id); 
                          }}
                          className="ml-1 p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-full transition-colors"
                          title="Send reminder"
                        >
                          <BellIcon className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="font-semibold text-lg">
                    {formatCurrency(calculateFinalAmount(quotation), quotation.currency || 'JPY')}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleViewClick(e, quotation); }}
                    className="flex items-center gap-2 w-full justify-center"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Details
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDuplicateClick(e, quotation); }}
                    className="flex items-center gap-2 w-full justify-center"
                  >
                    <CopyIcon className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t pt-4">
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
            <div className="text-center text-xs sm:text-sm text-muted-foreground mt-2 px-2">
              Page {currentPage} of {totalPages} • Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} quotations
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 