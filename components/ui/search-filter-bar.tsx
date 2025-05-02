"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, XCircle, Filter } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"

interface FilterOption {
  value: string
  label: string
}

interface SearchFilterBarProps {
  onSearchChange: (value: string) => void
  onBrandFilterChange?: (value: string) => void
  onModelFilterChange?: (value: string) => void
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
  selectedBrand?: string
  selectedModel?: string
}

export function SearchFilterBar({
  onSearchChange,
  onBrandFilterChange,
  onModelFilterChange,
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
  selectedBrand = "all",
  selectedModel = "all"
}: SearchFilterBarProps) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [brandFilter, setBrandFilter] = useState(selectedBrand)
  const [modelFilter, setModelFilter] = useState(selectedModel)
  
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  // Pass debounced search to parent component
  useEffect(() => {
    onSearchChange(debouncedSearch)
  }, [debouncedSearch, onSearchChange])
  
  // Reset model filter when brand filter changes
  useEffect(() => {
    if (brandFilter !== selectedBrand) {
      setModelFilter("all")
      if (onModelFilterChange) {
        onModelFilterChange("all")
      }
    }
  }, [brandFilter, selectedBrand, onModelFilterChange])
  
  // Notify parent of brand filter change
  useEffect(() => {
    if (onBrandFilterChange) {
      onBrandFilterChange(brandFilter)
    }
  }, [brandFilter, onBrandFilterChange])
  
  // Notify parent of model filter change
  useEffect(() => {
    if (onModelFilterChange) {
      onModelFilterChange(modelFilter)
    }
  }, [modelFilter, onModelFilterChange])
  
  const resetFilters = () => {
    setSearchQuery("")
    setBrandFilter("all")
    setModelFilter("all")
    onSearchChange("")
    if (onBrandFilterChange) onBrandFilterChange("all")
    if (onModelFilterChange) onModelFilterChange("all")
  }
  
  const showClearButton = searchQuery !== "" || brandFilter !== "all" || modelFilter !== "all"

  return (
    <div className={`bg-muted/30 p-4 rounded-lg space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder || t('drivers.filters.searchPlaceholder')}
            className="pl-9 w-full"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0" 
              onClick={() => setSearchQuery("")}
            >
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        
        {/* Brand filter */}
        {showBrandFilter && brandOptions.length > 0 && (
          <div className="w-full sm:w-48">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
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
        
        {/* Model filter - only show if brand is selected */}
        {showModelFilter && brandFilter !== "all" && modelOptions.length > 0 && (
          <div className="w-full sm:w-48">
            <Select value={modelFilter} onValueChange={setModelFilter}>
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
            onClick={resetFilters}
          >
            {t('drivers.filters.clearFilters')}
          </Button>
        )}
      </div>
      
      {/* Showing results info */}
      {showItemCount && (
        <div className="text-sm text-muted-foreground">
          {t('drivers.pagination.showing', {
            start: String(startIndex),
            end: String(endIndex),
            total: String(totalItems)
          })}
        </div>
      )}
    </div>
  )
} 