import React from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { ThemeProvider } from '@/components/theme-provider';
import { NextIntlClientProvider } from 'next-intl';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Mock Next.js router
const mockRouter = {
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(),
  back: () => Promise.resolve(true),
  forward: () => Promise.resolve(true),
  refresh: () => Promise.resolve(true),
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  isReady: true,
  isPreview: false,
  isLocaleDomain: false,
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
};

// Mock messages for i18n
const mockMessages = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
  },
  vehicles: {
    title: 'Vehicles',
    addVehicle: 'Add Vehicle',
    editVehicle: 'Edit Vehicle',
    deleteVehicle: 'Delete Vehicle',
    vehicleDetails: 'Vehicle Details',
    plateNumber: 'Plate Number',
    model: 'Model',
    year: 'Year',
    brand: 'Brand',
    status: 'Status',
    lastInspection: 'Last Inspection',
    assignedTo: 'Assigned To',
  },
  inspections: {
    title: 'Inspections',
    createInspection: 'Create Inspection',
    inspectionDetails: 'Inspection Details',
    inspectionType: 'Inspection Type',
    inspectionDate: 'Inspection Date',
    inspector: 'Inspector',
    status: 'Status',
    notes: 'Notes',
    photos: 'Photos',
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
  },
  quotations: {
    title: 'Quotations',
    createQuotation: 'Create Quotation',
    quotationDetails: 'Quotation Details',
    customer: 'Customer',
    amount: 'Amount',
    status: 'Status',
    createdDate: 'Created Date',
    expiryDate: 'Expiry Date',
    draft: 'Draft',
    sent: 'Sent',
    approved: 'Approved',
    paid: 'Paid',
  },
};

export const withProviders = (Story: React.ComponentType) => (
  <AppRouterContext.Provider value={mockRouter}>
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            <Story />
          </div>
        </ThemeProvider>
      </I18nProvider>
    </NextIntlClientProvider>
  </AppRouterContext.Provider>
);
