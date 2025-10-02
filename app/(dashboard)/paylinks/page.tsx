'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Receipt, 
  Trash2, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { PageHeader } from '@/components/page-header'
import { CreatePaylinkModal } from '@/components/paylinks/create-paylink-modal'
import { PaylinkDetailsModal } from '@/components/paylinks/paylink-details-modal'
import { ReceiptModal } from '@/components/paylinks/receipt-modal'
import { formatDateDDMMYYYY } from '@/lib/utils/formatting'

interface Paylink {
  id: string | number
  object: string
  livemode?: boolean
  location?: string
  amount: number
  currency: string
  title?: string
  name?: string // Payment Links+ uses 'name' instead of 'title'
  description?: string
  multiple?: boolean
  multiple_usage?: boolean // Payment Links+ uses 'multiple_usage'
  used?: boolean
  state?: string // Payment Links+ uses 'state' (pending, paid, etc.)
  status?: string // Payment Links+ uses 'status' (active, inactive, etc.)
  created_at: string
  deleted?: boolean
  deleted_at?: string
  payment_uri?: string
  transaction_url?: string // Payment Links+ uses transaction_url
  charges?: {
    data: Array<{
      id: string
      status: string
      created_at: string
      customer?: {
        name?: string
        email?: string
      }
      source?: {
        type: string
      }
      receipt_uri?: string
    }>
  }
}

