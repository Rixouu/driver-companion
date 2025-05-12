import React from 'react';
import Script from 'next/script';

export default function QuotationDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      
      {/* Add debug scripts */}
      <Script src="/js/debug-quotation.js" />
      <Script src="/js/quotation-items-inspector.js" />
    </>
  );
} 