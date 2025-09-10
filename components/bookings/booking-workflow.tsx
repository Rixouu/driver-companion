"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import LoadingModal from '@/components/ui/loading-modal';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Receipt, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  Mail,
  ExternalLink,
  Loader2,
  Link2,
  RefreshCw,
  Info,
  User,
  Car,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';
import { format, parseISO, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';
import { Booking } from '@/types/bookings';
import { toast } from '@/components/ui/use-toast';
import { updateBookingAction } from '@/app/actions/bookings';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'skipped';
  date?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
    disabled?: boolean;
    icon?: React.ReactNode;
  };
  warning?: string;
}

interface BookingWorkflowProps {
  booking: {
    id: string;
    status: string;
    created_at: string;
    payment_status?: string;
    payment_completed_at?: string;
    driver_id?: string;
    vehicle_id?: string;
    assigned_at?: string;
    completed_at?: string;
    date: string;
    time: string;
    customer_email?: string;
    customer_name?: string;
    price?: {
      amount: number;
      currency: string;
      formatted: string;
    };
    payment_link?: string;
    payment_link_generated_at?: string;
    payment_link_expires_at?: string;
    receipt_url?: string;
    meta?: Record<string, any>;
  };
  onMarkAsPaid?: () => void;
  onAssignDriver?: () => void;
  onMarkAsComplete?: () => void;
  onRefresh?: () => void;
  isOrganizationMember?: boolean;
}

