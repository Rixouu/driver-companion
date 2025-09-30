"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils/styles"
import { addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Search,
  X,
  Car,
  User,
  Calendar,
  FileText,
  Wrench,
  ClipboardCheck,
  BarChart,
  Settings,
  Loader2,
  ArrowRight,
  Clock,
  Tag,
  MapPin,
  Phone,
  Mail,
  Hash,
} from "lucide-react"

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'vehicle' | 'driver' | 'booking' | 'quotation' | 'maintenance' | 'inspection' | 'report' | 'setting'
  href: string
  metadata?: {
    status?: string
    date?: string
    amount?: string
    plateNumber?: string
    email?: string
    phone?: string
  }
}

// Status badge functions
function getQuotationStatusBadge(status: string, t: (key: string, options?: any) => string) {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="text-gray-800 border-gray-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
          {t('quotations.status.draft')}
        </Badge>
      );
    case 'sent':
      return (
        <Badge variant="outline" className="text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
          {t('quotations.status.sent')}
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
          {t('quotations.status.approved')}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
          {t('quotations.status.rejected')}
        </Badge>
      );
    case 'converted':
      return (
        <Badge variant="outline" className="text-purple-800 border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700">
          {t('quotations.status.converted')}
        </Badge>
      );
    case 'paid':
      return (
        <Badge variant="outline" className="text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
          {t('quotations.status.paid')}
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="outline" className="text-amber-800 border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700">
          {t('quotations.status.expired')}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          {status}
        </Badge>
      );
  }
}

function getBookingStatusBadge(status: string, t: (key: string, options?: any) => string) {
  switch (status) {
    case 'completed':
    case 'confirmed':
      return <Badge variant="outline" className="text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'assigned':
      return <Badge variant="outline" className="text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'pending':
      return <Badge variant="outline" className="text-yellow-800 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">{t(`bookings.status.${status}`)}</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">{t(`bookings.status.${status}`)}</Badge>;
  }
}

