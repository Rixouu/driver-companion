"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { History, ArrowRight, FileText } from "lucide-react"

interface RecentQuotationsProps {
  recentQuotations: any[]
  isLoadingRecentQuotations: boolean
  quotationsError: string | null
}

function getQuotationStatusBadge(status: string, t: (key: string, options?: any) => string) {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="text-gray-800 border-gray-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
          {t('quotations.status.draft')}
        </Badge>
      );
    case 'sent':
      return (
        <Badge variant="outline" className="text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
          {t('quotations.status.sent')}
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
          {t('quotations.status.approved')}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
          {t('quotations.status.rejected')}
        </Badge>
      );
    case 'converted':
      return (
        <Badge variant="outline" className="text-purple-800 border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700">
          {t('quotations.status.converted')}
        </Badge>
      );
    case 'paid':
      return (
        <Badge variant="outline" className="text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
          {t('quotations.status.paid')}
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="outline" className="text-amber-800 border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700">
          {t('quotations.status.expired')}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          {status}
        </Badge>
      );
  }
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function QuotationCard({ quotation }: { quotation: any }) {
  const { t } = useI18n()
  return (
    <Link href={`/quotations/${quotation.id}`} className="block">
      <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Top row: Status badge and quotation type */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded w-fit">
                QUOTATION
              </span>
              <div className="flex-shrink-0">
                {getQuotationStatusBadge(quotation.status, t)}
              </div>
            </div>
            
            {/* Quotation title */}
            <h4 className="font-semibold text-sm text-muted-foreground truncate mb-1">
              {quotation.title || t('quotations.details.untitled', { defaultValue: 'Untitled' })}
            </h4>
            
            {/* Customer name */}
            <p className="text-xs text-muted-foreground mb-2 truncate">
              {quotation.customer_name || t('bookings.unnamed')}
            </p>
            
            {/* Amount */}
            {(() => {
              // Calculate final amount for Charter Services
              let displayAmount = quotation.total_amount;
              
              if (quotation.service_type?.toLowerCase().includes('charter')) {
                // For Charter Services, recalculate the amount
                const baseAmount = quotation.amount || 0;
                const serviceDays = quotation.service_days || 1;
                const calculatedBase = baseAmount * serviceDays;
                
                // Apply discount and tax
                const discountPercentage = quotation.discount_percentage || 0;
                const taxPercentage = quotation.tax_percentage || 0;
                const promotionDiscount = quotation.promotion_discount || 0;
                
                const regularDiscount = calculatedBase * (discountPercentage / 100);
                const totalDiscount = promotionDiscount + regularDiscount;
                const subtotal = Math.max(0, calculatedBase - totalDiscount);
                const taxAmount = subtotal * (taxPercentage / 100);
                displayAmount = subtotal + taxAmount;
              }
              
              return displayAmount ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {quotation.currency || 'JPY'} {Number(displayAmount).toLocaleString()}
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </div>
    </Link>
  )
}

export function RecentQuotations({
  recentQuotations,
  isLoadingRecentQuotations,
  quotationsError
}: RecentQuotationsProps) {
  const { t } = useI18n()

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          {t('quotations.title')}
        </CardTitle>
        <CardDescription>{t('quotations.listDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingRecentQuotations ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        ) : quotationsError ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {quotationsError}
          </div>
        ) : recentQuotations.length === 0 ? (
          <EmptyState icon={FileText} message={t('quotations.placeholder')} />
        ) : (
          <div className="space-y-4">
            {recentQuotations.slice(0, 4).map((quotation: any) => (
              <QuotationCard key={quotation.id} quotation={quotation} />
            ))}
            <div className="pt-2">
              <Link href="/quotations">
                <Button variant="outline" className="w-full">
                  {t('quotations.viewAll')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
