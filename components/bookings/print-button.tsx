'use client'

import { Printer } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { BookingButton } from './booking-button'

export function PrintButton() {
  const { t } = useI18n()
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <BookingButton
        variant="default"
        icon={<Printer className="h-5 w-5" />}
        onClick={handlePrint}
      >
        {t('bookings.details.actions.printDetails')}
      </BookingButton>

      <style jsx global>{`
        @media print {
          nav, button, .print-hide {
            display: none !important;
          }
          body, html {
            background-color: white !important;
          }
          .print-break {
            page-break-after: always;
          }
        }
      `}</style>
    </>
  );
} 