export const BookingWorkflow = React.forwardRef<{ openMarkAsPaidDialog: () => void }, BookingWorkflowProps>(({ 
  booking, 
  onMarkAsPaid,
  onAssignDriver,
  onMarkAsComplete,
  onRefresh,
  isOrganizationMember = false
}, ref) => {
  const { t } = useI18n();

  // Mark As Paid Dialog State
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  
  // Omise Payment Checking State
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  const [receiptInfo, setReceiptInfo] = useState<any>(null);
  
  // Payment Completion Email State
  const [sendPaymentCompleteEmail, setSendPaymentCompleteEmail] = useState(true);
  const [paymentEmailLanguage, setPaymentEmailLanguage] = useState<'en' | 'ja'>('en');
  const [paymentEmailBcc, setPaymentEmailBcc] = useState<string>("booking@japandriver.com");
  const [isSendingPaymentEmail, setIsSendingPaymentEmail] = useState(false);

  // Auto-fill payment amount when booking changes
  React.useEffect(() => {
    console.log('Booking price:', booking.price, 'Type:', typeof booking.price);
    if (booking.price?.amount) {
      const amount = typeof booking.price.amount === 'string' 
        ? booking.price.amount 
        : booking.price.amount.toString();
      console.log('Setting payment amount to:', amount);
      setPaymentAmount(amount);
    }
  }, [booking.price?.amount]);

  // Mark As Complete Dialog State
  const [isMarkAsCompleteDialogOpen, setIsMarkAsCompleteDialogOpen] = useState(false);
  const [isMarkingAsComplete, setIsMarkingAsComplete] = useState(false);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    openMarkAsPaidDialog: () => setIsMarkAsPaidDialogOpen(true)
  }));

  // Check if booking is overdue (past the booking date)
  const isOverdue = () => {
    if (!booking.date) return false;
    const bookingDateTime = new Date(`${booking.date}T${booking.time || '00:00'}`);
    const now = new Date();
    return isBefore(bookingDateTime, now) && booking.status !== 'completed' && booking.status !== 'cancelled';
  };

  // Check if booking should be automatically marked as complete
  const shouldAutoComplete = () => {
    if (!booking.date) return false;
    const bookingDateTime = new Date(`${booking.date}T${booking.time || '00:00'}`);
    const now = new Date();
    const hoursSinceBooking = differenceInDays(now, bookingDateTime) * 24 + (now.getHours() - bookingDateTime.getHours());
    
    // Auto-complete if booking was more than 24 hours ago and not already completed
    return hoursSinceBooking >= 24 && booking.status !== 'completed' && booking.status !== 'cancelled';
  };

  // Auto-complete booking if needed
  useEffect(() => {
    if (shouldAutoComplete() && isOrganizationMember) {
      handleAutoComplete();
    }
  }, [booking.date, booking.time, booking.status]);

  const handleAutoComplete = async () => {
    try {
      await updateBookingAction(booking.id, {
        status: 'completed',
        meta: {
          ...(booking.meta as unknown as Record<string, any>),
          completed_at: new Date().toISOString() as unknown as string
        }
      });
      
      toast({
        title: "Booking Auto-Completed",
        description: "This booking has been automatically marked as complete.",
      });
      
      onRefresh?.();
    } catch (error) {
      console.error('Error auto-completing booking:', error);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!isOrganizationMember) return;
    
    setIsMarkingAsPaid(true);
    
    try {
      const updateData: Partial<Booking> = {
        payment_status: 'paid',
        meta: {
          ...(booking.meta || {}),
          payment_completed_at: new Date().toISOString(),
          payment_amount: paymentAmount ? parseFloat(paymentAmount) : undefined
        },
        payment_method: paymentMethod,
        status: 'confirmed' // Mark as confirmed when paid
      };

      // Add receipt URL if file was uploaded
      if (receiptFile) {
        // In a real implementation, you'd upload the file and get a URL
        updateData.meta = {
          ...(booking.meta || {}),
          receipt_url: `receipt_${booking.id}_${Date.now()}.pdf`
        };
      }

      // Add payment notes to meta
      if (paymentNotes) {
        updateData.meta = {
          ...(booking.meta || {}),
          payment_notes: paymentNotes
        };
      }

      // Add payment method to meta
      if (paymentNotes) {
        updateData.meta = {
          ...(booking.meta || {}),
          payment_method: paymentMethod
        };
      }

      const result = await updateBookingAction(booking.id, updateData);
      
      if (result.success) {
        // Send payment completion email if requested
        if (sendPaymentCompleteEmail) {
          try {
            setIsSendingPaymentEmail(true);
            
            const emailResponse = await fetch('/api/bookings/send-payment-complete-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                booking_id: booking.id,
                language: paymentEmailLanguage,
                bcc_emails: paymentEmailBcc
              })
            });
            
            if (emailResponse.ok) {
              toast({
                title: "Payment Completion Email Sent",
                description: "Customer has been notified of payment completion",
                variant: "default",
              });
            } else {
              const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }));
              toast({
                title: "Email Send Failed",
                description: `Payment was marked as complete, but email failed: ${errorData.error || 'Unknown error'}`,
                variant: "destructive",
              });
            }
          } catch (emailError) {
            console.error('Error sending payment completion email:', emailError);
            toast({
              title: "Payment Completion Email Failed",
              description: "Payment was marked as complete, but email failed",
              variant: "destructive",
            });
          } finally {
            setIsSendingPaymentEmail(false);
          }
        } else {
          toast({
            title: "Payment Marked as Complete",
            description: "The booking has been marked as paid and confirmed.",
          });
        }
        
        setIsMarkAsPaidDialogOpen(false);
        onMarkAsPaid?.();
        onRefresh?.();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error marking booking as paid:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark booking as paid",
        variant: "destructive"
      });
    } finally {
      setIsMarkingAsPaid(false);
    }
  };

  // Handle checking Omise payment status
  const handleCheckPaymentStatus = async () => {
    if (!booking.id) return;
    
    setIsCheckingPayment(true);
    try {
      const response = await fetch('/api/quotations/check-omise-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: booking.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const { payment, receipt } = result;
        
        if (payment.isPaid) {
          toast({
            title: "Payment Confirmed",
            description: `Payment of ${payment.currency} ${(payment.amount / 100).toLocaleString()} completed on ${new Date(payment.paidAt).toLocaleDateString()}`,
            variant: "default",
          });
          
          // Auto-fill payment details if payment is confirmed
          setPaymentAmount((payment.amount / 100).toString());
          setPaymentMethod('omise');
          setPaymentDate(new Date(payment.paidAt).toISOString().split('T')[0]);
          
          // If receipt is available, show receipt information and auto-download
          if (receipt) {
            setReceiptInfo(receipt);
            toast({
              title: "Receipt Available",
              description: `Receipt #${receipt.receiptId} generated. Total: ${receipt.currency} ${(receipt.total / 100).toLocaleString()}`,
              variant: "default",
            });

            // Update booking with receipt URL for email attachment
            try {
              const updateResponse = await fetch(`/api/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  receipt_url: receipt.receiptUrl
                })
              });
              
              if (updateResponse.ok) {
                console.log('Receipt URL saved to booking for email attachment');
              }
            } catch (error) {
              console.error('Error saving receipt URL:', error);
            }
            
            // Automatically download the receipt
            try {
              // Use server-side download endpoint to avoid CORS issues
              const downloadResponse = await fetch('/api/quotations/download-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receipt_url: receipt.receiptUrl })
              });

              if (downloadResponse.ok) {
                // Create blob and download
                const blob = await downloadResponse.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `receipt-${receipt.receiptId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                toast({
                  title: "Receipt Downloaded",
                  description: "Receipt PDF has been automatically downloaded to your device.",
                  variant: "default",
                });
              } else {
                throw new Error('Download failed');
              }
            } catch (downloadError) {
              console.error('Error auto-downloading receipt:', downloadError);
              toast({
                title: "Download Failed",
                description: "Receipt information is available, but automatic download failed. Please use the download button.",
                variant: "destructive",
              });
            }
          }
          
          // Refresh the booking data
          onRefresh?.();
        } else {
          toast({
            title: "Payment Pending",
            description: "Payment has not been completed yet.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Payment Check Failed",
          description: result.error || "Could not retrieve payment status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast({
        title: "Error",
        description: "Failed to check payment status",
        variant: "destructive",
      });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!isOrganizationMember) return;
    
    setIsMarkingAsComplete(true);
    
    try {
      const updateData: Partial<Booking> = {
        status: 'completed',
        meta: {
          ...(booking.meta || {}),
          completed_at: new Date().toISOString()
        }
      };

      // Add completion notes to meta
      if (completionNotes) {
        updateData.meta = {
          ...(booking.meta || {}),
          completion_notes: completionNotes
        };
      }

      const result = await updateBookingAction(booking.id, updateData);
      
      if (result.success) {
        toast({
          title: "Booking Completed",
          description: "The booking has been marked as complete.",
        });
        
        setIsMarkAsCompleteDialogOpen(false);
        onMarkAsComplete?.();
        onRefresh?.();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error marking booking as complete:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark booking as complete",
        variant: "destructive"
      });
    } finally {
      setIsMarkingAsComplete(false);
    }
  };

  // Define workflow steps based on booking status and data
  const getWorkflowSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [
      {
        id: 'pending',
        title: 'Pending Booking',
        description: 'Booking created and awaiting confirmation',
        icon: <FileText className="h-4 w-4" />,
        status: booking.status === 'pending' ? 'current' : 'completed',
        date: booking.created_at,
        ...(booking.status === 'pending' && isOrganizationMember ? {
          action: {
            label: 'Mark as Paid',
            onClick: () => setIsMarkAsPaidDialogOpen(true),
            disabled: false,
            icon: <CreditCard className="h-4 w-4" />
          }
        } : {})
      },
      {
        id: 'confirmed',
        title: 'Confirmed',
        description: 'Booking confirmed and payment received',
        icon: <CheckCircle className="h-4 w-4" />,
        status: booking.status === 'pending' ? 'pending' : 
                ['confirmed', 'assigned', 'completed'].includes(booking.status) ? 'completed' : 
                booking.payment_status === 'paid' ? 'current' : 'pending',
        date: booking.payment_completed_at || (['confirmed', 'assigned', 'completed'].includes(booking.status) ? booking.created_at : undefined),
        // No action needed - once paid, booking is automatically confirmed
      },
      {
        id: 'assigned',
        title: 'Assigned',
        description: 'Driver and vehicle assigned to booking',
        icon: <User className="h-4 w-4" />,
        status: booking.status === 'pending' ? 'pending' :
                booking.driver_id && booking.vehicle_id ? 'completed' : 
                ['confirmed', 'assigned', 'completed'].includes(booking.status) ? 'current' : 'pending',
        date: booking.meta?.assigned_at || (booking.driver_id && booking.vehicle_id ? booking.created_at : undefined),
        ...(booking.status === 'confirmed' && (!booking.driver_id || !booking.vehicle_id) && isOrganizationMember ? {
          action: {
            label: 'Assign Driver & Vehicle',
            onClick: () => onAssignDriver?.(),
            disabled: false,
            icon: <Car className="h-4 w-4" />
          }
        } : {})
      },
      {
        id: 'completed',
        title: 'Completed',
        description: 'Booking service completed',
        icon: <CheckCircle2 className="h-4 w-4" />,
        status: booking.status === 'pending' ? 'pending' :
                booking.status === 'completed' ? 'completed' : 
                shouldAutoComplete() ? 'current' : 'pending',
        date: booking.completed_at || (booking.status === 'completed' ? booking.created_at : undefined),
        ...(booking.status === 'assigned' && isOrganizationMember ? {
          action: {
            label: 'Mark as Complete',
            onClick: () => setIsMarkAsCompleteDialogOpen(true),
            disabled: false,
            icon: <CheckCircle2 className="h-4 w-4" />
          }
        } : {}),
        ...(isOverdue() ? {
          warning: 'This booking is overdue and should be completed or cancelled'
        } : {})
      }
    ];

    return steps;
  };

  const steps = getWorkflowSteps();
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Booking Workflow
              </CardTitle>
              <CardDescription>
                Track the progress of this booking through each stage
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isMarkingAsPaid || isMarkingAsComplete}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const nextStep = steps[index + 1];
              
              return (
                <div key={step.id} className="relative">
                  {/* Step Content */}
                  <div className="flex items-start gap-4">
                    {/* Icon with status indicator */}
                    <div className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                      step.status === 'completed' ? 'text-green-600 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-900/20 dark:border-green-600' :
                      step.status === 'current' ? 'text-blue-600 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-600' :
                      'text-gray-400 bg-gray-100 border-gray-300 dark:text-gray-500 dark:bg-gray-900/20 dark:border-gray-600'
                    )}>
                      {step.icon}
                      {step.status === 'completed' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Step Details */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "font-medium text-sm",
                            step.status === 'completed' ? 'text-green-700 dark:text-green-300' :
                            step.status === 'current' ? 'text-blue-700 dark:text-blue-300' :
                            'text-gray-500 dark:text-gray-400'
                          )}>
                            {step.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.description}
                          </p>
                          
                          {/* Date and warning */}
                          <div className="flex items-center gap-2 mt-2">
                            {step.date && (
                              <Badge variant="outline" className="text-xs">
                                {format(parseISO(step.date), 'MMM dd, yyyy \'at\' h:mm a')}
                              </Badge>
                            )}
                            {step.warning && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {step.warning}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Action Button - positioned below step details */}
                          {step.action && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant={step.action.variant || 'default'}
                                onClick={step.action.onClick}
                                disabled={step.action.disabled || isMarkingAsPaid || isMarkingAsComplete}
                              >
                                {step.action.label}
                                {step.action.icon}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {!isLast && (
                    <div className={cn(
                      "absolute left-5 top-10 w-0.5 h-6 transition-colors",
                      step.status === 'completed' ? 'bg-green-400 dark:bg-green-500' :
                      step.status === 'current' ? 'bg-blue-400 dark:bg-blue-500' :
                      'bg-gray-300 dark:bg-gray-600'
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Status */}
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className={
                  booking.status === 'pending' ? 'text-amber-600 border-amber-300 bg-amber-100 dark:text-amber-400 dark:border-amber-600 dark:bg-amber-900/20' :
                  booking.status === 'confirmed' ? 'text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20' :
                  booking.status === 'assigned' ? 'text-blue-600 border-blue-300 bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:bg-blue-900/20' :
                  booking.status === 'completed' ? 'text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20' :
                  booking.status === 'cancelled' ? 'text-red-600 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20' :
                  'text-gray-600 border-gray-300 bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-900/20'
                }>
                  {booking.status === 'pending' ? 'Pending Booking' :
                   booking.status === 'confirmed' ? 'Confirmed' :
                   booking.status === 'assigned' ? 'Assigned' :
                   booking.status === 'completed' ? 'Completed' :
                   booking.status === 'cancelled' ? 'Cancelled' :
                   booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark As Paid Dialog */}
      <Dialog open={isMarkAsPaidDialogOpen} onOpenChange={setIsMarkAsPaidDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mark Booking as Paid</DialogTitle>
            <DialogDescription>
              Mark this booking as paid and optionally upload a receipt.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="omise">Omise</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <div className="relative">
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="pr-12"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">
                    {booking.price?.currency || 'JPY'}
                  </span>
                </div>
              </div>
              {booking.price?.amount && (
                <p className="text-xs text-muted-foreground">
                  Auto-filled from booking price: {booking.price.currency || 'JPY'} {booking.price.amount.toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-notes">Payment Notes (Optional)</Label>
              <Input
                id="payment-notes"
                placeholder="Add any notes about the payment..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receipt-upload">Receipt</Label>
              <div className="space-y-3">
                {/* Check Omise Payment Status */}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCheckPaymentStatus}
                  disabled={isCheckingPayment}
                  className="w-full"
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Check Omise Payment Status
                    </>
                  )}
                </Button>
                
                {/* Receipt Information */}
                {receiptInfo && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200">Omise Receipt Available</h4>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          Receipt #{receiptInfo.receiptId} - {receiptInfo.currency} {(receiptInfo.total / 100).toLocaleString()}
                        </p>
                        <p className="text-xs text-green-500 dark:text-green-400">
                          Issued: {new Date(receiptInfo.issuedOn).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const downloadResponse = await fetch('/api/quotations/download-receipt', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ receipt_url: receiptInfo.receiptUrl })
                            });

                            if (downloadResponse.ok) {
                              const blob = await downloadResponse.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `receipt-${receiptInfo.receiptId}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            } else {
                              throw new Error('Download failed');
                            }
                          } catch (error) {
                            console.error('Error downloading receipt:', error);
                            toast({
                              title: "Download Failed",
                              description: "Failed to download receipt. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Upload Receipt */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <Input
                    id="receipt-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Accepted formats: PDF, JPG, PNG, DOC, DOCX
                  </p>
                </div>
                
                {/* Show existing receipt if available */}
                {booking.receipt_url && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Receipt uploaded</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(booking.receipt_url, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Completion Email Configuration */}
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-payment-email"
                checked={sendPaymentCompleteEmail}
                onCheckedChange={(checked) => setSendPaymentCompleteEmail(checked as boolean)}
              />
              <Label htmlFor="send-payment-email" className="text-sm font-medium">
                Send Payment Completion Email
              </Label>
            </div>
            
            {sendPaymentCompleteEmail && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <div>
                  <Label htmlFor="payment-email-language">Language</Label>
                  <Select value={paymentEmailLanguage} onValueChange={(value: 'en' | 'ja') => setPaymentEmailLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="payment-email-bcc">BCC Emails</Label>
                  <Input
                    id="payment-email-bcc"
                    value={paymentEmailBcc}
                    onChange={(e) => setPaymentEmailBcc(e.target.value)}
                    placeholder="Enter email addresses separated by commas"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: booking@japandriver.com. Add more emails separated by commas.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What's included in the email:</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Payment completion confirmation</li>
                    <li>• Booking details and service information</li>
                    <li>• Payment method and amount details</li>
                    <li>• Next steps and contact information</li>
                    <li>• Company branding and contact information</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMarkAsPaidDialogOpen(false)}
              disabled={isMarkingAsPaid || isSendingPaymentEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isMarkingAsPaid || isSendingPaymentEmail}
              className="flex items-center gap-2"
            >
              {(isMarkingAsPaid || isSendingPaymentEmail) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSendingPaymentEmail ? (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sending Email...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {sendPaymentCompleteEmail ? 'Mark as Paid & Send Email' : 'Mark as Paid'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark As Complete Dialog */}
      <Dialog open={isMarkAsCompleteDialogOpen} onOpenChange={setIsMarkAsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Booking as Complete</DialogTitle>
            <DialogDescription>
              Confirm that the booking service has been completed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="completion-notes">Completion Notes (Optional)</Label>
              <Input
                id="completion-notes"
                placeholder="Add any notes about the completion..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMarkAsCompleteDialogOpen(false)}
              disabled={isMarkingAsComplete}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsComplete}
              disabled={isMarkingAsComplete}
              className="flex items-center gap-2"
            >
              {isMarkingAsComplete && <Loader2 className="h-4 w-4 animate-spin" />}
              Mark as Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Modal */}
      <LoadingModal 
        open={isMarkingAsPaid || isMarkingAsComplete} 
        title={isMarkingAsPaid ? "Marking as Paid..." : "Marking as Complete..."}
        variant="default"
        value={progressPercentage}
        label="Updating Booking Status"
        steps={steps.map(step => ({
          label: step.title,
          value: step.status === 'completed' ? 100 : 0
        }))}
        showSteps={true}
      />
    </>
  );
});

BookingWorkflow.displayName = "BookingWorkflow";
