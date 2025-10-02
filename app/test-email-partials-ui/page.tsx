'use client'

import { EmailPartialsManagement } from '@/components/templates/email-partials-management'

export default function TestEmailPartialsUIPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Email Partials UI</h1>
      <EmailPartialsManagement />
    </div>
  )
}
