"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { useProgressSteps } from "@/lib/hooks/use-progress-steps"
import { progressConfigs } from "@/lib/config/progressConfigs"

interface Quotation {
  id: string
  customer_email?: string
}

interface UseQuotationActionsProps {
  quotation: Quotation
  onRefresh?: () => void
}

export function useQuotationActions({ quotation, onRefresh }: UseQuotationActionsProps) {
  const [isSendingQuotation, setIsSendingQuotation] = useState(false)
  const [isSendingPaymentLink, setIsSendingPaymentLink] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false)
  
  const { startProgress } = useProgressSteps()

  const handleSendQuotationWithSettings = async (
    emailAddress: string,
    sendQuotationLanguage: string,
    sendQuotationBccEmails: string,
    setProgressOpen: (open: boolean) => void,
    setProgressVariant: (variant: 'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice') => void,
    setProgressTitle: (title: string) => void,
    setIsSendQuotationDialogOpen: (open: boolean) => void
  ) => {
    const emailToSend = emailAddress || quotation?.customer_email
    if (!emailToSend) {
      toast({
        title: "Error",
        description: "Please enter a customer email address",
        variant: "destructive",
      })
      return
    }

    setIsSendingQuotation(true)
    
    try {
      // Use the new unified email system
      const formData = new FormData()
      formData.append('email', emailToSend!)
      formData.append('quotation_id', quotation.id)
      formData.append('language', sendQuotationLanguage)
      formData.append('bcc_emails', sendQuotationBccEmails)

      const responsePromise = fetch('/api/quotations/send-email-unified', {
        method: 'POST',
        body: formData,
      })
      
      // Start progress modal and animation BEFORE API call
      setProgressOpen(true)
      setProgressVariant('email')
      setProgressTitle('Sending Quotation')
      
      // Start progress simulation with API promise - this will sync the animation with the API
      const progressPromise = startProgress(progressConfigs.sendEmail, responsePromise)
      
      // Wait for both progress animation and API call to complete
      const [response] = await Promise.all([responsePromise, progressPromise])

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send quotation email')
      }

      // Close dialogs and show success
      setProgressOpen(false)
      setIsSendQuotationDialogOpen(false)
      
      // Always show success toast, never show countdown toast
      toast({
        title: "Quotation Sent",
        description: "Quotation has been sent successfully",
        variant: "default",
      })
      
      // Refresh the page to show updated status
      if (onRefresh) {
        onRefresh()
      }
      
    } catch (error) {
      console.error('Error sending quotation:', error)
      setProgressOpen(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send quotation",
        variant: "destructive",
      })
    } finally {
      setIsSendingQuotation(false)
    }
  }

  const handleSendPaymentLink = async (
    emailAddress: string,
    paymentLink: string,
    setPaymentLink: (link: string) => void,
    setProgressOpen: (open: boolean) => void,
    setProgressVariant: (variant: 'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice') => void,
    setProgressTitle: (title: string) => void,
    setIsPaymentLinkDialogOpen: (open: boolean) => void
  ) => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    // If no payment link provided, we'll generate one via the API
    if (!paymentLink || !paymentLink.includes('http')) {
      // Set a placeholder for now - the API will generate the actual link
      setPaymentLink('https://placeholder.com/generate-payment-link')
    }

    setIsSendingPaymentLink(true)
    
    try {
      const formData = new FormData()
      formData.append('email', emailAddress)
      formData.append('quotation_id', quotation.id)

      const responsePromise = fetch('/api/quotations/send-payment-link-email', {
        method: 'POST',
        body: formData,
      })
      
      // Start progress modal and animation
      setProgressOpen(true)
      setProgressVariant('email')
      setProgressTitle('Sending Payment Link')
      
      const progressPromise = startProgress(progressConfigs.sendEmail, responsePromise)
      const [response] = await Promise.all([responsePromise, progressPromise])

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send payment link')
      }

      setProgressOpen(false)
      setIsPaymentLinkDialogOpen(false)
      
      toast({
        title: "Payment Link Sent",
        description: "Payment link has been sent successfully",
        variant: "default",
      })
      
      if (onRefresh) {
        onRefresh()
      }
      
    } catch (error) {
      console.error('Error sending payment link:', error)
      setProgressOpen(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send payment link",
        variant: "destructive",
      })
    } finally {
      setIsSendingPaymentLink(false)
    }
  }

  const handleCheckPaymentStatus = async (
    setProgressOpen: (open: boolean) => void,
    setProgressVariant: (variant: 'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice') => void,
    setProgressTitle: (title: string) => void
  ) => {
    setIsCheckingPayment(true)
    
    try {
      const responsePromise = fetch(`/api/quotations/check-omise-payment?quotation_id=${quotation.id}`, {
        method: 'GET',
      })
      
      setProgressOpen(true)
      setProgressVariant('default')
      setProgressTitle('Checking Payment Status')
      
      const progressPromise = startProgress(progressConfigs.default, responsePromise)
      const [response] = await Promise.all([responsePromise, progressPromise])

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check payment status')
      }

      const result = await response.json()
      setProgressOpen(false)
      
      if (result.paid) {
        toast({
          title: "Payment Confirmed",
          description: "Payment has been confirmed and processed",
          variant: "default",
        })
        
        if (onRefresh) {
          onRefresh()
        }
      } else {
        toast({
          title: "Payment Pending",
          description: "No payment has been received yet",
          variant: "default",
        })
      }
      
    } catch (error) {
      console.error('Error checking payment status:', error)
      setProgressOpen(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check payment status",
        variant: "destructive",
      })
    } finally {
      setIsCheckingPayment(false)
    }
  }

  const handleMarkAsPaid = async (
    setProgressOpen: (open: boolean) => void,
    setProgressVariant: (variant: 'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice') => void,
    setProgressTitle: (title: string) => void
  ) => {
    setIsMarkingAsPaid(true)
    
    try {
      const responsePromise = fetch('/api/quotations/mark-as-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation.id,
        }),
      })
      
      setProgressOpen(true)
      setProgressVariant('default')
      setProgressTitle('Marking as Paid')
      
      const progressPromise = startProgress(progressConfigs.default, responsePromise)
      const [response] = await Promise.all([responsePromise, progressPromise])

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark as paid')
      }

      setProgressOpen(false)
      
      toast({
        title: "Marked as Paid",
        description: "Quotation has been marked as paid",
        variant: "default",
      })
      
      if (onRefresh) {
        onRefresh()
      }
      
    } catch (error) {
      console.error('Error marking as paid:', error)
      setProgressOpen(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as paid",
        variant: "destructive",
      })
    } finally {
      setIsMarkingAsPaid(false)
    }
  }

  return {
    isSendingQuotation,
    isSendingPaymentLink,
    isCheckingPayment,
    isMarkingAsPaid,
    handleSendQuotationWithSettings,
    handleSendPaymentLink,
    handleCheckPaymentStatus,
    handleMarkAsPaid
  }
}
