'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Search, X, SortAsc, SortDesc, Calendar, DollarSign } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { QuotationStatus } from '@/types/quotations'

export interface QuotationFilterOptions {
  statusFilter: string
  searchQuery: string
  sortBy: 'time' | 'amount' | 'customer' | 'quote_number'
  sortOrder: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
}

interface QuotationFiltersProps {
  filters: QuotationFilterOptions
  onFiltersChange: (filters: QuotationFilterOptions) => void
  totalQuotations: number
  className?: string
}

export function QuotationFilters({
  filters,
  onFiltersChange,
  totalQuotations,
  className = ""
}: QuotationFiltersProps) {
  const { t } = useI18n()

  const clearFilters = () => {
    onFiltersChange({
      statusFilter: 'all',
      searchQuery: '',
      sortBy: 'time',
      sortOrder: 'desc',
      dateFrom: undefined,
      dateTo: undefined,
      amountMin: undefined,
      amountMax: undefined
    })
  }

  const hasActiveFilters = filters.statusFilter !== 'all' || 
                          filters.searchQuery || 
                          filters.dateFrom || 
                          filters.dateTo || 
                          filters.amountMin !== undefined || 
                          filters.amountMax !== undefined

  return (
        <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('quotations.filters.title') || 'Filters & Search'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('quotations.filters.status') || 'Status'}
            </label>
            <Select 
              value={filters.statusFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                statusFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('quotations.filters.allStatuses') || 'All Statuses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('quotations.filters.allStatuses') || 'All Statuses'}</SelectItem>
                <SelectItem value="draft">{t('quotations.status.draft') || 'Draft'}</SelectItem>
                <SelectItem value="sent">{t('quotations.status.sent') || 'Sent'}</SelectItem>
                <SelectItem value="approved">{t('quotations.status.approved') || 'Approved'}</SelectItem>
                <SelectItem value="paid">{t('quotations.status.paid') || 'Paid'}</SelectItem>
                <SelectItem value="rejected">{t('quotations.status.rejected') || 'Rejected'}</SelectItem>
                <SelectItem value="expired">{t('quotations.status.expired') || 'Expired'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range Filters */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('quotations.filters.dateFrom') || 'From Date'}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateFrom: e.target.value || undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('quotations.filters.dateTo') || 'To Date'}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateTo: e.target.value || undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Amount Range Filters */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('quotations.filters.amountMin') || 'Min Amount'}
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="number"
                placeholder="0"
                value={filters.amountMin || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  amountMin: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('quotations.filters.amountMax') || 'Max Amount'}
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="number"
                placeholder="∞"
                value={filters.amountMax || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  amountMax: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('quotations.filters.search') || 'Search'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('quotations.filters.searchPlaceholder') || 'Search customers, services...'}
                value={filters.searchQuery}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  searchQuery: e.target.value
                })}
                className="pl-10 pr-10"
              />
              {filters.searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => onFiltersChange({
                    ...filters,
                    searchQuery: ''
                  })}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Sorting and Actions */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{t('quotations.filters.sortBy') || 'Sort by:'}</label>
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                sortBy: value as 'time' | 'amount' | 'customer' | 'quote_number'
              })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">{t('quotations.filters.sortTime') || 'Time'}</SelectItem>
                <SelectItem value="amount">{t('quotations.filters.sortAmount') || 'Amount'}</SelectItem>
                <SelectItem value="customer">{t('quotations.filters.sortCustomer') || 'Customer'}</SelectItem>
                <SelectItem value="quote_number">{t('quotations.filters.sortQuoteNumber') || 'Quote #'}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({
                ...filters,
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
              })}
              className="p-2"
            >
              {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
          
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              {t('quotations.filters.clearFilters') || 'Clear Filters'}
            </Button>
          )}
        </div>
        
        {/* Results Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <span>{t('quotations.filters.filteredResults', { count: totalQuotations }) || `Filtered results: ${totalQuotations} quotations`}</span>
            ) : (
              <span>{t('quotations.filters.showingAll', { count: totalQuotations }) || `Showing all ${totalQuotations} quotations`}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
              {totalQuotations} {t('quotations.filters.quotations') || 'Quotations'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
