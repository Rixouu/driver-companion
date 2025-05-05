"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { format, parseISO } from 'date-fns';
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

interface QuotationListProps {
  quotations: Quotation[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
  onSend?: (id: string) => void;
  onRemind?: (id: string) => void;
}

export default function QuotationList({
  quotations,
  isLoading = false,
  onRefresh,
  onDelete,
  onSend,
  onRemind
}: QuotationListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all');
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>(quotations);

  // Apply filters when search query, status filter, or quotations list changes
  useEffect(() => {
    let filtered = [...quotations];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // Apply search filter - search in title, customer name, and email
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(quote => 
        (quote.title && quote.title.toLowerCase().includes(query)) ||
        (quote.customer_name && quote.customer_name.toLowerCase().includes(query)) ||
        (quote.customer_email && quote.customer_email.toLowerCase().includes(query)) ||
        (quote.quote_number && quote.quote_number.toString().includes(query))
      );
    }

    setFilteredQuotations(filtered);
  }, [quotations, searchQuery, statusFilter]);
  
  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    // Always use JPY currency format with ¥ symbol and no decimal places
    return `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Check if quotation is expired
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  // Check if quotation needs reminder
  const needsReminder = (quotation: Quotation) => {
    // If not in 'sent' status, no reminder needed
    if (quotation.status !== 'sent') return false;
    
    // If already expired, no reminder needed
    if (isExpired(quotation.expiry_date)) return false;
    
    // Get quotation creation or last activity date
    const lastActivityDate = new Date(quotation.updated_at || quotation.created_at);
    const now = new Date();
    
    // If created more than 24 hours ago, needs reminder
    const hoursSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceActivity >= 24) return true;
    
    // Check if nearing expiry (24h before expiry)
    const expiryDate = new Date(quotation.expiry_date);
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  };

  // Get status badge
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

  // Handle clicking on a row
  const handleRowClick = (id: string) => {
    router.push(`/quotations/${id}` as any);
  };

  // Handle edit click
  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/quotations/${id}/edit` as any);
  };

  // Handle view click
  const handleViewClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/quotations/${id}` as any);
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
    router.push(`/quotations/create?duplicate=${id}` as any);
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

  if (quotations.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon className="h-10 w-10 text-muted-foreground" />}
        title={t('quotations.empty.title')}
        description={t('quotations.empty.description')}
        action={
          <Button onClick={() => router.push('/quotations/create' as any)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('quotations.empty.cta')}
          </Button>
        }
      />
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Search Bar Section */}
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
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onRefresh}
              className="h-9 w-9"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSearchQuery('')}
              className="whitespace-nowrap"
            >
              {t('quotations.filters.clearFilters')}
            </Button>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="p-4 bg-muted/10 border-b">
          <QuotationStatusFilter 
            currentStatus={statusFilter}
            onChange={(value) => setStatusFilter(value)}
          />
        </div>

        <div className="p-4">
          {filteredQuotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircleIcon className="mx-auto h-8 w-8 mb-2" />
              <p>{t('quotations.filters.noResults')}</p>
            </div>
          ) : (
            <>
              {/* Card view for mobile */}
              <div className="md:hidden space-y-4">
                {filteredQuotations.map((quotation) => (
                  <div 
                    key={quotation.id}
                    className="rounded-lg border bg-card shadow-sm hover:bg-accent/10 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(quotation.id)}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-mono text-xs">#{quotation.quote_number}</div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(quotation.status, quotation.expiry_date)}
                          {needsReminder(quotation) && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <AlertCircleIcon className="h-3 w-3 mr-1" />
                              {t('quotations.actions.remind')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="font-medium mb-1">{quotation.customer_name || '—'}</div>
                      <div className="text-xs text-muted-foreground mb-3 truncate">{quotation.customer_email}</div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {quotation.created_at && format(parseISO(quotation.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="font-semibold text-right">
                          {formatCurrency(quotation.total_amount, 'JPY')}
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
                        
                        {quotation.status === 'sent' && !isExpired(quotation.expiry_date) && (
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
                        
                        {['draft', 'rejected', 'expired'].includes(quotation.status) && (
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
                            >
                              <FileEditIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Table view for desktop */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[90px]">{t('quotations.listColumns.id')}</TableHead>
                      <TableHead>{t('quotations.listColumns.customer')}</TableHead>
                      <TableHead>{t('quotations.listColumns.date')}</TableHead>
                      <TableHead>{t('quotations.listColumns.amount')}</TableHead>
                      <TableHead>{t('quotations.listColumns.status')}</TableHead>
                      <TableHead>{t('quotations.listColumns.expiresOn')}</TableHead>
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
                        <TableCell className="font-mono text-xs sm:text-sm">#{quotation.quote_number}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm sm:text-base">{quotation.customer_name || '—'}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] md:max-w-none">{quotation.customer_email}</div>
                        </TableCell>
                        <TableCell>
                          {quotation.created_at && format(parseISO(quotation.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(quotation.total_amount, 'JPY')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(quotation.status, quotation.expiry_date)}
                        </TableCell>
                        <TableCell>
                          {quotation.expiry_date && (
                            <div className={isExpired(quotation.expiry_date) ? 'text-red-500' : ''}>
                              {format(parseISO(quotation.expiry_date), 'MMM d, yyyy')}
                              {needsReminder(quotation) && (
                                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
                                  <BellIcon className="h-3 w-3 mr-1" />
                                  {t('quotations.actions.remind')}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="flex justify-start items-center space-x-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewClick(e, quotation.id); }} className="h-8 w-8">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            
                            {quotation.status === 'draft' && (
                              <>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditClick(e, quotation.id); }} className="h-8 w-8">
                                  <FileEditIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleSendClick(e, quotation.id); }} className="h-8 w-8">
                                  <MailIcon className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            {quotation.status === 'sent' && !isExpired(quotation.expiry_date) && (
                              <Button 
                                variant={needsReminder(quotation) ? "secondary" : "ghost"} 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); handleRemindClick(e, quotation.id); }} 
                                className="h-8 w-8"
                              >
                                <BellIcon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => { e.stopPropagation(); handleDuplicateClick(e, quotation.id); }} 
                              className="h-8 w-8"
                              title={t('quotations.actions.copy')}
                            >
                              <CopyIcon className="h-4 w-4" />
                            </Button>
                            
                            {['draft', 'rejected', 'expired'].includes(quotation.status) && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, quotation.id); }}
                                className="h-8 w-8 text-red-600 hover:text-red-600"
                                title={t('quotations.actions.delete')}
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 