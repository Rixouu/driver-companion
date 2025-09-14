import { QuotationEmailTest } from '@/components/quotations/quotation-email-test'

// =============================================================================
// EMAIL TEST PAGE - Test Unified Email System
// =============================================================================

export default function EmailTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Unified Email System Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test the new unified email system with database templates
          </p>
        </div>
        
        <QuotationEmailTest />
      </div>
    </div>
  )
}
