import { ProgressConfig } from '@/lib/hooks/useProgressSteps';

export const progressConfigs: Record<string, ProgressConfig> = {
  approval: {
    steps: [
      { label: 'Validating quotation', value: 20 },
      { label: 'Updating status', value: 40 },
      { label: 'Generating invoice', value: 60 },
      { label: 'Sending email', value: 80 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 2500,
    stepDelays: [400, 500, 600, 500, 300] // More time for invoice generation
  },
  
  rejection: {
    steps: [
      { label: 'Validating quotation', value: 25 },
      { label: 'Updating status', value: 50 },
      { label: 'Sending notification', value: 75 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 2000,
    stepDelays: [400, 500, 400, 300]
  },
  
  sendEmail: {
    steps: [
      { label: 'Preparing email data', value: 10 },
      { label: 'Generating PDF', value: 35 },
      { label: 'Sending email', value: 70 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 3000, // Restored original duration
    stepDelays: [100, 800, 600, 300] // Restored original timing
  },
  
  sendReminder: {
    steps: [
      { label: 'Preparing reminder', value: 30 },
      { label: 'Sending email', value: 70 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1500,
    stepDelays: [400, 500, 300]
  },
  
  sendPaymentLink: {
    steps: [
      { label: 'Generating payment link', value: 40 },
      { label: 'Sending email', value: 80 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1800,
    stepDelays: [500, 400, 300]
  },
  
  markAsPaid: {
    steps: [
      { label: 'Updating payment status', value: 50 },
      { label: 'Sending confirmation', value: 80 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1600,
    stepDelays: [400, 400, 300]
  },
  
  convertToBooking: {
    steps: [
      { label: 'Validating data', value: 25 },
      { label: 'Creating booking', value: 50 },
      { label: 'Sending confirmation', value: 80 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 2000,
    stepDelays: [400, 500, 400, 300]
  },
  
  saveDraft: {
    steps: [
      { label: 'Validating data', value: 20 },
      { label: 'Saving quotation', value: 60 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1500,
    stepDelays: [200, 400, 300]
  },
  
  updateDraft: {
    steps: [
      { label: 'Validating data', value: 15 },
      { label: 'Updating quotation', value: 50 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1200,
    stepDelays: [150, 350, 250]
  },
  
  invoice: {
    steps: [
      { label: 'Preparing invoice data', value: 15 },
      { label: 'Generating PDF', value: 45 },
      { label: 'Sending email', value: 75 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 4000, // Longer duration for PDF generation
    stepDelays: [200, 1200, 800, 400] // More time for PDF generation step
  }
} as const;

export type ProgressConfigType = keyof typeof progressConfigs;
