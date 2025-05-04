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

  // Status filter options
  const statusOptions = [
    { value: 'all', label: t('quotations.filters.all') },
    { value: 'draft', label: t('quotations.status.draft') },
    { value: 'sent', label: t('quotations.status.sent') },
    { value: 'approved', label: t('quotations.status.approved') },
    { value: 'rejected', label: t('quotations.status.rejected') },
    { value: 'expired', label: t('quotations.status.expired') },
    { value: 'converted', label: t('quotations.status.converted') }
  ];

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
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>{t('quotations.list.title')}</CardTitle>
            <CardDescription>
              {t('quotations.description')}
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSearchQuery('')}
              className="hidden sm:flex"
            >
              {t('quotations.filters.clearFilters')}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onRefresh}
              className="h-9 w-9"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => router.push('/quotations/create' as any)}
              className="h-9 flex-1 sm:flex-initial"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('quotations.create')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  {statusOptions.find(option => option.value === statusFilter)?.label}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {statusOptions.map(option => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => setStatusFilter(option.value as QuotationStatus | 'all')}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-7 w-7 rounded-full">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleViewClick(e, quotation.id)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              {t('quotations.actions.view')}
                            </DropdownMenuItem>
                            
                            {quotation.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => handleEditClick(e, quotation.id)}>
                                <FileEditIcon className="h-4 w-4 mr-2" />
                                {t('quotations.actions.edit')}
                              </DropdownMenuItem>
                            )}
                            
                            {quotation.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => handleSendClick(e, quotation.id)}>
                                <MailIcon className="h-4 w-4 mr-2" />
                                {t('quotations.actions.send')}
                              </DropdownMenuItem>
                            )}
                            
                            {quotation.status === 'sent' && !isExpired(quotation.expiry_date) && (
                              <DropdownMenuItem onClick={(e) => handleRemindClick(e, quotation.id)}>
                                <BellIcon className="h-4 w-4 mr-2" />
                                {t('quotations.actions.remind')}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={(e) => handleDuplicateClick(e, quotation.id)}>
                              <CopyIcon className="h-4 w-4 mr-2" />
                              {t('quotations.actions.copy')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {['draft', 'rejected', 'expired'].includes(quotation.status) && (
                              <DropdownMenuItem 
                                onClick={(e) => handleDeleteClick(e, quotation.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                {t('quotations.actions.delete')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  </div>
                </div>
              ))}
            </div>
            
            {/* Table view for desktop */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">{t('quotations.list.id')}</TableHead>
                    <TableHead>{t('quotations.list.customer')}</TableHead>
                    <TableHead>{t('quotations.list.date')}</TableHead>
                    <TableHead>{t('quotations.list.amount')}</TableHead>
                    <TableHead>{t('quotations.list.status')}</TableHead>
                    <TableHead>{t('quotations.list.expiresOn')}</TableHead>
                    <TableHead className="w-[70px] text-right">{t('quotations.list.actions')}</TableHead>
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
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right p-0 pr-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-8 w-8">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleViewClick(e, quotation.id)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              {t('quotations.actions.view')}
                            </DropdownMenuItem>
                            
                            {quotation.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => handleEditClick(e, quotation.id)}>
                                <FileEditIcon className="h-4 w-4 mr-2" />
                                {t('quotations.actions.edit')}
                              </DropdownMenuItem>
                            )}
                            
                            {quotation.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => handleSendClick(e, quotation.id)}>
                                <MailIcon className="h-4 w-4 mr-2" />
                                {t('quotations.actions.send')}
                              </DropdownMenuItem>
                            )}
                            
                            {quotation.status === 'sent' && !isExpired(quotation.expiry_date) && (
                              <DropdownMenuItem onClick={(e) => handleRemindClick(e, quotation.id)}>
                                <BellIcon className="h-4 w-4 mr-2" />
                                {t('quotations.actions.remind')}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={(e) => handleDuplicateClick(e, quotation.id)}>
                              <CopyIcon className="h-4 w-4 mr-2" />
                              {t('quotations.actions.copy')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {['draft', 'rejected', 'expired'].includes(quotation.status) && (
                              <DropdownMenuItem 
                                onClick={(e) => handleDeleteClick(e, quotation.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                {t('quotations.actions.delete')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 