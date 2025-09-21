import { ProgressConfig } from '@/lib/hooks/useProgressSteps';

export const progressConfigs: Record<string, ProgressConfig> = {
  approval: {
    steps: [
      { label: 'Validating quotation', value: 0 },
      { label: 'Updating status', value: 25 },
      { label: 'Generating invoice', value: 50 },
      { label: 'Sending email', value: 75 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 2500,
    stepDelays: [400, 500, 600, 500, 300] // More time for invoice generation
  },
  
  rejection: {
    steps: [
      { label: 'Validating quotation', value: 0 },
      { label: 'Updating status', value: 30 },
      { label: 'Sending notification', value: 60 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 2000,
    stepDelays: [400, 500, 400, 300]
  },
  
  sendEmail: {
    steps: [
      { label: 'Preparing email data', value: 0 },
      { label: 'Generating PDF', value: 25 },
      { label: 'Sending email', value: 60 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 15000, // More realistic duration for actual API timing
    stepDelays: [1000, 3000, 2000, 1000] // More realistic timing based on actual API performance
  },
  
  sendReminder: {
    steps: [
      { label: 'Preparing reminder', value: 0 },
      { label: 'Sending email', value: 50 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1500,
    stepDelays: [400, 500, 300]
  },
  
  sendPaymentLink: {
    steps: [
      { label: 'Generating payment link', value: 0 },
      { label: 'Sending email', value: 50 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1800,
    stepDelays: [500, 400, 300]
  },
  
  markAsPaid: {
    steps: [
      { label: 'Updating payment status', value: 0 },
      { label: 'Sending confirmation', value: 50 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1600,
    stepDelays: [400, 400, 300]
  },
  
  convertToBooking: {
    steps: [
      { label: 'Validating data', value: 0 },
      { label: 'Creating booking', value: 30 },
      { label: 'Sending confirmation', value: 60 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 2000,
    stepDelays: [400, 500, 400, 300]
  },
  
  saveDraft: {
    steps: [
      { label: 'Validating data', value: 0 },
      { label: 'Saving quotation', value: 50 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 1000, // Faster duration
    stepDelays: [100, 300, 200] // Faster timing
  },
  
  updateDraft: {
    steps: [
      { label: 'Validating data', value: 0 },
      { label: 'Updating quotation', value: 50 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 800, // Faster duration
    stepDelays: [80, 250, 150] // Faster timing
  },
  
  invoice: {
    steps: [
      { label: 'Preparing invoice data', value: 0 },
      { label: 'Generating PDF', value: 30 },
      { label: 'Sending email', value: 60 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 4000, // Longer duration for PDF generation
    stepDelays: [200, 1200, 800, 400] // More time for PDF generation step
  }
} as const;

export type ProgressConfigType = keyof typeof progressConfigs;