interface GlobalSearchProps {
  className?: string
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { t } = useI18n()
  
  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentSearches')
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved))
        } catch (error) {
          console.error('Error loading recent searches:', error)
        }
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }
  }

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recentSearches')
    }
  }

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const searchTerm = `%${searchQuery}%`
      
      console.log('Starting search with query:', searchQuery)
      
      // Search across multiple tables - get more results to allow for client-side filtering
      const [vehiclesResult, driversResult, bookingsResult, quotationsResult, maintenanceResult, inspectionsResult] = await Promise.all([
        // Vehicles
        supabase
          .from('vehicles')
          .select('id, name, plate_number, brand, model, status')
          .or(`name.ilike.${searchTerm},plate_number.ilike.${searchTerm},brand.ilike.${searchTerm},model.ilike.${searchTerm}`)
          .limit(10),
        
        // Drivers - get all drivers and filter client-side for better full name matching
        supabase
          .from('drivers')
          .select('id, first_name, last_name, email, phone')
          .limit(20),
        
        // Bookings
        supabase
          .from('bookings')
          .select('id, wp_id, customer_name, customer_email, status, created_at, price_amount')
          .or(`customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},wp_id.ilike.${searchTerm}`)
          .limit(5),
        
        // Quotations
        supabase
          .from('quotations')
          .select('id, quote_number, title, customer_name, customer_email, status, created_at, amount')
          .or(`quote_number.ilike.${searchTerm},title.ilike.${searchTerm},customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm}`)
          .limit(5),
        
        // Maintenance
        supabase
          .from('maintenance_tasks')
          .select('id, title, description, status, due_date')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(5),
        
        // Inspections
        supabase
          .from('inspections')
          .select('id, type, status, created_at, notes, date')
          .or(`type.ilike.${searchTerm},notes.ilike.${searchTerm}`)
          .limit(5)
      ])


      const searchResults: SearchResult[] = []

      // Process vehicles
      if (vehiclesResult.data) {
        vehiclesResult.data.forEach(vehicle => {
          searchResults.push({
            id: vehicle.id,
            title: vehicle.name,
            description: `${vehicle.brand} ${vehicle.model}`,
            type: 'vehicle',
            href: `/vehicles/${vehicle.id}`,
            metadata: {
              status: vehicle.status,
              plateNumber: vehicle.plate_number
            }
          })
        })
      }

      // Process drivers with client-side filtering
      if (driversResult.data) {
        const matchingDrivers = driversResult.data.filter(driver => {
          const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase()
          const searchLower = searchQuery.toLowerCase()
          
          return fullName.includes(searchLower) ||
                 driver.first_name?.toLowerCase().includes(searchLower) ||
                 driver.last_name?.toLowerCase().includes(searchLower) ||
                 driver.email?.toLowerCase().includes(searchLower) ||
                 driver.phone?.toLowerCase().includes(searchLower)
        }).slice(0, 5) // Limit to 5 results
        
        matchingDrivers.forEach(driver => {
          searchResults.push({
            id: driver.id,
            title: `${driver.first_name} ${driver.last_name}`,
            description: driver.email || 'No email',
            type: 'driver',
            href: `/drivers/${driver.id}`,
            metadata: {
              email: driver.email,
              phone: driver.phone
            }
          })
        })
      }

      // Process bookings
      if (bookingsResult.data) {
        bookingsResult.data.forEach(booking => {
          searchResults.push({
            id: booking.id,
            title: `Booking #${booking.wp_id || booking.id.substring(0, 8)}`,
            description: booking.customer_name || booking.customer_email || 'No customer info',
            type: 'booking',
            href: `/bookings/${booking.id}`,
            metadata: {
              status: booking.status,
              date: new Date(booking.created_at).toLocaleDateString(),
              amount: booking.price_amount ? `¥${booking.price_amount.toLocaleString()}` : undefined
            }
          })
        })
      }

      // Process quotations
      if (quotationsResult.data) {
        quotationsResult.data.forEach(quotation => {
          searchResults.push({
            id: quotation.id,
            title: quotation.title || `Quote #${quotation.quote_number}`,
            description: quotation.customer_name || quotation.customer_email || 'No customer info',
            type: 'quotation',
            href: `/quotations/${quotation.id}`,
            metadata: {
              status: quotation.status,
              date: new Date(quotation.created_at).toLocaleDateString(),
              amount: quotation.amount ? `¥${quotation.amount.toLocaleString()}` : undefined
            }
          })
        })
      }

      // Process maintenance
      if (maintenanceResult.data) {
        maintenanceResult.data.forEach(task => {
          searchResults.push({
            id: task.id,
            title: task.title,
            description: task.description || 'No description',
            type: 'maintenance',
            href: `/maintenance/${task.id}`,
            metadata: {
              status: task.status,
              date: task.due_date ? new Date(task.due_date).toLocaleDateString() : undefined
            }
          })
        })
      }

      // Process inspections
      if (inspectionsResult.data) {
        inspectionsResult.data.forEach(inspection => {
          searchResults.push({
            id: inspection.id,
            title: `${inspection.type} Inspection`,
            description: inspection.notes || 'No notes',
            type: 'inspection',
            href: `/inspections/${inspection.id}`,
            metadata: {
              status: inspection.status,
              date: inspection.date ? new Date(inspection.date).toLocaleDateString() : new Date(inspection.created_at).toLocaleDateString()
            }
          })
        })
      }

      console.log('Search results:', { 
        query: searchQuery, 
        results: searchResults.length
      })
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
    }
  }, [debouncedQuery])

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query)
    setOpen(false)
    setQuery("")
    router.push(result.href)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Get icon for result type
  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'vehicle': return <Car className="h-4 w-4" />
      case 'driver': return <User className="h-4 w-4" />
      case 'booking': return <Calendar className="h-4 w-4" />
      case 'quotation': return <FileText className="h-4 w-4" />
      case 'maintenance': return <Wrench className="h-4 w-4" />
      case 'inspection': return <ClipboardCheck className="h-4 w-4" />
      case 'report': return <BarChart className="h-4 w-4" />
      case 'setting': return <Settings className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  // Get type label
  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'vehicle': return t('navigation.vehicles')
      case 'driver': return t('navigation.drivers')
      case 'booking': return t('navigation.bookings')
      case 'quotation': return t('navigation.quotations')
      case 'maintenance': return t('navigation.maintenance')
      case 'inspection': return t('navigation.inspections')
      case 'report': return t('navigation.reporting')
      case 'setting': return t('navigation.settings')
      default: return 'Unknown'
    }
  }

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    results.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = []
      }
      groups[result.type].push(result)
    })
    return groups
  }, [results])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative h-9 w-full justify-start text-sm text-muted-foreground pr-10 bg-background/50 border-border/50 hover:bg-background/80 hover:border-border transition-all duration-200 focus-within:ring-2 focus-within:ring-ring/20",
            className
          )}
        >
          <Search className="mr-2 h-4 w-4 shrink-0" />
          <span className="hidden sm:inline-flex truncate">{t('search.placeholder')}</span>
          <span className="inline-flex sm:hidden">Search</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
            <PopoverContent className="w-full p-0 shadow-lg border-border/50" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted/50"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">{t('search.searching')}</span>
              </div>
            )}
            
            {!isLoading && query && results.length === 0 && (
              <CommandEmpty>{t('search.noResults')} "{query}"</CommandEmpty>
            )}
            
            {!isLoading && !query && recentSearches.length > 0 && (
              <CommandGroup heading={
                <div className="flex items-center justify-between w-full">
                  <span>{t('search.recentSearches')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearRecentSearches()
                    }}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t('search.clear')}
                  </Button>
                </div>
              }>
                {recentSearches.map((search, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      setQuery(search)
                      performSearch(search)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span>{search}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {!isLoading && query && Object.keys(groupedResults).length > 0 && (
              <>
                {Object.entries(groupedResults).map(([type, typeResults]) => (
                  <CommandGroup key={type} heading={getTypeLabel(type as SearchResult['type'])}>
                    {typeResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 p-3"
                      >
                        <div className="flex-shrink-0">
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{result.title}</span>
                            {result.metadata?.status && (
                              <div className="flex-shrink-0">
                                {result.type === 'booking' && getBookingStatusBadge(result.metadata.status, t)}
                                {result.type === 'quotation' && getQuotationStatusBadge(result.metadata.status, t)}
                                {result.type !== 'booking' && result.type !== 'quotation' && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.metadata.status}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {result.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {result.metadata?.plateNumber && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Hash className="h-3 w-3" />
                                {result.metadata.plateNumber}
                              </div>
                            )}
                            {result.metadata?.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {result.metadata.email}
                              </div>
                            )}
                            {result.metadata?.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {result.metadata.phone}
                              </div>
                            )}
                            {result.metadata?.date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {result.metadata.date}
                              </div>
                            )}
                            {result.metadata?.amount && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Tag className="h-3 w-3" />
                                {result.metadata.amount}
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
                
                {/* View All Results Link */}
                {query && results.length > 0 && (
                  <div className="border-t p-2">
                    <CommandItem
                      onSelect={() => {
                        router.push(`/search?q=${encodeURIComponent(query)}`)
                        setOpen(false)
                      }}
                      className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Search className="h-4 w-4" />
                      View all results for "{query}"
                    </CommandItem>
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
