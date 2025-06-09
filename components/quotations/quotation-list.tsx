"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { QuotationStatusFilter } from './quotation-status-filter';
import { cn } from '@/lib/utils';

interface QuotationListProps {
  quotations: Quotation[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
  onSend?: (id: string) => void;
  onRemind?: (id: string) => void;
  isOrganizationMember?: boolean;
}

export default function QuotationList({
  quotations,
  isLoading = false,
  onRefresh,
  onDelete,
  onSend,
  onRemind,
  isOrganizationMember = true
}: QuotationListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const currentSearchParams = useSearchParams() ?? new URLSearchParams();

  const initialSearchQuery = currentSearchParams.get('query') || '';
  const initialStatusFilter = (currentSearchParams.get('status') as QuotationStatus | 'all') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>(initialStatusFilter);

  const debouncedUpdateUrlQuery = useCallback(
    (newQuery: string) => {
      const params = new URLSearchParams(currentSearchParams.toString());
      if (newQuery.trim() !== '') {
        params.set('query', newQuery.trim());
      } else {
        params.delete('query');
      }
      if (pathname) router.push(`${pathname}?${params.toString()}` as any, { scroll: false });
    },
    [currentSearchParams, pathname, router]
  );

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
    setStatusFilter(initialStatusFilter);
  }, [initialSearchQuery, initialStatusFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== initialSearchQuery) {
        debouncedUpdateUrlQuery(searchQuery);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, debouncedUpdateUrlQuery, initialSearchQuery]);
  
  const handleStatusFilterChange = useCallback(
    (newStatus: QuotationStatus | 'all') => {
      setStatusFilter(newStatus);
      const params = new URLSearchParams(currentSearchParams.toString());
      if (newStatus !== 'all') {
        params.set('status', newStatus);
      } else {
        params.delete('status');
      }
      if (pathname) router.push(`${pathname}?${params.toString()}` as any, { scroll: false });
    },
    [currentSearchParams, pathname, router, setStatusFilter]
  );

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    // Always use JPY currency format with ¥ symbol and no decimal places
    return `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Check if quotation is expired - Updated to use 2 days from creation
  const isExpired = (quotation: Quotation) => {
    if (!quotation.created_at) return false;
    const now = new Date();
    const createdDate = new Date(quotation.created_at);
    const properExpiryDate = addDays(createdDate, 2);
    return isAfter(now, properExpiryDate);
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

  // Get status badge
  const getStatusBadge = (status: QuotationStatus, quotation: Quotation) => {
    // If status is draft or sent and the quotation is expired, show expired badge
    if ((status === 'draft' || status === 'sent') && isExpired(quotation)) {
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

  if (quotations.length === 0 && (initialSearchQuery || initialStatusFilter !== 'all')) {
    return (
      <EmptyState
        icon={<SearchIcon className="h-10 w-10 text-muted-foreground" />}
        title={t('quotations.empty.noResultsTitle')}
        description={t('quotations.empty.noResultsDescription')}
        action={
          <Button variant="outline" onClick={() => {
            setSearchQuery('');
            handleStatusFilterChange('all');
          }}>
            {t('quotations.empty.clearFilters')}
          </Button>
        }
      />
    );
  }

  if (quotations.length === 0) {
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
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('quotations.filters.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
        
        <div className="p-4 bg-muted/10 border-b">
          <QuotationStatusFilter 
            currentStatus={statusFilter}
            onChange={handleStatusFilterChange}
          />
        </div>

        <div className="p-4">
          <div className="md:hidden space-y-4">
            {quotations.map((quotation) => (
              <div 
                key={quotation.id}
                className="rounded-lg border bg-card shadow-sm hover:bg-accent/10 cursor-pointer transition-colors"
                onClick={() => handleRowClick(quotation.id)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono text-xs">#{quotation.quote_number}</div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(quotation.status, quotation)}
                      {needsReminder(quotation) && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertCircleIcon className="h-3 w-3 mr-1" />
                          {t('quotations.actions.remind')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="font-medium mb-1">{quotation.customers?.name || '—'}</div>
                  <div className="text-xs text-muted-foreground mb-3 truncate">{quotation.customers?.email}</div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {quotation.created_at && format(parseISO(quotation.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="font-semibold text-right">
                      {formatCurrency(quotation.total_amount || quotation.amount || 0, quotation.currency || 'JPY')}
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
                            className="h-8 w-8"
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
                        
                        {['draft', 'rejected'].includes(quotation.status) && onDelete && (
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
                {quotations.map((quotation) => (
                  <TableRow 
                    key={quotation.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(quotation.id)}
                  >
                    <TableCell className="font-mono text-xs sm:text-sm text-left">#{quotation.quote_number}</TableCell>
                    <TableCell className="text-left">
                      {isOrganizationMember ? (
                        quotation.customers?.name || t('common.notAvailableShort')
                      ) : (
                        t('common.confidential')
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      {format(parseISO(quotation.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-left">
                      {formatCurrency(quotation.total_amount || quotation.amount || 0, quotation.currency || 'JPY')}
                    </TableCell>
                    <TableCell className="text-left">
                      {getStatusBadge(quotation.status, quotation)}
                    </TableCell>
                    <TableCell className="text-left">
                      {getExpiryDate(quotation) ? format(getExpiryDate(quotation)!, 'dd MMM yyyy') : t('common.notAvailableShort')}
                    </TableCell>
                    <TableCell className="space-x-1 text-left">
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
                      
                      {isOrganizationMember && needsReminder(quotation) && onRemind && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleRemindClick(e, quotation.id)}
                          title={t('quotations.actions.remind')}
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

                      {isOrganizationMember && quotation.status === 'draft' && onDelete && (
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 