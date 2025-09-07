"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CalendarIcon, Edit, Loader2, Trash2, UserIcon, CarIcon, Zap, CheckIcon, CalendarPlus, Mail, Send, Info, FileText, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/styles'
import { cancelBookingAction } from '@/app/actions/bookings'
import { useToast } from '@/components/ui/use-toast'
import SmartAssignmentModal from '@/components/shared/smart-assignment-modal'

interface BookingActionsProps {
  bookingId: string;
  status: string;
  date: string;
  time: string;
  booking: any;
}

export default function BookingActions({ booking, bookingId, status }: BookingActionsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)
  
  // Email dialog state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [bccEmails, setBccEmails] = useState<string>("booking@japandriver.com")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  
  // Invoice and payment link state
  const [isSendingInvoice, setIsSendingInvoice] = useState(false)
  const [isRegeneratingPaymentLink, setIsRegeneratingPaymentLink] = useState(false)
  
  // Invoice modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [invoiceBccEmails, setInvoiceBccEmails] = useState<string>("booking@japandriver.com")
  
  // Payment link modal state
  const [isPaymentLinkModalOpen, setIsPaymentLinkModalOpen] = useState(false)
  const [paymentLinkBccEmails, setPaymentLinkBccEmails] = useState<string>("booking@japandriver.com")



  // Load available drivers and vehicles
  const loadAvailableResources = async () => {
    setIsLoadingDrivers(true)
    try {
      const supabase = createClient()
      
      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .is('deleted_at', null);

      if (driversError) throw driversError;

      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');

      if (vehiclesError) throw vehiclesError;

      setDrivers(driversData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error('Error loading resources:', error)
      toast({
        title: "Error",
        description: "Failed to load available drivers and vehicles",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDrivers(false)
    }
  }

  // Send booking details email
  const handleSendBookingDetails = async () => {
    if (!bccEmails.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one BCC email address",
        variant: "destructive",
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const bccEmailList = bccEmails.split(',').map(email => email.trim()).filter(email => email)
      
      const response = await fetch('/api/bookings/send-booking-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.supabase_id || booking.id || booking.booking_id || bookingId,
          bccEmails: bccEmailList
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: "Booking details email sent successfully!",
      })

      // Close modal and reset form
      setIsEmailModalOpen(false)
      setBccEmails("booking@japandriver.com")
      
    } catch (error) {
      console.error('Error sending booking details email:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Send booking invoice
  const handleSendBookingInvoice = async () => {
    if (!invoiceBccEmails.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one BCC email address",
        variant: "destructive",
      })
      return
    }

    setIsSendingInvoice(true)
    try {
      const bccEmailList = invoiceBccEmails.split(',').map(email => email.trim()).filter(email => email)
      
      const response = await fetch('/api/bookings/send-booking-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.supabase_id || booking.id || booking.booking_id || bookingId,
          bccEmails: bccEmailList,
          customer_email: booking.customer_email || booking.customer?.email
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invoice')
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: "Booking invoice sent successfully!",
      })

      // Close modal and reset form
      setIsInvoiceModalOpen(false)
      setInvoiceBccEmails("booking@japandriver.com")
      
    } catch (error) {
      console.error('Error sending booking invoice:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invoice",
        variant: "destructive",
      })
    } finally {
      setIsSendingInvoice(false)
    }
  }

  // Regenerate payment link
  const handleRegeneratePaymentLink = async () => {
    if (!paymentLinkBccEmails.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one BCC email address",
        variant: "destructive",
      })
      return
    }

    setIsRegeneratingPaymentLink(true)
    try {
      const bccEmailList = paymentLinkBccEmails.split(',').map(email => email.trim()).filter(email => email)
      
      const response = await fetch('/api/bookings/regenerate-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.supabase_id || booking.id || booking.booking_id || bookingId,
          bccEmails: bccEmailList,
          customer_email: booking.customer_email || booking.customer?.email
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to regenerate payment link')
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: "Payment link regenerated and sent to customer!",
      })

      // Close modal and reset form
      setIsPaymentLinkModalOpen(false)
      setPaymentLinkBccEmails("booking@japandriver.com")
      
    } catch (error) {
      console.error('Error regenerating payment link:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate payment link",
        variant: "destructive",
      })
    } finally {
      setIsRegeneratingPaymentLink(false)
    }
  }



  const handleAssign = async (driverId: string, vehicleId: string) => {
    try {
      const supabase = createClient();
      
      // Update the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          driver_id: driverId,
          vehicle_id: vehicleId,
          status: 'assigned'
        })
        .eq('id', booking.supabase_id);

      if (bookingError) throw bookingError;

      // Check if dispatch entry already exists, if so update it, otherwise create new one
      const { data: existingDispatch, error: checkError } = await supabase
        .from('dispatch_entries')
        .select('id')
        .eq('booking_id', booking.supabase_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingDispatch) {
        // Update existing dispatch entry
        const { error: updateError } = await supabase
          .from('dispatch_entries')
          .update({
            driver_id: driverId,
            vehicle_id: vehicleId,
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDispatch.id);

        if (updateError) throw updateError;
      } else {
        // Create new dispatch entry
        const { error: createError } = await supabase
          .from('dispatch_entries')
          .insert({
            booking_id: booking.supabase_id,
            driver_id: driverId,
            vehicle_id: vehicleId,
            status: 'assigned',
            start_time: `${booking.date}T${booking.time}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) throw createError;
      }

      toast({
        title: "Success",
        description: "Driver and vehicle assigned successfully",
      });

      // Refresh the page to show updated status
      router.refresh();

    } catch (error) {
      console.error('Error assigning resources:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver and vehicle",
        variant: "destructive",
      });
    }
  };

  const handleUnassign = async (type: 'driver' | 'vehicle') => {
    try {
      const supabase = createClient();
      
      const updates: any = {};
      if (type === 'driver') {
        updates.driver_id = null;
      } else if (type === 'vehicle') {
        updates.vehicle_id = null;
      }
      
      // Update the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', booking.supabase_id);

      if (bookingError) throw bookingError;

      // Also update dispatch_entries if they exist
      try {
        await supabase
          .from('dispatch_entries')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('booking_id', booking.supabase_id);
      } catch (dispatchError) {
        // Ignore dispatch errors - the main booking update succeeded
        console.log('Dispatch entry update failed (may not exist):', dispatchError);
      }

      toast({
        title: "Success",
        description: `${type === 'driver' ? 'Driver' : 'Vehicle'} unassigned successfully`,
      });
      
      // Refresh the page to show updated status
      router.refresh();

    } catch (error) {
      console.error(`Error unassigning ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to unassign ${type}`,
        variant: "destructive",
      });
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true)
    try {
      await cancelBookingAction(bookingId)
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      })
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('bookings.details.bookingActions.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium mb-3">{t('bookings.details.bookingActions.quickActions')}</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <Link href={`/bookings/${booking.wp_id || bookingId}/edit`}>
                <Button 
                  variant="outline" 
                  className="w-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:hover:bg-yellow-500/20 dark:border-yellow-500/30"
                >
                  <Edit className="mr-2 h-5 w-5" />
                  {t('bookings.details.bookingActions.editBooking')}
                </Button>
              </Link>
              
              <Link href={`/bookings/${booking.wp_id || bookingId}/reschedule`}>
                <Button 
                  variant="outline" 
                  className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:hover:bg-blue-500/20 dark:border-blue-500/30"
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {t('bookings.details.bookingActions.rescheduleBooking')}
                </Button>
              </Link>
              
              <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:hover:bg-green-500/20 dark:border-green-500/30"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Send Booking Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Send Booking Details Email
                    </DialogTitle>
                    <DialogDescription>
                      Send an email with booking details and Google Calendar integration to the customer.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer-email">Customer Email</Label>
                      <Input
                        id="customer-email"
                        value={booking.customer_email || 'Customer email will be automatically filled'}
                        disabled
                        className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email will be sent to the customer's registered email address
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="bcc-emails">BCC Emails</Label>
                      <Input
                        id="bcc-emails"
                        value={bccEmails}
                        onChange={(e) => setBccEmails(e.target.value)}
                        placeholder="Enter email addresses separated by commas"
                        className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Default: booking@japandriver.com. Add more emails separated by commas.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                      <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                        📧 What's included in the email:
                      </h4>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Complete booking details and service information</li>
                        <li>• Pickup and dropoff locations with times</li>
                        <li>• Driver and vehicle information</li>
                        <li>• Pricing breakdown and total amount</li>
                        <li>• Google Calendar integration button</li>
                        <li>• Contact information for changes</li>
                      </ul>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendBookingDetails}
                      disabled={isSendingEmail}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-500 dark:hover:bg-purple-500/20 dark:border-purple-500/30"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Send Booking Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Send Booking Invoice
                    </DialogTitle>
                    <DialogDescription>
                      Send an invoice with payment status to the customer.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invoice-customer-email">Customer Email</Label>
                      <Input
                        id="invoice-customer-email"
                        value={booking.customer_email || 'Customer email will be automatically filled'}
                        disabled
                        className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Invoice will be sent to the customer's registered email address
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="invoice-bcc-emails">BCC Emails</Label>
                      <Input
                        id="invoice-bcc-emails"
                        value={invoiceBccEmails}
                        onChange={(e) => setInvoiceBccEmails(e.target.value)}
                        placeholder="Enter email addresses separated by commas"
                        className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Default: booking@japandriver.com. Add more emails separated by commas.
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-md">
                      <h4 className="font-medium text-sm text-purple-900 dark:text-purple-100 mb-2">
                        📄 What's included in the invoice:
                      </h4>
                      <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                        <li>• Complete service details and pricing breakdown</li>
                        <li>• Payment status (PENDING PAYMENT or PAID)</li>
                        <li>• Coupon discounts and tax calculations</li>
                        <li>• Professional invoice PDF attachment</li>
                        <li>• Payment link (if status is pending)</li>
                      </ul>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendBookingInvoice}
                      disabled={isSendingInvoice}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isSendingInvoice ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Invoice...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Invoice
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isPaymentLinkModalOpen} onOpenChange={setIsPaymentLinkModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-500 dark:hover:bg-orange-500/20 dark:border-orange-500/30"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Regenerate Payment Link
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Regenerate Payment Link
                    </DialogTitle>
                    <DialogDescription>
                      Generate a new payment link and send it to the customer.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="payment-customer-email">Customer Email</Label>
                      <Input
                        id="payment-customer-email"
                        value={booking.customer_email || 'Customer email will be automatically filled'}
                        disabled
                        className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        New payment link will be sent to the customer's registered email address
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="payment-bcc-emails">BCC Emails</Label>
                      <Input
                        id="payment-bcc-emails"
                        value={paymentLinkBccEmails}
                        onChange={(e) => setPaymentLinkBccEmails(e.target.value)}
                        placeholder="Enter email addresses separated by commas"
                        className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Default: booking@japandriver.com. Add more emails separated by commas.
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md">
                      <h4 className="font-medium text-sm text-orange-900 dark:text-orange-100 mb-2">
                        🔄 What happens when regenerating:
                      </h4>
                      <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-1">
                        <li>• Creates a new payment link with fresh expiration</li>
                        <li>• Sends payment email with new link to customer</li>
                        <li>• Updates booking with new payment link details</li>
                        <li>• Useful when original payment link expired or failed</li>
                      </ul>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPaymentLinkModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleRegeneratePaymentLink}
                      disabled={isRegeneratingPaymentLink}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isRegeneratingPaymentLink ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate Link
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Driver Assignment */}
          <div>
            <h3 className="text-sm font-medium mb-3">Driver Assignment</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="w-full bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:hover:bg-green-500/20 dark:border-green-500/30"
                onClick={() => {
                  loadAvailableResources();
                  setIsAssignModalOpen(true);
                }}
                disabled={status === 'cancelled' || status === 'completed'}
              >
                <UserIcon className="mr-2 h-5 w-5" />
                {booking.driver_id ? 'Reassign Driver' : 'Assign Driver'}
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <div className="relative flex items-center py-2 mb-3">
              <div className="flex-grow border-t"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-sm">{t('bookings.details.bookingActions.dangerZone')}</span>
              <div className="flex-grow border-t"></div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="w-full bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 dark:border-red-500/30"
                  disabled={status === 'cancelled'}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  {t('bookings.details.bookingActions.cancelBooking')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    {t('bookings.details.actions.confirmCancellation')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('bookings.details.actions.cancellationWarning')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex space-x-2 py-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.processing')}
                      </>
                    ) : (
                      t('bookings.details.actions.confirmCancel')
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Smart Assignment Modal - Now using shared component */}
      <SmartAssignmentModal
        booking={{
          id: booking.id,
          wp_id: booking.wp_id,
          service_name: booking.service_name,
          date: booking.date,
          time: booking.time,
          customer_name: booking.customer_name,
          driver_id: booking.driver_id,
          vehicle_id: booking.vehicle_id,
          driver: booking.driver,
          vehicle: booking.vehicle
        }}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssign}
        drivers={drivers}
        vehicles={vehicles}
        title={`Smart Assignment for #${booking.wp_id || bookingId}`}
        subtitle="Select a driver and vehicle for this booking. The system will suggest the best matches based on the service type."
      />
    </>
  )
} 