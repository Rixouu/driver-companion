"use client";

import React, { useState } from 'react';
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
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Send, 
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
  Info
} from 'lucide-react';
import { format, parseISO, addDays, differenceInDays, isAfter } from 'date-fns';
import { QuotationStatus } from '@/types/quotations';
import { toast } from '@/components/ui/use-toast';

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
    icon?: React.ReactNode; // Added icon to action
  };
  warning?: string;
}

interface QuotationWorkflowProps {
  quotation: {
    id: string;
    status: QuotationStatus;
    created_at: string;
    expiry_date?: string;
    last_sent_at?: string;
    reminder_sent_at?: string;
    approved_at?: string;
    rejected_at?: string;
    invoice_generated_at?: string;
    payment_completed_at?: string;
    payment_link_sent_at?: string;
    payment_link?: string;
    payment_link_generated_at?: string;
    payment_link_expires_at?: string;
    booking_created_at?: string;
    quote_number?: number;
    customer_email?: string;
    customer_name?: string;
    amount?: number;
    total_amount?: number;
    currency?: string;
    receipt_url?: string; // Added receipt_url to quotation type
  };
  onSendQuotation?: () => void;
  onSendReminder?: () => void;
  onGenerateInvoice?: () => void;
  onSendPaymentLink?: () => void;
  onCreateBooking?: () => void;
  onRefresh?: () => void;
  isOrganizationMember?: boolean;

}

