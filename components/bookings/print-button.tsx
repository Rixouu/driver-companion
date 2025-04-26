'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handlePrint}>
        <Printer className="h-4 w-4" />
        Print Details
      </Button>

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