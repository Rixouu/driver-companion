"use client"

import React from 'react'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Quotation {
  status: string
  created_at: string
  rejected_at?: string
  approved_at?: string
  payment_completed_at?: string
}

interface WorkflowStep {
  id: string
  status: 'completed' | 'current' | 'pending' | 'skipped'
}

interface QuotationStatusSummaryProps {
  quotation: Quotation
  workflowSteps: WorkflowStep[]
  daysUntilExpiry: number
}

export function QuotationStatusSummary({ 
  quotation, 
  workflowSteps, 
  daysUntilExpiry 
}: QuotationStatusSummaryProps) {
  const { t } = useI18n()

  return (
    <>
      {/* Summary Status */}
      <Separator className="my-4" />
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t('quotations.workflow.status')}</span>
             <StatusBadge
               status={quotation.status}
               rejectedAt={quotation.rejected_at}
               approvedAt={quotation.approved_at}
               paymentCompletedAt={quotation.payment_completed_at}
               createdAt={quotation.created_at}
             />
          </div>
          
          {quotation.created_at && !['approved', 'rejected', 'converted', 'paid'].includes(quotation.status) && !quotation.approved_at && !quotation.rejected_at && (
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              {daysUntilExpiry > 0 ? (
                <span className="text-red-600 font-medium">
                  {daysUntilExpiry === 1 
                    ? t('quotationDetails.expiresTomorrowSendReminderNow')
                    : t('quotationDetails.expiresInDaysConsiderSendingReminder', { days: daysUntilExpiry })
                  }
                </span>
              ) : daysUntilExpiry === 0 ? (
                <span className="text-orange-600 font-medium">{t('quotationDetails.expiresTodaySendReminderImmediately')}</span>
              ) : (
                <span className="text-red-600 font-medium">{t('quotationDetails.expiredDaysAgo', { days: Math.abs(daysUntilExpiry) })}</span>
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
    </>
  )
}
