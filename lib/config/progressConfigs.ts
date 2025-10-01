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
    totalDuration: 3000, // Reduced from 5000ms - more realistic for optimized PDF generation
    stepDelays: [400, 800, 1000, 300] // Faster timing based on browser singleton optimization
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
      { label: 'Generating invoice PDF', value: 25 },
      { label: 'Sending email', value: 60 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 15000, // Based on actual API testing: ~14.3 seconds
    stepDelays: [2000, 4000, 6000, 3000] // Realistic timing for payment link + PDF + email
  },
  
  markAsPaid: {
    steps: [
      { label: 'Updating payment status', value: 0 },
      { label: 'Generating confirmation PDF', value: 25 },
      { label: 'Sending confirmation email', value: 60 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 18000, // Based on actual API testing: ~17.2 seconds
    stepDelays: [2000, 6000, 8000, 2000] // Realistic timing for status update + PDF + email
  },
  
  convertToBooking: {
    steps: [
      { label: 'Validating data', value: 0 },
      { label: 'Creating booking', value: 25 },
      { label: 'Assigning vehicle', value: 50 },
      { label: 'Sending confirmation', value: 75 },
      { label: 'Finalizing', value: 90 }
    ],
    totalDuration: 10000, // Based on actual API testing: ~9.9 seconds
    stepDelays: [1000, 2000, 3000, 2500, 1500] // Realistic timing for conversion process
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
