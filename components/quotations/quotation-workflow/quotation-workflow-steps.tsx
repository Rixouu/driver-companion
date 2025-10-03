"use client"

import React from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface WorkflowStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'pending' | 'skipped'
  date?: string
  action?: {
    label: string
    onClick: () => void
    disabled?: boolean
  }
}

interface QuotationWorkflowStepsProps {
  workflowSteps: WorkflowStep[]
  selectedStep: string | null
  setSelectedStep: (stepId: string | null) => void
  getStepStatusColor: (status: string) => string
}

export function QuotationWorkflowSteps({ 
  workflowSteps, 
  selectedStep, 
  setSelectedStep, 
  getStepStatusColor 
}: QuotationWorkflowStepsProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-2">
      {workflowSteps.map((step, index) => {
        const isLast = index === workflowSteps.length - 1;
        
        return (
          <div key={step.id} className="relative flex-1">
            {/* Step Content */}
            <div 
              className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-all duration-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
            >
              {/* Icon with status indicator */}
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 flex-shrink-0",
                getStepStatusColor(step.status),
                selectedStep === step.id ? "ring-2 ring-blue-500/20 scale-105" : "hover:scale-105"
              )}>
                {step.icon}
                {step.status === 'completed' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              
              {/* Step Details */}
              <div className="flex-1 min-w-0 transition-all duration-200">
                <h4 className={cn(
                  "font-medium text-sm mb-1 transition-colors duration-200",
                  step.status === 'completed' ? 'text-green-700 dark:text-green-300' :
                  step.status === 'current' ? 'text-blue-700 dark:text-blue-300' :
                  'text-gray-500 dark:text-gray-400'
                )}>
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground transition-colors duration-200">
                  {t('quotations.workflow.clickForDetails')}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )
}
