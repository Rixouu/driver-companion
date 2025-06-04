"use client"

import { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, XCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterOption {
  value: string
  label: string
}

interface SearchFilterBarProps {
  onSearchChange: (value: string) => void
  onBrandFilterChange: (value: string) => void
  onModelFilterChange: (value: string) => void
  
  currentSearchValue?: string
  selectedBrand: string
  selectedModel: string
  
  searchPlaceholder?: string
  brandOptions?: FilterOption[]
  modelOptions?: FilterOption[]
  
  showItemCount?: boolean
  totalItems?: number
  startIndex?: number
  endIndex?: number
  
  className?: string
  showBrandFilter?: boolean
  showModelFilter?: boolean
  showingTranslationKey?: string
}

export function SearchFilterBar({
  onSearchChange,
  onBrandFilterChange,
  onModelFilterChange,
  currentSearchValue,
  selectedBrand,
  selectedModel,
  searchPlaceholder,
  brandOptions = [],
  modelOptions = [],
  showItemCount = true,
  totalItems = 0,
  startIndex = 1,
  endIndex = 0,
  className = "",
  showBrandFilter = true,
  showModelFilter = true,
  showingTranslationKey = "drivers.pagination.showing",
}: SearchFilterBarProps) {
  const { t } = useI18n()

  const resetAllFilters = () => {
    onSearchChange("")
    onBrandFilterChange("all")
    onModelFilterChange("all")
  }
  
  const showClearButton = currentSearchValue || selectedBrand !== "all" || selectedModel !== "all"

  // Ensure endIndex is never less than startIndex for display purposes
  const displayEndIndex = totalItems === 0 ? 0 : Math.max(endIndex, startIndex || 0)
  const displayStartIndex = totalItems === 0 ? 0 : startIndex || 0

  return (
    <div className={`bg-muted/30 p-4 rounded-lg space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <Input
            type="search"
            placeholder={searchPlaceholder || t('drivers.filters.searchPlaceholder')}
            value={currentSearchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {currentSearchValue && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0" 
              onClick={() => onSearchChange("")}
            >
              <XCircle className="h-4 w-4" />
              <span className="sr-only">{t('common.clearSearch')}</span>
            </Button>
          )}
        </div>
        
        {/* Brand filter */}
        {showBrandFilter && brandOptions.length > 0 && (
          <div className="w-full sm:w-48">
            <Select value={selectedBrand} onValueChange={onBrandFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('drivers.filters.brand')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('drivers.filters.allBrands')}</SelectItem>
                {brandOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Model filter - only show if brand is selected and model options exist */}
        {showModelFilter && selectedBrand !== "all" && modelOptions.length > 0 && (
          <div className="w-full sm:w-48">
            <Select value={selectedModel} onValueChange={onModelFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('drivers.filters.model')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('drivers.filters.allModels')}</SelectItem>
                {modelOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Clear filters button - only show if any filter is applied */}
        {showClearButton && (
          <Button 
            variant="outline" 
            size="sm" 
            className="sm:self-end" 
            onClick={resetAllFilters}
          >
            {t('drivers.filters.clearFilters')}
          </Button>
        )}
      </div>
      
      {/* Showing results info */}
      {showItemCount && (
        <div className="text-sm text-muted-foreground">
          {t(showingTranslationKey, {
            start: String(displayStartIndex),
            end: String(displayEndIndex),
            total: String(totalItems)
          })}
        </div>
      )}
    </div>
  )
} 