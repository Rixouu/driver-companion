import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Quote Access - Driver',
  description: 'Secure access to your quotation',
}

export default function QuoteAccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