export default function PaylinksPage() {
  const { t } = useI18n()
  const [paylinks, setPaylinks] = useState<Paylink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPaylink, setSelectedPaylink] = useState<Paylink | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    hasMore: false,
    total: 0
  })
  const [pageSize, setPageSize] = useState(10)

  // Fetch paylinks
  const fetchPaylinks = async (offset = 0, limit = pageSize, reset = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        order: 'reverse_chronological',
        search: searchTerm,
        status: statusFilter
      })
      
      const response = await fetch(`/api/omise/paylinks?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        if (offset === 0 || reset) {
          setPaylinks(data.data)
        } else {
          setPaylinks(prev => [...prev, ...data.data])
        }
        setPagination(prev => ({
          ...prev,
          offset,
          hasMore: data.hasMore,
          total: data.total
        }))
      } else {
        toast({
          title: "Error",
          description: data.error || t("paymentLinks.errors.fetchFailed"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching paylinks:', error)
      toast({
        title: "Error",
        description: t("paymentLinks.errors.fetchFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load more paylinks
  const loadMore = () => {
    if (pagination.hasMore) {
      fetchPaylinks(pagination.offset + pagination.limit, pagination.limit)
    }
  }

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize)
    setPageSize(size)
    setPagination(prev => ({ ...prev, limit: size, offset: 0 }))
    fetchPaylinks(0, size, true)
  }

  // Delete paylink
  const deletePaylink = async (id: string) => {
    try {
      const response = await fetch(`/api/omise/paylinks/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        setPaylinks(prev => prev.filter(link => link.id !== id))
        toast({
          title: "Success",
          description: "Payment link deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete payment link",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting paylink:', error)
      toast({
        title: "Error",
        description: "Failed to delete payment link",
        variant: "destructive",
      })
    }
  }

  // Check if deletion is supported
  const isDeletionSupported = () => {
    // Payment Links+ may not support deletion via API
    return false
  }


  // Generate receipt
  const generateReceipt = async (id: string) => {
    try {
      const response = await fetch(`/api/omise/paylinks/${id}/receipt`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setReceiptData(data.data)
        setShowReceiptModal(true)
      } else {
        toast({
          title: "Error",
          description: data.error || t("paymentLinks.errors.receiptFailed"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error generating receipt:', error)
      toast({
        title: "Error",
        description: t("paymentLinks.errors.receiptFailed"),
        variant: "destructive",
      })
    }
  }

  // Get payment status
  const getPaymentStatus = (link: Paylink) => {
    if (link.deleted) return { 
      status: 'deleted', 
      label: t("paymentLinks.statusLabels.deleted"), 
      color: 'destructive',
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    }
    if (link.state === 'paid' || link.used) return { 
      status: 'paid', 
      label: t("paymentLinks.statusLabels.paid"), 
      color: 'default',
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
    }
    if (link.state === 'pending' || link.status === 'active') return { 
      status: 'pending', 
      label: t("paymentLinks.statusLabels.pending"), 
      color: 'secondary',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
    }
    return { 
      status: 'pending', 
      label: t("paymentLinks.statusLabels.pending"), 
      color: 'secondary',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
    }
  }

  // No client-side filtering needed - server handles it
  const filteredPaylinks = paylinks

  // Format amount
  const formatAmount = (amount: number, currency: string) => {
    // Payment Links+ amounts are already in the correct format (not in cents)
    return `${amount.toLocaleString()} ${currency}`
  }

  useEffect(() => {
    fetchPaylinks()
  }, [])

  // Refetch when search term or status filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPaylinks(0, pagination.limit, true)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("paymentLinks.title")}
        description={t("paymentLinks.description")}
      />

      {/* Actions Bar */}
      <div className="space-y-4">
        {/* Search and Create Button Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t("paymentLinks.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {t("paymentLinks.createPaymentLink")}
              </Button>
            </DialogTrigger>
            <CreatePaylinkModal
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false)
                fetchPaylinks(0, pagination.limit) // Refresh first page
              }}
            />
          </Dialog>
        </div>

        {/* Status Filters and Page Size - Single Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className={`h-8 text-xs flex-1 sm:flex-none ${
                statusFilter === 'all' 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'hover:bg-muted hover:text-muted-foreground'
              }`}
            >
              {t("paymentLinks.allStatus")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className={`h-8 text-xs border-yellow-500 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900 hover:border-yellow-600 dark:border-yellow-400 dark:text-yellow-300 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-100 dark:hover:border-yellow-300 flex-1 sm:flex-none ${
                statusFilter === 'pending' 
                  ? 'bg-yellow-100 text-yellow-900 border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-300' 
                  : ''
              }`}
            >
              {t("paymentLinks.pending")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('paid')}
              className={`h-8 text-xs border-green-500 text-green-700 hover:bg-green-100 hover:text-green-900 hover:border-green-600 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-900/30 dark:hover:text-green-100 dark:hover:border-green-300 flex-1 sm:flex-none ${
                statusFilter === 'paid' 
                  ? 'bg-green-100 text-green-900 border-green-600 dark:bg-green-900/30 dark:text-green-100 dark:border-green-300' 
                  : ''
              }`}
            >
              {t("paymentLinks.paid")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('deleted')}
              className={`h-8 text-xs border-red-500 text-red-700 hover:bg-red-100 hover:text-red-900 hover:border-red-600 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-900/30 dark:hover:text-red-100 dark:hover:border-red-300 flex-1 sm:flex-none ${
                statusFilter === 'deleted' 
                  ? 'bg-red-100 text-red-900 border-red-600 dark:bg-red-900/30 dark:text-red-100 dark:border-red-300' 
                  : ''
              }`}
            >
              {t("paymentLinks.deleted")}
            </Button>
          </div>

          {/* Page Size Selector - Top Right */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-muted-foreground">{t("paymentLinks.show")}</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Paylinks Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paymentLinks.title")} ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t("paymentLinks.tableContent.loading")}</div>
            </div>
          ) : filteredPaylinks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t("paymentLinks.tableContent.noPaymentLinks")}</div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">{t("paymentLinks.tableHeaders.title")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("paymentLinks.tableHeaders.amount")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("paymentLinks.tableHeaders.status")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("paymentLinks.tableHeaders.created")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("paymentLinks.tableHeaders.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaylinks.map((link) => {
                      const paymentStatus = getPaymentStatus(link)
                      return (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{link.title || link.name || t("paymentLinks.tableContent.untitled")}</div>
                              <div className="text-sm text-muted-foreground">
                                {link.description || t("paymentLinks.tableContent.noDescription")}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {link.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatAmount(link.amount, link.currency)}
                            </div>
                            {(link.multiple || link.multiple_usage) && (
                              <Badge variant="outline" className="text-xs">
                                {t("paymentLinks.tableContent.multipleUse")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={paymentStatus.className}
                            >
                              {paymentStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDateDDMMYYYY(link.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPaylink(link)
                                  setShowDetailsModal(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(link.transaction_url || link.payment_uri, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              
                              {paymentStatus.status === 'paid' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => generateReceipt(link.id.toString())}
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {isDeletionSupported() ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t("paymentLinks.deleteDialog.title")}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t("paymentLinks.deleteDialog.description")}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t("paymentLinks.deleteDialog.cancel")}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deletePaylink(link.id.toString())}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {t("paymentLinks.deleteDialog.delete")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled
                                  title="Deletion not supported via API"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredPaylinks.map((link) => {
                  const paymentStatus = getPaymentStatus(link)
                  return (
                    <Card key={link.id} className="p-4">
                      <div className="space-y-3">
                        {/* Header with Title and Status */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">
                              {link.title || link.name || t("paymentLinks.tableContent.untitled")}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {link.description || t("paymentLinks.tableContent.noDescription")}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              ID: {link.id}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${paymentStatus.className}`}
                          >
                            {paymentStatus.label}
                          </Badge>
                        </div>

                        {/* Amount and Details */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-lg">
                              {formatAmount(link.amount, link.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateDDMMYYYY(link.created_at)}
                            </div>
                          </div>
                          {(link.multiple || link.multiple_usage) && (
                            <Badge variant="outline" className="text-xs">
                              {t("paymentLinks.tableContent.multipleUse")}
                            </Badge>
                          )}
                        </div>

                        {/* Actions - 2 Column Layout */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPaylink(link)
                              setShowDetailsModal(true)
                            }}
                            className="h-8 px-2"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="text-xs">{t("paymentLinks.actions.view")}</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(link.transaction_url || link.payment_uri, '_blank')}
                            className="h-8 px-2"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span className="text-xs">{t("paymentLinks.actions.open")}</span>
                          </Button>
                          
                          {paymentStatus.status === 'paid' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateReceipt(link.id.toString())}
                              className="h-8 px-2 col-span-2"
                            >
                              <Receipt className="h-4 w-4 mr-1" />
                              <span className="text-xs">{t("paymentLinks.actions.generateReceipt")}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && filteredPaylinks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-card rounded-lg">
          <div className="text-sm text-muted-foreground">
            {t("paymentLinks.pagination.showing", { showing: filteredPaylinks.length, total: pagination.total })}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPaylinks(0, pagination.limit, true)}
              disabled={pagination.offset === 0}
              className="hidden sm:flex"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("paymentLinks.pagination.first")}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPaylinks(Math.max(0, pagination.offset - pagination.limit), pagination.limit, true)}
              disabled={pagination.offset === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1 sm:mr-0" />
              <span className="hidden sm:inline">{t("paymentLinks.pagination.previous")}</span>
            </Button>
            
            <span className="text-sm text-muted-foreground px-2 text-center">
              {t("paymentLinks.pagination.page", { 
                current: Math.floor(pagination.offset / pagination.limit) + 1, 
                total: Math.ceil(pagination.total / pagination.limit) 
              })}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPaylinks(pagination.offset + pagination.limit, pagination.limit, true)}
              disabled={!pagination.hasMore}
            >
              <span className="hidden sm:inline">{t("paymentLinks.pagination.next")}</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lastPageOffset = Math.floor((pagination.total - 1) / pagination.limit) * pagination.limit
                fetchPaylinks(lastPageOffset, pagination.limit, true)
              }}
              disabled={!pagination.hasMore}
              className="hidden sm:flex"
            >
              {t("paymentLinks.pagination.last")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Paylink Details Modal */}
      {selectedPaylink && (
        <Dialog open={showDetailsModal} onOpenChange={(open) => {
          if (!open) {
            setShowDetailsModal(false)
            setSelectedPaylink(null)
          }
        }}>
          <PaylinkDetailsModal
            paylink={selectedPaylink}
            open={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedPaylink(null)
            }}
            onGenerateReceipt={generateReceipt}
          />
        </Dialog>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false)
          setReceiptData(null)
        }}
        receiptData={receiptData}
      />
    </div>
  )
}
