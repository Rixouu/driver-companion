'use client'

import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  ExternalLink, 
  Copy, 
  Receipt, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  DollarSign,
  User,
  Mail,
  CreditCard
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
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

interface PaylinkDetailsModalProps {
  paylink: Paylink
  open: boolean
  onClose: () => void
  onGenerateReceipt: (id: string) => void
}

export function PaylinkDetailsModal({ 
  paylink, 
  open, 
  onClose, 
  onGenerateReceipt 
}: PaylinkDetailsModalProps) {
  
  const getPaymentStatus = () => {
    if (paylink.deleted) return { 
      status: 'deleted', 
      label: 'Deleted', 
      color: 'destructive', 
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    }
    if (paylink.state === 'paid' || paylink.used) return { 
      status: 'paid', 
      label: 'Paid', 
      color: 'default', 
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
    }
    if (paylink.state === 'pending' || paylink.status === 'active') return { 
      status: 'pending', 
      label: 'Pending', 
      color: 'secondary', 
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
    }
    return { 
      status: 'pending', 
      label: 'Pending', 
      color: 'secondary', 
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
    }
  }

  // Helper function to check if payment link has been paid
  const isPaymentLinkPaid = (paylink: Paylink): boolean => {
    return paylink.state === 'paid' || paylink.used === true
  }

  const formatAmount = (amount: number, currency: string) => {
    // Payment Links+ API returns amounts in main currency unit (not cents)
    return `${amount.toLocaleString()} ${currency}`
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    })
  }

  const openPaymentLink = () => {
    window.open(paylink.transaction_url || paylink.payment_uri, '_blank')
  }

  const paymentStatus = getPaymentStatus()
  const successfulCharge = paylink.charges?.data?.find(c => c.status === 'successful')

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          Payment Link Details
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <p className="text-sm font-medium">{paylink.title || paylink.name || 'Untitled'}</p>
            </div>
            
            {paylink.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm text-muted-foreground">{paylink.description}</p>
              </div>
            )}
            
            {/* 3-column layout for key info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-lg font-semibold text-green-600">{formatAmount(paylink.amount, paylink.currency)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2">
                  <paymentStatus.icon className="h-4 w-4" />
                  <Badge variant="outline" className={paymentStatus.className}>
                    {paymentStatus.label}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Multiple Use</label>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${(paylink.multiple || paylink.multiple_usage) ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <p className="text-sm">{(paylink.multiple || paylink.multiple_usage) ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Link details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Link ID</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{paylink.id}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(paylink.id, 'Link ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{formatDateDDMMYYYY(paylink.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        {paylink.used && successfulCharge && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Date</label>
                  <p className="text-sm">{formatDateDDMMYYYY(successfulCharge.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="text-sm">{successfulCharge.source?.type || 'Unknown'}</p>
                </div>
              </div>
              
              {successfulCharge.customer && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <div className="space-y-1">
                    {successfulCharge.customer.name && (
                      <p className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {successfulCharge.customer.name}
                      </p>
                    )}
                    {successfulCharge.customer.email && (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {successfulCharge.customer.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Charge ID</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono">{successfulCharge.id}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(successfulCharge.id, 'Charge ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(paylink.transaction_url || paylink.payment_uri || '', 'Payment link')}
                className="flex items-center gap-2 h-12"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              
              <Button
                variant="outline"
                onClick={openPaymentLink}
                className="flex items-center gap-2 h-12"
              >
                <ExternalLink className="h-4 w-4" />
                Open Link
              </Button>
              
              {paymentStatus.status === 'paid' && (
                <Button
                  variant="default"
                  onClick={() => onGenerateReceipt(paylink.id)}
                  className="flex items-center gap-2 h-12 bg-green-600 hover:bg-green-700"
                >
                  <Receipt className="h-4 w-4" />
                  Generate Receipt
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Link Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-mono break-all">{paylink.transaction_url || paylink.payment_uri}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  )
}
