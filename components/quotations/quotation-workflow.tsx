"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import LoadingModal from '@/components/ui/loading-modal';
import { useProgressSteps } from '@/lib/hooks/use-progress-steps'
import { QuotationStatusSummary } from './quotation-status-summary'
import { QuotationWorkflowSteps } from './quotation-workflow-steps'
import { PaymentLinkDialog } from './payment-link-dialog'
import { MarkAsPaidDialog } from './mark-as-paid-dialog'
// Removed countdown toast imports - using simple toast instead
import { progressConfigs } from '@/lib/config/progressConfigs';
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
  Info,
  Download
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
  
  // Payment Completion Email State
  const [sendPaymentCompleteEmail, setSendPaymentCompleteEmail] = useState(true);
  const [paymentEmailLanguage, setPaymentEmailLanguage] = useState<'en' | 'ja'>(language as 'en' | 'ja');
  const [paymentEmailBcc, setPaymentEmailBcc] = useState<string>("booking@japandriver.com");
  const [isSendingPaymentEmail, setIsSendingPaymentEmail] = useState(false);
  
  // Receipt information state
  const [receiptInfo, setReceiptInfo] = useState<any>(null);
  
  // Selected step for details panel
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  
  // Update payment amount when quotation changes
  React.useEffect(() => {
    const newAmount = (quotation.total_amount || quotation.amount)?.toString() || "0.00";
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
    const emailToSend = emailAddress || quotation?.customer_email;
    if (!emailToSend) {
      toast({
        title: "Error",
        description: "Please enter a customer email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingQuotation(true);
    
    try {
      // Use the new unified email system
      const formData = new FormData();
      formData.append('email', emailToSend!);
      formData.append('quotation_id', quotation.id);
      formData.append('language', sendQuotationLanguage);
      formData.append('bcc_emails', sendQuotationBccEmails);

      const responsePromise = fetch('/api/quotations/send-email-unified', {
        method: 'POST',
        body: formData,
      });
      
      // Start progress modal and animation BEFORE API call
      setProgressOpen(true);
      setProgressVariant('email');
      setProgressTitle('Sending Quotation');
      
      // Start progress simulation with API promise - this will sync the animation with the API
      const progressPromise = startProgress(progressConfigs.sendEmail, responsePromise);
      
      // Wait for both progress animation and API call to complete
      const [response] = await Promise.all([responsePromise, progressPromise]);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send quotation email');
      }

      // Close dialogs and show success
      setProgressOpen(false);
      setIsSendQuotationDialogOpen(false);
      
      // Always show success toast, never show countdown toast
      toast({
        title: "Quotation Sent",
        description: "Quotation has been sent successfully",
        variant: "default",
      });
      
      // Refresh the page to show updated status
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Error sending quotation:', error);
      setProgressOpen(false);
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
  const [progressTitle, setProgressTitle] = useState('Processing');
  const [progressVariant, setProgressVariant] = useState<'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice'>('default');
  const { progressValue, progressLabel, progressSteps, startProgress, resetProgress } = useProgressSteps();
  
  // Removed countdown toast - using simple toast instead

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
    setProgressVariant('invoice');
    setProgressTitle('Sending Payment Link');
    
    try {
      
      // Start progress simulation
      const progressPromise = startProgress(progressConfigs.sendPaymentLink);
      
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

      const pdfBlob = await pdfResponse.blob();
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty or invalid');
      }

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

      // Send payment link email via new API endpoint
      const emailResponse = await fetch('/api/quotations/send-payment-link-email', {
        method: 'POST',
        body: formData
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Payment link email API error:', errorData);
        throw new Error(errorData.error || `Failed to send payment link email: ${emailResponse.status} ${emailResponse.statusText}`);
      }

      // Wait for progress to complete
      await progressPromise;
      
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
          // Mark payment link as sent locally
          setPaymentLinkSent(true);
          setPaymentLinkSentAt(new Date().toISOString());
        } else {
          // Failed to update quotation status, but payment link was sent
        }
      } catch (error) {
        // Error updating quotation status
      }
      
      toast({
        title: "Payment Link Sent",
        description: `Payment link has been sent to ${emailAddress}`,
      });
      
      // Close the progress modal and payment link dialog
      setProgressOpen(false);
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
      const response = await fetch('/api/quotations/check-omise-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quotation.id })
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
          
          // Refresh the quotation data
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
    setProgressVariant('approval');
    setProgressTitle('Marking as Paid');

    try {
      // Start progress simulation
      const progressPromise = startProgress(progressConfigs.markAsPaid);
      
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
          toast({
            title: "Receipt Uploaded",
            description: "Receipt has been uploaded successfully",
          });
        }
      }

      // Wait for progress to complete
      await progressPromise;

      // Send payment completion email if requested
      if (sendPaymentCompleteEmail) {
        try {
          setIsSendingPaymentEmail(true);
          setProgressOpen(true);
          setProgressVariant('email');
          setProgressTitle('Sending Payment Completion Email');
          
          // Start progress simulation
          const progressPromise = startProgress({
            steps: [
              { label: 'Preparing email...', value: 50 },
              { label: 'Sending notification...', value: 90 }
            ],
            totalDuration: 1200
          });
          
          const emailResponse = await fetch('/api/quotations/send-payment-complete-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quotation_id: quotation.id,
              email: quotation.customer_email,
              language: paymentEmailLanguage,
              bcc_emails: paymentEmailBcc
            })
          });
          
          // Wait for progress to complete
          await progressPromise;
          
          if (emailResponse.ok) {
            toast({
              title: "Payment Completion Email Sent",
              description: "Customer has been notified of payment completion",
            });
          } else {
            const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Payment completion email failed:', errorData);
            toast({
              title: "Payment Completion Email Failed",
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
          description: "Quotation has been marked as paid successfully",
        });
      }

      setIsMarkAsPaidDialogOpen(false);
      setProgressOpen(false);
      
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

  // Check if reminder should be sent (1 day before expiry) - don't send if quotation is approved
  const shouldSendReminder = daysUntilExpiry !== null && daysUntilExpiry <= 1 && daysUntilExpiry > 0 && !quotation.reminder_sent_at && quotation.status === 'sent' && !quotation.approved_at;

  // Check if reminder step should be shown - don't show if quotation is approved or rejected
  const shouldShowReminder = quotation.status !== 'draft' && quotation.status !== 'approved' && quotation.status !== 'rejected' && !quotation.approved_at && !quotation.rejected_at && (shouldSendReminder || quotation.reminder_sent_at);

  // Define workflow steps based on quotation status and data
  const getWorkflowSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [
      {
        id: 'draft',
        title: t('workflowSteps.created'),
        description: t('quotations.workflow.draft.description'),
        icon: <FileText className="h-4 w-4" />,
        status: 'completed',
        date: quotation.created_at
      },
      {
        id: 'send',
        title: t('workflowSteps.sent'),
        description: t('quotations.workflow.send.description'),
        icon: <Send className="h-4 w-4" />,
        status: quotation.status === 'draft' ? 'current' : 
                (quotation.last_sent_at || ['sent', 'approved', 'rejected', 'paid', 'converted'].includes(quotation.status)) ? 'completed' : 'pending',
        date: quotation.last_sent_at || (['sent', 'approved', 'rejected', 'paid', 'converted'].includes(quotation.status) ? quotation.created_at : undefined),
        ...(quotation.status === 'draft' && isOrganizationMember ? {
          action: {
            label: t('quotations.actions.send'),
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
        ? t('workflowSteps.rejected')
        : t('workflowSteps.approval'),
      description: quotation.status === 'rejected'
        ? (t('quotations.workflow.rejected.description') || 'Quotation was rejected by customer')
        : t('quotations.workflow.approve.description'),
      icon: quotation.status === 'rejected' 
        ? <AlertTriangle className="h-4 w-4" />
        : <CheckCircle className="h-4 w-4" />,
      status: (quotation.status === 'approved' || quotation.approved_at) ? 'completed' :
              (quotation.status === 'rejected' || quotation.rejected_at) ? 'completed' :
              (quotation.status === 'paid' || quotation.payment_completed_at) ? 'completed' :
              ['sent'].includes(quotation.status) ? 'current' : 'pending',
      date: quotation.approved_at || quotation.rejected_at
    });

    // Always add post-approval steps - show them with appropriate status based on quotation state
    steps.push(
      {
        id: 'payment_link_sent',
        title: t('workflowSteps.payment'),
        description: t('workflowSteps.paymentDescription'),
        icon: <Mail className="h-4 w-4" />,
        status: quotation.payment_completed_at ? 'completed' : 
                quotation.payment_link_sent_at ? 'completed' : 
                (quotation.status === 'paid' || quotation.payment_completed_at) ? 'completed' :
                (quotation.status === 'approved' || quotation.approved_at) ? 'current' : 'pending',
        date: quotation.payment_link_sent_at,
        ...((quotation.status === 'approved' || quotation.status === 'paid' || quotation.approved_at) && !quotation.payment_link_sent_at && !quotation.payment_completed_at && isOrganizationMember ? {
          action: {
            label: t('quotations.workflow.actions.sendPaymentLink'),
            onClick: () => setIsPaymentLinkDialogOpen(true),
            variant: 'default' as const
          }
        } : {})
      },
      {
        id: 'paid',
        title: t('workflowSteps.confirmed'),
        description: t('workflowSteps.confirmedDescription'),
        icon: <CheckCircle className="h-4 w-4" />,
        status: (quotation.status === 'paid' || quotation.payment_completed_at) ? 'completed' : 
                (quotation.payment_link_sent_at || quotation.status === 'sent' || quotation.status === 'approved' || quotation.approved_at) ? 'current' : 'pending',
        date: quotation.payment_completed_at,
        ...((quotation.payment_link_sent_at || quotation.status === 'sent' || quotation.status === 'approved' || quotation.approved_at) && quotation.status !== 'paid' && !quotation.payment_completed_at && isOrganizationMember ? {
          action: {
            label: t('quotations.actions.markAsPaid'),
            onClick: () => setIsMarkAsPaidDialogOpen(true),
            variant: 'default' as const
          }
        } : {})
      },
      {
        id: 'booking',
        title: t('workflowSteps.converted'),
        description: t('workflowSteps.convertedDescription'),
        icon: <Calendar className="h-4 w-4" />,
        status: quotation.booking_created_at ? 'completed' :
                (quotation.status === 'paid' || quotation.payment_completed_at) ? 'current' : 'pending',
        date: quotation.booking_created_at,
        ...((quotation.status === 'paid' || quotation.payment_completed_at) && !quotation.booking_created_at && isOrganizationMember ? {
          action: {
            label: isConvertingToBooking ? t('quotations.workflow.actions.converting') : t('quotations.workflow.actions.createBooking'),
            onClick: async () => {
              if (isConvertingToBooking) return; // Prevent multiple clicks
              
              try {
                // Create booking from quotation
                setIsConvertingToBooking(true);
                setProgressOpen(true);
                setProgressVariant('approval');
                setProgressTitle('Converting to Booking');
                
                // Start progress simulation
                const progressPromise = startProgress(progressConfigs.convertToBooking);
                
                const response = await fetch('/api/quotations/convert', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    quotation_id: quotation.id
                  })
                });
                
                // Wait for progress to complete
                await progressPromise;
                
                if (response.ok) {
                  const result = await response.json();
                  
                  // Call the onCreateBooking callback if provided
                  if (onCreateBooking) {
                    onCreateBooking();
                  }
                  
                  // Show success message based on number of bookings created
                  if (result.total_bookings > 1) {
                    toast({
                      title: t('quotationDetails.successfullyConvertedToBookings'),
                      description: t('quotationDetails.bookingsCreatedFromQuotation', { count: result.total_bookings }),
                      variant: "default",
                    });
                  } else {
                    toast({
                      title: t('quotationDetails.successfullyConvertedToBooking'),
                      description: t('quotationDetails.bookingCreatedSuccessfully'),
                      variant: "default",
                    });
                  }
                  
                  // Redirect to the first booking page using beautiful URL
                  if (result.booking_wp_ids && result.booking_wp_ids.length > 0) {
                    window.location.href = `/bookings/${result.booking_wp_ids[0]}`;
                  } else if (result.booking_ids && result.booking_ids.length > 0) {
                    // Fallback to UUID if wp_id not available
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
                  title: t('quotationDetails.failedToConvertToBooking'),
                  description: error instanceof Error ? error.message : t('quotationDetails.pleaseTryAgainLater'),
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

    // Add converted status step if quotation is converted
    if (quotation.status === 'converted') {
      steps.push({
        id: 'converted',
        title: t('workflowSteps.converted'),
        description: t('workflowSteps.convertedStatusDescription'),
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
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 mr-3 text-primary" />
          <div>
            <CardTitle className="text-xl font-semibold">
              {t('quotations.workflow.title') || 'Quotation Workflow'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t('quotations.workflow.description') || 'Track the progress of this quotation through each stage'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <QuotationWorkflowSteps 
          workflowSteps={workflowSteps}
          selectedStep={selectedStep}
          setSelectedStep={setSelectedStep}
          getStepStatusColor={getStepStatusColor}
        />

        {/* Details Panel with Animation */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          selectedStep ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          {selectedStep && (() => {
            const step = workflowSteps.find(s => s.id === selectedStep);
            if (!step) return null;
            
            return (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border transform transition-all duration-300 ease-in-out animate-in slide-in-from-top-2 fade-in-0">
                <div className="space-y-2">
                  <h4 className={cn(
                    "font-semibold transition-colors duration-200",
                    step.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  )}>
                    {step.status === 'completed' ? '✓' : '⏳'} {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground transition-colors duration-200">
                    {step.status === 'completed' && step.date 
                      ? `${step.description} on ${format(parseISO(step.date), 'MMM dd, yyyy \'at\' h:mm:ss a')}`
                      : step.status === 'current'
                      ? step.description
                      : t('quotationDetails.notYet', { title: step.title })
                    }
                  </p>
                  {step.status === 'current' && step.action && (
                    <div className="mt-3 transform transition-all duration-200 ease-in-out animate-in slide-in-from-bottom-1 fade-in-0 delay-100">
                      <Button
                        onClick={step.action.onClick}
                        disabled={step.action.disabled}
                        className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {step.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <QuotationStatusSummary 
          quotation={quotation}
          workflowSteps={workflowSteps}
          daysUntilExpiry={daysUntilExpiry}
        />
      </CardContent>

      {/* Payment Link Dialog */}
      <Dialog open={isPaymentLinkDialogOpen} onOpenChange={setIsPaymentLinkDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('quotationWorkflow.sendPaymentLinkTitle')}
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
            
            <div>
              <Label htmlFor="custom-payment-name">Payment Link Name (Optional)</Label>
              <Input
                id="custom-payment-name"
                type="text"
                value={customPaymentName}
                onChange={(e) => setCustomPaymentName(e.target.value)}
                placeholder="e.g., Vehicle Inspection Service - Premium Package"
                className="w-full bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Custom name for the payment link. Leave empty to use default.
              </p>
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
                      setProgressVariant('default');
                      setProgressTitle('Generating Payment Link');
                      
                      // Start progress simulation
                      const progressPromise = startProgress({
                        steps: [
                          { label: 'Creating Omise payment link...', value: 50 },
                          { label: 'Finalizing...', value: 90 }
                        ],
                        totalDuration: 1500
                      });
                      
                      const response = await fetch('/api/quotations/generate-omise-payment-link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          quotation_id: quotation.id,
                          regenerate: true,
                          customName: customPaymentName || undefined
                        })
                      });
                      
                      // Wait for progress to complete
                      await progressPromise;
                      
                      if (response.ok) {
                        const data = await response.json();
                        setPaymentLink(data.paymentUrl);
                        toast({
                          title: "Payment Link Generated",
                          description: "New Omise payment link has been created",
                          variant: "default",
                        });
                        
                        // Close the progress modal after successful generation
                        setTimeout(() => {
                          setProgressOpen(false);
                        }, 500);
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
                      
                      // Close the progress modal on error
                      setTimeout(() => {
                        setProgressOpen(false);
                      }, 1000);
                    }
                  }}
                  className="px-3"
                >
                  Generate
                </Button>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Click Generate to create a new Omise payment link
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
              {t('quotationWorkflow.cancel')}
            </Button>
            
            {/* Skip button for bank transfer */}
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  setProgressOpen(true);
                  setProgressVariant('default');
                  setProgressTitle('Skipping Payment Link');
                  
                  // Start progress simulation
                  const progressPromise = startProgress({
                    steps: [
                      { label: 'Updating payment method...', value: 50 },
                      { label: 'Finalizing...', value: 90 }
                    ],
                    totalDuration: 1000
                  });
                  
                  // Update the quotation status to mark payment link as sent (for bank transfer)
                  const updateResponse = await fetch(`/api/quotations/${quotation.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      payment_link_sent_at: new Date().toISOString(),
                      payment_method: 'bank_transfer'
                    })
                  });
                  
                  // Wait for progress to complete
                  await progressPromise;
                  
                  if (updateResponse.ok) {
                    setPaymentLinkSent(true);
                    setPaymentLinkSentAt(new Date().toISOString());
                    
                    toast({
                      title: "Bank Transfer Selected",
                      description: "Payment link step skipped for bank transfer method",
                      variant: "default",
                    });
                    
                    setIsPaymentLinkDialogOpen(false);
                    setProgressOpen(false);
                    
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
{t('quotationWorkflow.sending')}
                </>
              ) : paymentLinkSent ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate & Resend
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
{t('quotationWorkflow.sendPaymentLink')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <LoadingModal
        open={progressOpen}
        onOpenChange={setProgressOpen}
        title={progressTitle}
        variant={progressVariant}
        value={progressValue}
        label={progressLabel}
        steps={progressSteps}
        showSteps={true}
      />

      {/* Countdown Toast removed - using simple toast instead */}

      <MarkAsPaidDialog
        isOpen={isMarkAsPaidDialogOpen}
        onOpenChange={setIsMarkAsPaidDialogOpen}
        quotation={quotation}
        paymentDate={paymentDate}
        setPaymentDate={setPaymentDate}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        receiptFile={receiptFile}
        setReceiptFile={setReceiptFile}
        sendPaymentCompleteEmail={sendPaymentCompleteEmail}
        setSendPaymentCompleteEmail={setSendPaymentCompleteEmail}
        paymentEmailLanguage={paymentEmailLanguage}
        setPaymentEmailLanguage={setPaymentEmailLanguage}
        paymentEmailBcc={paymentEmailBcc}
        setPaymentEmailBcc={setPaymentEmailBcc}
        isMarkingAsPaid={isMarkingAsPaid}
        isCheckingPayment={isCheckingPayment}
        receiptInfo={receiptInfo}
        setReceiptInfo={setReceiptInfo}
        onMarkAsPaid={handleMarkAsPaid}
        onCheckPaymentStatus={handleCheckPaymentStatus}
      />

      {/* Send Quotation Dialog */}
      <Dialog open={isSendQuotationDialogOpen} onOpenChange={setIsSendQuotationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {t('quotationWorkflow.sendQuotationTitle')}
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
                value={quotation?.customer_email || ''}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
                className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
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
              {t('quotationWorkflow.cancel')}
            </Button>
            <Button 
              onClick={handleSendQuotationWithSettings}
              disabled={isSendingQuotation || !emailAddress}
              className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
            >
              {isSendingQuotation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
{t('quotationWorkflow.sending')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
{t('quotationWorkflow.sendQuotation')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

