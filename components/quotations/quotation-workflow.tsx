"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  ExternalLink
} from 'lucide-react';
import { format, parseISO, addDays, differenceInDays, isAfter } from 'date-fns';
import { QuotationStatus } from '@/types/quotations';

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
    booking_created_at?: string;
  };
  onSendQuotation?: () => void;
  onSendReminder?: () => void;
  onGenerateInvoice?: () => void;
  onSendPaymentLink?: () => void;
  onCreateBooking?: () => void;
  isOrganizationMember?: boolean;
}

export function QuotationWorkflow({ 
  quotation, 
  onSendQuotation,
  onSendReminder,
  onGenerateInvoice,
  onSendPaymentLink,
  onCreateBooking,
  isOrganizationMember = false 
}: QuotationWorkflowProps) {
  const { t } = useI18n();

  // Calculate expiry status properly - quotation is valid for 2 days from creation (same logic as quotation info card)
  const now = new Date();
  const createdDate = new Date(quotation.created_at);
  // Calculate proper expiry date: 3 days from creation (so it expires in 2 days)
  const properExpiryDate = addDays(createdDate, 3);
  const daysUntilExpiry = differenceInDays(properExpiryDate, now);
  const isExpired = isAfter(now, properExpiryDate);

  // Check if reminder should be sent (2 days before expiry)
  const shouldSendReminder = daysUntilExpiry !== null && daysUntilExpiry <= 2 && daysUntilExpiry > 0 && !quotation.reminder_sent_at && quotation.status === 'sent';

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
        status: quotation.status === 'draft' ? 'current' : 'completed',
        date: quotation.last_sent_at,
        ...(quotation.status === 'draft' && isOrganizationMember ? {
          action: {
            label: 'Send Now',
            onClick: onSendQuotation || (() => {}),
            disabled: !onSendQuotation
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
      status: quotation.status === 'approved' ? 'completed' :
              quotation.status === 'rejected' ? 'completed' :
              ['sent'].includes(quotation.status) ? 'current' : 'pending',
      date: quotation.approved_at || quotation.rejected_at
    });

    // Add post-approval steps only if quotation is approved
    if (quotation.status === 'approved' || quotation.invoice_generated_at || quotation.payment_completed_at || quotation.booking_created_at) {
      steps.push(
        {
          id: 'invoice',
          title: t('quotations.workflow.invoice.title'),
          description: t('quotations.workflow.invoice.description'),
          icon: <Receipt className="h-4 w-4" />,
          status: quotation.invoice_generated_at ? 'completed' : 
                  quotation.status === 'approved' ? 'current' : 'pending',
          date: quotation.invoice_generated_at,
          ...(quotation.status === 'approved' && !quotation.invoice_generated_at && isOrganizationMember ? {
            action: {
              label: t('quotations.workflow.actions.generateInvoice'),
              onClick: async () => {
                try {
                  const response = await fetch('/api/quotations/generate-invoice-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      quotation_id: quotation.id,
                      language: 'en'
                    })
                  });

                  if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                  }

                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `INV-JPDR-${String(quotation.id).padStart(6, '0')}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  // Call the onGenerateInvoice callback if provided
                  if (onGenerateInvoice) {
                    onGenerateInvoice();
                  }
                } catch (error) {
                  console.error('Error generating invoice:', error);
                  // You can add toast notification here if needed
                }
              },
              variant: 'default' as const,
              disabled: false
            }
          } : {})
        },
        {
          id: 'payment',
          title: t('quotations.workflow.payment.title'),
          description: t('quotations.workflow.payment.description'),
          icon: <CreditCard className="h-4 w-4" />,
          status: quotation.payment_completed_at ? 'completed' :
                  quotation.invoice_generated_at ? 'current' : 'pending',
          date: quotation.payment_completed_at,
          ...(quotation.invoice_generated_at && !quotation.payment_completed_at && isOrganizationMember ? {
            action: {
              label: t('quotations.workflow.actions.sendPaymentLink'),
              onClick: onSendPaymentLink || (() => {}),
              variant: 'outline' as const,
              disabled: !onSendPaymentLink
            }
          } : {})
        },
        {
          id: 'booking',
          title: t('quotations.workflow.booking.title'),
          description: t('quotations.workflow.booking.description'),
          icon: <Calendar className="h-4 w-4" />,
          status: quotation.booking_created_at ? 'completed' :
                  quotation.payment_completed_at ? 'current' : 'pending',
          date: quotation.booking_created_at,
          ...(quotation.payment_completed_at && !quotation.booking_created_at && isOrganizationMember ? {
            action: {
              label: t('quotations.workflow.actions.createBooking'),
              onClick: onCreateBooking || (() => {}),
              disabled: !onCreateBooking
            }
          } : {})
        }
      );
    }

    return steps;
  };

  const workflowSteps = getWorkflowSteps();

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'current':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-gray-400 bg-gray-50 border-gray-200';
      case 'skipped':
        return 'text-gray-300 bg-gray-25 border-gray-100';
      default:
        return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getConnectorColor = (currentStatus: WorkflowStep['status'], nextStatus?: WorkflowStep['status']) => {
    if (currentStatus === 'completed') {
      return 'bg-green-300';
    } else if (currentStatus === 'current') {
      return 'bg-blue-300';
    }
    return 'bg-gray-200';
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
                          step.status === 'completed' ? 'text-green-700' :
                          step.status === 'current' ? 'text-blue-700' :
                          'text-gray-500'
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
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {step.warning}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Button - properly contained */}
                      {step.action && (
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
                      )}
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
              <Badge variant={
                quotation.status === 'approved' ? 'default' :
                quotation.status === 'rejected' ? 'destructive' :
                quotation.status === 'sent' ? 'secondary' :
                'outline'
              }>
                {t(`quotations.status.${quotation.status}`) || quotation.status}
              </Badge>
            </div>
            
            {quotation.created_at && (
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
                'invoice': t('quotations.workflow.steps.generateInvoice'),
                'payment': t('quotations.workflow.steps.sendPaymentLink'),
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
    </Card>
  );
}
