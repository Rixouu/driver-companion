"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Search, 
  Calendar, 
  Currency, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { QuotationStatus } from '@/types/quotations';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface QuotationAdvancedFiltersProps {
  currentFilters: {
    query?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export function QuotationAdvancedFilters({
  currentFilters,
  onFiltersChange,
  onClearFilters
}: QuotationAdvancedFiltersProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    query: currentFilters.query || '',
    status: currentFilters.status || 'all',
    dateRange: currentFilters.dateFrom || currentFilters.dateTo ? {
      from: currentFilters.dateFrom ? new Date(currentFilters.dateFrom) : undefined,
      to: currentFilters.dateTo ? new Date(currentFilters.dateTo) : undefined
    } : undefined,
    amountMin: currentFilters.amountMin?.toString() || '',
    amountMax: currentFilters.amountMax?.toString() || ''
  });

  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (currentFilters.query) count++;
    if (currentFilters.status && currentFilters.status !== 'all') count++;
    if (currentFilters.dateFrom || currentFilters.dateTo) count++;
    if (currentFilters.amountMin !== undefined || currentFilters.amountMax !== undefined) count++;
    setActiveFilterCount(count);
  }, [currentFilters]);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Clear existing filter params
    ['query', 'status', 'dateFrom', 'dateTo', 'amountMin', 'amountMax', 'page'].forEach(param => {
      newSearchParams.delete(param);
    });

    // Add new filter params
    if (localFilters.query) {
      newSearchParams.set('query', localFilters.query);
    }
    if (localFilters.status && localFilters.status !== 'all') {
      newSearchParams.set('status', localFilters.status);
    }
    if (localFilters.dateRange?.from) {
      newSearchParams.set('dateFrom', localFilters.dateRange.from.toISOString());
      console.log('Setting dateFrom:', localFilters.dateRange.from.toISOString());
    }
    if (localFilters.dateRange?.to) {
      newSearchParams.set('dateTo', localFilters.dateRange.to.toISOString());
      console.log('Setting dateTo:', localFilters.dateRange.to.toISOString());
    }
    if (localFilters.amountMin) {
      newSearchParams.set('amountMin', localFilters.amountMin);
      console.log('Setting amountMin:', localFilters.amountMin);
    }
    if (localFilters.amountMax) {
      newSearchParams.set('amountMax', localFilters.amountMax);
      console.log('Setting amountMax:', localFilters.amountMax);
    }

    // Reset to first page when filters change
    newSearchParams.set('page', '1');

    console.log('Final search params:', newSearchParams.toString());
    
    // Use window.location.href instead of router.push to avoid type issues
    window.location.href = `${pathname}?${newSearchParams.toString()}`;
    onFiltersChange(localFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({
      query: '',
      status: 'all',
      dateRange: undefined,
      amountMin: '',
      amountMax: ''
    });
    
    const newSearchParams = new URLSearchParams(searchParams);
    ['query', 'status', 'dateFrom', 'dateTo', 'amountMin', 'amountMax', 'page'].forEach(param => {
      newSearchParams.delete(param);
    });
    
    // Use window.location.href instead of router.push to avoid type issues
    window.location.href = `${pathname}?${newSearchParams.toString()}`;
    onClearFilters();
  };

  const resetToCurrent = () => {
    setLocalFilters({
      query: currentFilters.query || '',
      status: currentFilters.status || 'all',
      dateRange: currentFilters.dateFrom || currentFilters.dateTo ? {
        from: currentFilters.dateFrom ? new Date(currentFilters.dateFrom) : undefined,
        to: currentFilters.dateTo ? new Date(currentFilters.dateTo) : undefined
      } : undefined,
      amountMin: currentFilters.amountMin?.toString() || '',
      amountMax: currentFilters.amountMax?.toString() || ''
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 px-2 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Filter quotations by search terms, status, date range, and amount range
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search quotations, customers..."
                  value={localFilters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={localFilters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Row */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DateRangePicker
              date={localFilters.dateRange}
              onDateChange={(range) => handleFilterChange('dateRange', range)}
              placeholder="Select date range (optional)"
            />
          </div>

          {/* Amount Range Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountMin">Minimum Amount (¥)</Label>
              <div className="relative">
                <Currency className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amountMin"
                  type="number"
                  placeholder="0"
                  value={localFilters.amountMin}
                  onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountMax">Maximum Amount (¥)</Label>
              <div className="relative">
                <Currency className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amountMax"
                  type="number"
                  placeholder="999999"
                  value={localFilters.amountMax}
                  onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToCurrent}
              className="h-8"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Current
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={applyFilters}
                className="h-8"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