export const QuotationWorkflow = React.forwardRef<{ openPaymentLinkDialog: () => void; openSendQuotationDialog: () => void }, QuotationWorkflowProps>(({ 
  quotation, 
  onSendQuotation,
  onSendReminder,
  onGenerateInvoice,
  onSendPaymentLink,
  onCreateBooking,
  onRefresh,
  isOrganizationMember = false
}, ref) => {
  const { t, language } = useI18n();

  // Send Quotation Dialog State
  const [isSendQuotationDialogOpen, setIsSendQuotationDialogOpen] = useState(false);
  const [isSendingQuotation, setIsSendingQuotation] = useState(false);
  const [sendQuotationLanguage, setSendQuotationLanguage] = useState<'en' | 'ja'>(language as 'en' | 'ja');
  const [sendQuotationBccEmails, setSendQuotationBccEmails] = useState<string>("booking@japandriver.com");
  
  // Payment Link Dialog State
  const [isPaymentLinkDialogOpen, setIsPaymentLinkDialogOpen] = useState(false);
  const [isSendingPaymentLink, setIsSendingPaymentLink] = useState(false);
  const [emailLanguage, setEmailLanguage] = useState<'en' | 'ja'>(language as 'en' | 'ja');
  const [emailAddress, setEmailAddress] = useState(quotation?.customer_email || '');
  const [bccEmails, setBccEmails] = useState<string>("booking@japandriver.com")
  const [paymentLink, setPaymentLink] = useState<string>("");
  const [customPaymentName, setCustomPaymentName] = useState<string>("");
  const [paymentLinkSent, setPaymentLinkSent] = useState<boolean>(false);
  const [paymentLinkSentAt, setPaymentLinkSentAt] = useState<string | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  
  // Convert to Booking Loading State
  const [isConvertingToBooking, setIsConvertingToBooking] = useState(false);
  
  // Mark As Paid Dialog State
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<string>(
    (quotation.total_amount || quotation.amount)?.toString() || "0.00"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("Credit Card");
  
  // Update payment amount when quotation changes
  React.useEffect(() => {
    const newAmount = (quotation.total_amount || quotation.amount)?.toString() || "0.00";
    console.log('QuotationWorkflow - Payment amount update:', {
      total_amount: quotation.total_amount,
      amount: quotation.amount,
      newAmount,
      receipt_url: quotation.receipt_url
    });
    setPaymentAmount(newAmount);
  }, [quotation.total_amount, quotation.amount, quotation.receipt_url]);

  // Check if payment link was already sent
  React.useEffect(() => {
    if ((quotation as any).payment_link_sent_at) {
      setPaymentLinkSent(true);
      setPaymentLinkSentAt((quotation as any).payment_link_sent_at);
    }
    if ((quotation as any).payment_link) {
      setPaymentLink((quotation as any).payment_link);
    }
  }, [(quotation as any).payment_link_sent_at, (quotation as any).payment_link]);

  // Handle sending quotation with configured settings
  const handleSendQuotationWithSettings = async () => {
    if (!quotation?.customer_email) {
      toast({
        title: "Error",
        description: "No customer email found for this quotation",
        variant: "destructive",
      });
      return;
    }

    setIsSendingQuotation(true);
    try {
      // Prepare FormData for the send-email endpoint
      const formData = new FormData();
      formData.append('email', quotation.customer_email);
      formData.append('quotation_id', quotation.id);
      formData.append('language', sendQuotationLanguage);
      formData.append('include_details', 'true');
      formData.append('bcc_emails', sendQuotationBccEmails);

      const response = await fetch('/api/quotations/send-email', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send quotation email');
      }

      toast({
        title: "Success",
        description: "Quotation sent successfully!",
      });

      setIsSendQuotationDialogOpen(false);
      
      // Call the parent's onSendQuotation callback to refresh the workflow
      if (onSendQuotation) {
        onSendQuotation();
      }
      
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send quotation",
        variant: "destructive",
      });
    } finally {
      setIsSendingQuotation(false);
    }
  };

  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    openPaymentLinkDialog: () => setIsPaymentLinkDialogOpen(true),
    openSendQuotationDialog: () => setIsSendQuotationDialogOpen(true)
  }));
  
  // Progress modal state
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressTitle, setProgressTitle] = useState('Processing');
  const [progressLabel, setProgressLabel] = useState('Starting...');

  // Handle sending payment link
  const handleSendPaymentLink = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // If no payment link provided, we'll generate one via the API
    if (!paymentLink || !paymentLink.includes('http')) {
      // Set a placeholder for now - the API will generate the actual link
      setPaymentLink('https://placeholder.com/generate-payment-link');
    }

    if (!quotation.id) {
      toast({
        title: "Error",
        description: "Quotation ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (!quotation.quote_number) {
      toast({
        title: "Error",
        description: "Quotation number is missing",
        variant: "destructive",
      });
      return;
    }
    
    setIsSendingPaymentLink(true);
    setProgressOpen(true);
    setProgressTitle('Sending Payment Link');
    setProgressLabel('Preparing email...');
    setProgressValue(15);
    
    try {
      console.log('Starting payment link sending process...');
      console.log('Email:', emailAddress);
      console.log('Language:', emailLanguage);
      console.log('Payment Link:', paymentLink);
      console.log('Include Details: true');
      
      // Generate the PDF using server-side generation for proper discount calculations
      const pdfResponse = await fetch('/api/quotations/generate-invoice-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_id: quotation.id,
          language: emailLanguage,
          include_details: true
        })
      });

      if (!pdfResponse.ok) {
        const pdfError = await pdfResponse.text();
        console.error('PDF generation failed:', pdfError);
        throw new Error(`Failed to generate PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }

      console.log('PDF generated successfully');
      const pdfBlob = await pdfResponse.blob();
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty or invalid');
      }
      
      console.log('PDF blob size:', pdfBlob.size, 'bytes');
      setProgressValue(50);
      setProgressLabel('Sending payment link email...');

      // Create form data for the payment link email API
      const formData = new FormData();
      formData.append('email', emailAddress);
      formData.append('quotation_id', quotation.id);
      formData.append('customer_name', quotation.customer_name || quotation.customer_email?.split('@')[0] || 'Customer');
      formData.append('include_details', 'true');
      formData.append('language', emailLanguage);
      formData.append('bcc_emails', bccEmails);
      // Only send payment_link if it's a real URL, otherwise let the API generate one
      if (paymentLink && !paymentLink.includes('placeholder.com')) {
        formData.append('payment_link', paymentLink);
      }
      // Add custom payment name if provided
      if (customPaymentName) {
        formData.append('custom_payment_name', customPaymentName);
      }
      formData.append('invoice_pdf', pdfBlob, `INV-JPDR-${String(quotation.quote_number || 0).padStart(6, '0')}.pdf`);

      console.log('Form data prepared, sending email...');
      console.log('Form data entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // Send payment link email via new API endpoint
      const emailResponse = await fetch('/api/quotations/send-payment-link-email', {
        method: 'POST',
        body: formData
      });

      console.log('Email API response status:', emailResponse.status);
      console.log('Email API response ok:', emailResponse.ok);

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Payment link email API error:', errorData);
        throw new Error(errorData.error || `Failed to send payment link email: ${emailResponse.status} ${emailResponse.statusText}`);
      }

      setProgressValue(100);
      setProgressLabel('Payment link sent successfully!');
      setTimeout(() => setProgressOpen(false), 400);
      
      // Update the quotation status to mark payment link as sent
      try {
        const updateResponse = await fetch(`/api/quotations/${quotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_link_sent_at: new Date().toISOString()
          })
        });
        
        if (updateResponse.ok) {
          console.log('Quotation status updated successfully');
          // Mark payment link as sent locally
          setPaymentLinkSent(true);
          setPaymentLinkSentAt(new Date().toISOString());
        } else {
          console.warn('Failed to update quotation status, but payment link was sent');
        }
      } catch (error) {
        console.warn('Error updating quotation status:', error);
      }
      
      toast({
        title: "Payment Link Sent",
        description: `Payment link has been sent to ${emailAddress}`,
      });
      
      setIsPaymentLinkDialogOpen(false);
      // Don't call the callback since we're handling everything internally now
      // if (onSendPaymentLink) {
      //   onSendPaymentLink();
      // }
      
      // Refresh the quotation data to update the workflow status
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error sending payment link email:', error);
      setProgressOpen(false);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to send payment link. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSendingPaymentLink(false);
    }
  };

  // Handle checking Omise payment status
  const handleCheckPaymentStatus = async () => {
    if (!quotation.id) return;
    
    setIsCheckingPayment(true);
    try {
      const response = await fetch('/api/quotations/download-omise-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quotation.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Payment Status Retrieved",
          description: result.message,
          variant: "default",
        });
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

  // Handle marking quotation as paid
  const handleMarkAsPaid = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsMarkingAsPaid(true);
    setProgressOpen(true);
    setProgressTitle('Marking as Paid');
    setProgressLabel('Updating quotation status...');
    setProgressValue(25);

    try {
      // Update the quotation status to mark as paid
      const updateResponse = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          payment_completed_at: new Date().toISOString(),
          payment_amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
          payment_date: paymentDate
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update quotation status');
      }

      setProgressValue(75);
      setProgressLabel('Processing receipt...');

      // If there's a receipt file, upload it
      if (receiptFile) {
        const formData = new FormData();
        formData.append('receipt', receiptFile);
        formData.append('quotation_id', quotation.id);
        formData.append('payment_date', paymentDate);
        formData.append('payment_amount', paymentAmount);
        formData.append('payment_method', paymentMethod);

        const receiptResponse = await fetch('/api/quotations/upload-receipt', {
          method: 'POST',
          body: formData
        });

        if (!receiptResponse.ok) {
          const errorData = await receiptResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Receipt upload failed:', errorData);
          toast({
            title: "Receipt Upload Failed",
            description: `Payment was marked as complete, but receipt upload failed: ${errorData.error || 'Unknown error'}`,
            variant: "destructive",
          });
        } else {
          console.log('Receipt uploaded successfully');
          toast({
            title: "Receipt Uploaded",
            description: "Receipt has been uploaded successfully",
          });
        }
      }

      setProgressValue(100);
      setProgressLabel('Payment marked as complete!');
      setTimeout(() => setProgressOpen(false), 500);

      toast({
        title: "Payment Marked as Complete",
        description: "Quotation has been marked as paid successfully",
      });

      setIsMarkAsPaidDialogOpen(false);
      
      // Refresh the quotation data to update the workflow
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      setProgressOpen(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as paid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAsPaid(false);
    }
  };

  // Calculate expiry status properly - quotation is valid for 2 days from creation (same logic as quotation info card)
  const now = new Date();
  const createdDate = new Date(quotation.created_at);
  // Calculate proper expiry date: 3 days from creation (so it expires in 2 days)
  const properExpiryDate = addDays(createdDate, 3);
  const daysUntilExpiry = differenceInDays(properExpiryDate, now);
  const isExpired = isAfter(now, properExpiryDate);

  // Check if reminder should be sent (1 day before expiry)
  const shouldSendReminder = daysUntilExpiry !== null && daysUntilExpiry <= 1 && daysUntilExpiry > 0 && !quotation.reminder_sent_at && quotation.status === 'sent';

  // Check if reminder step should be shown
  const shouldShowReminder = quotation.status !== 'draft' && (shouldSendReminder || quotation.reminder_sent_at);

  // Define workflow steps based on quotation status and data
  const getWorkflowSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [
      {
        id: 'draft',
        title: t('quotations.workflow.draft.title'),
        description: t('quotations.workflow.draft.description'),
        icon: <FileText className="h-4 w-4" />,
        status: 'completed',
        date: quotation.created_at
      },
      {
        id: 'send',
        title: t('quotations.workflow.send.title'),
        description: t('quotations.workflow.send.description'),
        icon: <Send className="h-4 w-4" />,
        status: quotation.status === 'draft' ? 'current' : 
                (quotation.last_sent_at || ['sent', 'approved', 'rejected', 'paid', 'converted'].includes(quotation.status)) ? 'completed' : 'pending',
        date: quotation.last_sent_at || (['sent', 'approved', 'rejected', 'paid', 'converted'].includes(quotation.status) ? quotation.created_at : undefined),
        ...(quotation.status === 'draft' && isOrganizationMember ? {
          action: {
            label: 'Send Now',
            onClick: () => setIsSendQuotationDialogOpen(true),
            disabled: false
          }
        } : {})
      }
    ];

    // Add reminder step only if needed (conditionally)
    if (shouldShowReminder) {
      steps.push({
        id: 'reminder',
        title: t('quotations.workflow.reminder.title'),
        description: t('quotations.workflow.reminder.description'),
        icon: <Clock className="h-4 w-4" />,
        status: quotation.reminder_sent_at ? 'completed' : 
                shouldSendReminder ? 'current' : 'pending',
        date: quotation.reminder_sent_at,
        ...(shouldSendReminder && isOrganizationMember ? {
          action: {
            label: t('quotations.workflow.actions.sendReminder'),
            onClick: onSendReminder || (() => {}),
            variant: 'outline' as const,
            disabled: !onSendReminder
          },
          warning: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
        } : {})
      });
    }

    // Add approval step
    steps.push({
      id: 'approve',
      title: quotation.status === 'rejected' 
        ? (t('quotations.workflow.rejected.title') || 'Rejected')
        : t('quotations.workflow.approve.title'),
      description: quotation.status === 'rejected'
        ? (t('quotations.workflow.rejected.description') || 'Quotation was rejected by customer')
        : t('quotations.workflow.approve.description'),
      icon: quotation.status === 'rejected' 
        ? <AlertTriangle className="h-4 w-4" />
        : <CheckCircle className="h-4 w-4" />,
      status: (quotation.status === 'approved' || quotation.approved_at) ? 'completed' :
              (quotation.status === 'rejected' || quotation.rejected_at) ? 'completed' :
              ['sent'].includes(quotation.status) ? 'current' : 'pending',
      date: quotation.approved_at || quotation.rejected_at
    });

    // Add post-approval steps only if quotation is approved
    if (quotation.status === 'approved' || quotation.invoice_generated_at || quotation.payment_completed_at || quotation.booking_created_at) {
      steps.push(
        {
          id: 'payment_link_sent',
          title: 'Payment Method Selected',
          description: 'Payment link sent to customer or bank transfer method selected',
          icon: <Mail className="h-4 w-4" />,
          status: quotation.payment_completed_at ? 'completed' : 
                  quotation.payment_link_sent_at ? 'completed' : 
                  quotation.status === 'approved' ? 'current' : 'pending',
          date: quotation.payment_link_sent_at,
          ...(quotation.status === 'approved' && !quotation.payment_link_sent_at && !quotation.payment_completed_at && isOrganizationMember ? {
            action: {
              label: 'Send Payment Link',
              onClick: () => setIsPaymentLinkDialogOpen(true),
              variant: 'default' as const
            }
          } : {})
        },
        {
          id: 'paid',
          title: 'Marked as Paid',
          description: 'Quotation has been marked as paid',
          icon: <CheckCircle className="h-4 w-4" />,
          status: (quotation.status === 'paid' || quotation.payment_completed_at) ? 'completed' : 'pending',
          date: quotation.payment_completed_at,
          ...(quotation.payment_link_sent_at && quotation.status !== 'paid' && !quotation.payment_completed_at && isOrganizationMember ? {
            action: {
              label: 'Mark As Paid',
              onClick: () => setIsMarkAsPaidDialogOpen(true),
              variant: 'default' as const
            }
          } : {})
        },
        {
          id: 'booking',
          title: 'Convert to Booking',
          description: 'Convert approved quotation to a booking',
          icon: <Calendar className="h-4 w-4" />,
          status: quotation.booking_created_at ? 'completed' :
                  quotation.status === 'paid' ? 'current' : 'pending',
          date: quotation.booking_created_at,
          ...(quotation.status === 'paid' && !quotation.booking_created_at && isOrganizationMember ? {
            action: {
              label: isConvertingToBooking ? 'Converting...' : 'Convert to Booking',
              onClick: async () => {
                if (isConvertingToBooking) return; // Prevent multiple clicks
                
                try {
                  // Create booking from quotation
                  setIsConvertingToBooking(true);
                  const response = await fetch('/api/quotations/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      quotation_id: quotation.id
                    })
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    
                    // Call the onCreateBooking callback if provided
                    if (onCreateBooking) {
                      onCreateBooking();
                    }
                    
                    // Show success message based on number of bookings created
                    if (result.total_bookings > 1) {
                      toast({
                        title: "Successfully converted to bookings",
                        description: `${result.total_bookings} bookings have been created from this quotation`,
                        variant: "default",
                      });
                    } else {
                      toast({
                        title: "Successfully converted to booking",
                        description: `Booking has been created successfully`,
                        variant: "default",
                      });
                    }
                    
                    // Redirect to the first booking page
                    if (result.booking_ids && result.booking_ids.length > 0) {
                      window.location.href = `/bookings/${result.booking_ids[0]}`;
                    } else {
                      // Fallback: refresh the page to show updated status
                      window.location.reload();
                    }
                  } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to convert quotation');
                  }
                } catch (error) {
                  console.error('Error converting to booking:', error);
                  toast({
                    title: "Failed to convert to booking",
                    description: error instanceof Error ? error.message : "Please try again later",
                    variant: "destructive",
                  });
                } finally {
                  setIsConvertingToBooking(false);
                }
              },
              variant: 'default' as const,
              disabled: isConvertingToBooking,
              icon: isConvertingToBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined
            }
          } : {})
        }
      );
    }

    // Add converted status step if quotation is converted
    if (quotation.status === 'converted') {
      steps.push({
        id: 'converted',
        title: 'Converted to Booking',
        description: 'Quotation has been successfully converted to a booking',
        icon: <CheckCircle className="h-4 w-4" />,
        status: 'completed',
        date: quotation.booking_created_at
      });
    }

    // Remove the convert to booking step if already converted
    if (quotation.status === 'converted') {
      // Filter out the booking step since it's already completed
      return steps.filter(step => step.id !== 'booking');
    }

    return steps;
  };

  const workflowSteps = getWorkflowSteps();

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-900/20 dark:border-green-600';
      case 'current':
        return 'text-blue-600 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-600';
      case 'pending':
        return 'text-gray-400 bg-gray-100 border-gray-300 dark:text-gray-500 dark:bg-gray-900/20 dark:border-gray-600';
      case 'skipped':
        return 'text-gray-300 bg-gray-50 border-gray-200 dark:text-gray-600 dark:bg-gray-900/20 dark:border-gray-700';
      default:
        return 'text-gray-400 bg-gray-100 border-gray-300 dark:text-gray-500 dark:bg-gray-900/20 dark:border-gray-600';
    }
  };

  const getConnectorColor = (currentStatus: WorkflowStep['status'], nextStatus?: WorkflowStep['status']) => {
    if (currentStatus === 'completed') {
      return 'bg-green-400 dark:bg-green-500';
    } else if (currentStatus === 'current') {
      return 'bg-blue-400 dark:bg-blue-500';
    }
    return 'bg-gray-300 dark:bg-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="p-2 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          {t('quotations.workflow.title') || 'Quotation Workflow'}
        </CardTitle>
        <CardDescription>
          {t('quotations.workflow.description') || 'Track the progress of this quotation from draft to completion'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const isLast = index === workflowSteps.length - 1;
            const nextStep = workflowSteps[index + 1];
            
            return (
              <div key={step.id} className="relative">
                {/* Step Content */}
                <div className="flex items-start gap-4">
                  {/* Icon with status indicator */}
                  <div className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    getStepStatusColor(step.status)
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
                              disabled={step.action.disabled}
                            >
                              {step.action.label}
                              {step.action.icon}
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Remove the old action button position */}
                      {/* {step.action && (
                        <div className="ml-3 flex-shrink-0 self-start">
                          <Button
                            size="sm"
                            variant={step.action.variant || 'default'}
                            onClick={step.action.onClick}
                            disabled={step.action.disabled}
                          >
                            {step.action.label}
                          </Button>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {!isLast && (
                  <div className={cn(
                    "absolute left-5 top-10 w-0.5 h-6 transition-colors",
                    getConnectorColor(step.status, nextStep?.status)
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
                quotation.status === 'approved' ? 'text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20' :
                quotation.status === 'rejected' ? 'text-red-600 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20' :
                quotation.status === 'sent' ? 'text-blue-600 border-blue-300 bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:bg-blue-900/20' :
                quotation.status === 'converted' ? 'text-purple-600 border-purple-300 bg-purple-100 dark:text-purple-400 dark:border-purple-600 dark:bg-purple-900/20' :
                quotation.status === 'paid' ? 'text-green-700 border-green-300 bg-green-100 dark:text-green-700 dark:border-green-600 dark:bg-green-900/20' :
                'text-gray-600 border-gray-300 bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-900/20'
              }>
                {t(`quotations.status.${quotation.status}`) || quotation.status}
              </Badge>
            </div>
            
            {quotation.created_at && !['approved', 'rejected', 'converted', 'paid'].includes(quotation.status) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {daysUntilExpiry > 0 ? (
                  <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
                ) : daysUntilExpiry === 0 ? (
                  <span className="text-orange-600 font-medium">Expires today</span>
                ) : (
                  <span className="text-red-600 font-medium">Expired {Math.abs(daysUntilExpiry)} day{Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago</span>
                )}
              </div>
            )}
          </div>
          
          {/* Next Step Indicator */}
          {(() => {
            const currentStep = workflowSteps.find(step => step.status === 'current');
            if (currentStep) {
              const nextStepMap: Record<string, string> = {
                'send': t('quotations.workflow.steps.sendToCustomer'),
                'reminder': t('quotations.workflow.steps.sendReminder'),
                'approve': t('quotations.workflow.steps.waitingForApproval'),
                'payment_link_sent': t('quotations.workflow.steps.waitPayment'),
                'payment_completed': t('quotations.workflow.steps.createBooking'),
                'booking': t('quotations.workflow.steps.createBooking')
              };
              
              const nextStepText = nextStepMap[currentStep.id];
              if (nextStepText) {
                return (
                  <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    {t('quotations.workflow.nextStep', { step: nextStepText })}
                  </div>
                );
              }
            }
            return null;
          })()}
        </div>
      </CardContent>

      {/* Payment Link Dialog */}
      <Dialog open={isPaymentLinkDialogOpen} onOpenChange={setIsPaymentLinkDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Send Payment Link
            </DialogTitle>
            <DialogDescription>
              Send the invoice with payment link to the customer, or skip if using bank transfer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-email">Customer Email</Label>
              <Input
                id="payment-email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
                className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                required
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
            
            <div className="grid grid-cols-2 items-start gap-4">
              <div>
                <Label>Language</Label>
                <Select value={emailLanguage} onValueChange={(value: 'en' | 'ja') => setEmailLanguage(value)}>
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
                <Label htmlFor="custom-payment-name">Payment Link Name (Optional)</Label>
                <Input
                  id="custom-payment-name"
                  type="text"
                  value={customPaymentName}
                  onChange={(e) => setCustomPaymentName(e.target.value)}
                  placeholder="e.g., Vehicle Inspection Service - Premium Package"
                  className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custom name for the payment link. Leave empty to use default.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                📧 What's included in the email:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Complete invoice details and service information</li>
                <li>• Customer information and billing details</li>
                <li>• Service breakdown and pricing</li>
                <li>• Invoice PDF attachment</li>
                <li>• Secure payment link for online payment</li>
                <li>• Payment instructions and terms</li>
                <li>• Company branding and contact information</li>
              </ul>
            </div>



            {paymentLinkSent && (
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  Payment link sent on {paymentLinkSentAt ? new Date(paymentLinkSentAt).toLocaleDateString() : 'recently'}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="payment-link-url">Payment Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="payment-link-url"
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://linksplus.omise.co/..."
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      setProgressOpen(true);
                      setProgressTitle('Generating Payment Link');
                      setProgressLabel('Creating Omise payment link...');
                      setProgressValue(25);
                      
                      const response = await fetch('/api/quotations/generate-omise-payment-link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          quotation_id: quotation.id,
                          regenerate: true,
                          customName: customPaymentName || undefined
                        })
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        setPaymentLink(data.paymentUrl);
                        setProgressValue(100);
                        setProgressLabel('Payment link generated!');
                        toast({
                          title: "Payment Link Generated",
                          description: "New Omise payment link has been created",
                          variant: "default",
                        });
                      } else {
                        throw new Error('Failed to generate payment link');
                      }
                    } catch (error) {
                      console.error('Error generating payment link:', error);
                      toast({
                        title: "Error",
                        description: "Failed to generate payment link",
                        variant: "destructive",
                      });
                    } finally {
                      setTimeout(() => setProgressOpen(false), 1000);
                    }
                  }}
                  className="px-3"
                >
                  Generate
                </Button>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate, or click Generate to create a new Omise payment link
              </p>
              
              {/* Bank Transfer Note */}
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Bank Transfer Option</p>
                    <p>If the customer prefers bank transfer, you can skip sending a payment link and mark this step as complete. The customer will receive bank transfer instructions separately.</p>
                  </div>
                </div>
              </div>
            </div>
            

          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentLinkDialogOpen(false)}>
              Cancel
            </Button>
            
            {/* Skip button for bank transfer */}
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  setProgressOpen(true);
                  setProgressTitle('Skipping Payment Link');
                  setProgressLabel('Marking as payment link sent for bank transfer...');
                  setProgressValue(50);
                  
                  // Update the quotation status to mark payment link as sent (for bank transfer)
                  const updateResponse = await fetch(`/api/quotations/${quotation.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      payment_link_sent_at: new Date().toISOString(),
                      payment_method: 'bank_transfer'
                    })
                  });
                  
                  if (updateResponse.ok) {
                    console.log('Quotation status updated for bank transfer');
                    setPaymentLinkSent(true);
                    setPaymentLinkSentAt(new Date().toISOString());
                    
                    setProgressValue(100);
                    setProgressLabel('Bank transfer payment method selected!');
                    setTimeout(() => setProgressOpen(false), 1000);
                    
                    toast({
                      title: "Bank Transfer Selected",
                      description: "Payment link step skipped for bank transfer method",
                      variant: "default",
                    });
                    
                    setIsPaymentLinkDialogOpen(false);
                    
                    // Refresh the quotation data to update the workflow status
                    if (onRefresh) {
                      onRefresh();
                    }
                  } else {
                    throw new Error('Failed to update quotation status');
                  }
                } catch (error) {
                  console.error('Error skipping payment link:', error);
                  setProgressOpen(false);
                  toast({
                    title: "Error",
                    description: "Failed to skip payment link step",
                    variant: "destructive",
                  });
                }
              }}
              className="mr-2"
            >
              Skip (Bank Transfer)
            </Button>
            
            <Button onClick={handleSendPaymentLink} disabled={isSendingPaymentLink || !emailAddress}>
              {isSendingPaymentLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : paymentLinkSent ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate & Resend
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Send Payment Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <Dialog open={progressOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{progressTitle}</DialogTitle>
            <DialogDescription className="sr-only">Processing</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Progress value={progressValue} className="w-full" />
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark As Paid Dialog */}
      <Dialog open={isMarkAsPaidDialogOpen} onOpenChange={setIsMarkAsPaidDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mark Quotation as Paid</DialogTitle>
            <DialogDescription>
              Mark this quotation as paid and optionally upload a receipt.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                {quotation.receipt_url && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Receipt uploaded</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(quotation.receipt_url, '_blank')}
                      >
                        Download Receipt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkAsPaidDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={isMarkingAsPaid || !paymentAmount || !paymentMethod}>
              {isMarkingAsPaid ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Quotation Dialog */}
      <Dialog open={isSendQuotationDialogOpen} onOpenChange={setIsSendQuotationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Quotation
            </DialogTitle>
            <DialogDescription>
              Send this quotation to the customer via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="send-customer-email">Customer Email</Label>
              <Input
                id="send-customer-email"
                type="email"
                value={quotation?.customer_email || 'No email found'}
                disabled
                className="bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email will be sent to the customer's registered email address
              </p>
            </div>
            
            <div>
              <Label htmlFor="send-bcc-emails">BCC Emails</Label>
              <Input
                id="send-bcc-emails"
                value={sendQuotationBccEmails}
                onChange={(e) => setSendQuotationBccEmails(e.target.value)}
                placeholder="Enter email addresses separated by commas"
                className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: booking@japandriver.com. Add more emails separated by commas.
              </p>
            </div>
            
            <div>
              <Label>Language</Label>
              <Select value={sendQuotationLanguage} onValueChange={(value: 'en' | 'ja') => setSendQuotationLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                📧 What's included in the email:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Complete quotation details and service information</li>
                <li>• Customer information and contact details</li>
                <li>• Service breakdown and pricing</li>
                <li>• Quotation PDF attachment</li>
                <li>• Magic link for customer access</li>
                <li>• Company branding and contact information</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendQuotationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendQuotationWithSettings}
              disabled={isSendingQuotation || !quotation?.customer_email}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSendingQuotation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Quotation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

