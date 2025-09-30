"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils/styles"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import {
  Search,
  Car,
  User,
  Calendar,
  FileText,
  Wrench,
  ClipboardList,
  ArrowRight,
  Calendar as CalendarIcon,
  Tag,
  Hash,
  Mail,
  Phone,
} from "lucide-react"

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'vehicle' | 'driver' | 'booking' | 'quotation' | 'maintenance' | 'inspection'
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

interface SearchResultsContentProps {
  query?: string
}

// Status badge functions (same as in global-search.tsx)
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

function getTypeIcon(type: SearchResult['type']) {
  switch (type) {
    case 'vehicle':
      return <Car className="h-5 w-5 text-blue-600" />
    case 'driver':
      return <User className="h-5 w-5 text-green-600" />
    case 'booking':
      return <Calendar className="h-5 w-5 text-purple-600" />
    case 'quotation':
      return <FileText className="h-5 w-5 text-orange-600" />
    case 'maintenance':
      return <Wrench className="h-5 w-5 text-red-600" />
    case 'inspection':
      return <ClipboardList className="h-5 w-5 text-indigo-600" />
    default:
      return <Search className="h-5 w-5 text-gray-600" />
  }
}

function getTypeLabel(type: SearchResult['type']) {
  switch (type) {
    case 'vehicle':
      return 'Vehicles'
    case 'driver':
      return 'Drivers'
    case 'booking':
      return 'Bookings'
    case 'quotation':
      return 'Quotations'
    case 'maintenance':
      return 'Maintenance'
    case 'inspection':
      return 'Inspections'
    default:
      return 'Other'
  }
}

export function SearchResultsContent({ query }: SearchResultsContentProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useI18n()
  const router = useRouter()

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const searchTerm = `%${searchQuery}%`
      
      // Search across multiple tables
      const [vehiclesResult, driversResult, bookingsResult, quotationsResult, maintenanceResult, inspectionsResult] = await Promise.all([
        // Vehicles
        supabase
          .from('vehicles')
          .select('id, name, plate_number, brand, model, status')
          .or(`name.ilike.${searchTerm},plate_number.ilike.${searchTerm},brand.ilike.${searchTerm},model.ilike.${searchTerm}`)
          .limit(20),
        
        // Drivers
        supabase
          .from('drivers')
          .select('id, first_name, last_name, email, phone')
          .limit(50),
        
        // Bookings
        supabase
          .from('bookings')
          .select('id, wp_id, customer_name, customer_email, status, created_at, price_amount')
          .or(`customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},wp_id.ilike.${searchTerm}`)
          .limit(20),
        
        // Quotations
        supabase
          .from('quotations')
          .select('id, quote_number, title, customer_name, customer_email, status, created_at, amount')
          .or(`quote_number.ilike.${searchTerm},title.ilike.${searchTerm},customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm}`)
          .limit(20),
        
        // Maintenance
        supabase
          .from('maintenance_tasks')
          .select('id, title, description, status, due_date')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(20),
        
        // Inspections
        supabase
          .from('inspections')
          .select('id, type, status, created_at, notes, date')
          .or(`type.ilike.${searchTerm},notes.ilike.${searchTerm}`)
          .limit(20)
      ])

      const searchResults: SearchResult[] = []

      // Process vehicles
      if (vehiclesResult.data) {
        vehiclesResult.data.forEach(vehicle => {
          searchResults.push({
            id: vehicle.id,
            title: vehicle.name,
            description: `${vehicle.brand} ${vehicle.model} • ${vehicle.plate_number}`,
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
        }).slice(0, 20)
        
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

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setError('Failed to search. Please try again.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title="Search Error"
        description={error}
        action={
          <Button onClick={() => query && performSearch(query)}>
            Try Again
          </Button>
        }
      />
    )
  }

  if (!query) {
    return (
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title="No Search Query"
        description="Enter a search term to find vehicles, drivers, bookings, and more."
      />
    )
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title="No Results Found"
        description={`No results found for "${query}". Try different keywords or check your spelling.`}
      />
    )
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedResults).map(([type, typeResults]) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{getTypeLabel(type as SearchResult['type'])}</h2>
            <Badge variant="secondary" className="text-xs">
              {typeResults.length}
            </Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typeResults.map((result) => (
              <Card 
                key={result.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelect(result)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium truncate">
                          {result.title}
                        </CardTitle>
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
                      <p className="text-sm text-muted-foreground truncate">
                        {result.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {result.metadata?.plateNumber && (
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {result.metadata.plateNumber}
                      </div>
                    )}
                    {result.metadata?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {result.metadata.email}
                      </div>
                    )}
                    {result.metadata?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {result.metadata.phone}
                      </div>
                    )}
                    {result.metadata?.date && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {result.metadata.date}
                      </div>
                    )}
                    {result.metadata?.amount && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {result.metadata.amount}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
