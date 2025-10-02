"use client"

import { useState, lazy, Suspense } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { EnhancedInspectionTemplateManager } from '@/components/inspections/enhanced-inspection-template-manager'
import { TemplatesTabsList } from '@/components/templates/templates-tabs-list'
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb'
import { useI18n } from '@/lib/i18n/context'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components
const EmailTemplateManagement = lazy(() => 
  import('@/components/settings/notification-management-improved').then(module => ({
    default: module.NotificationManagementImproved
  }))
)

const RevampedPDFTemplateManagement = lazy(() => 
  import('@/components/templates/revamped-pdf-template-management').then(module => ({
    default: module.RevampedPDFTemplateManagement
  }))
)

export default function TemplatesPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('inspections')

  return (
    <div className="space-y-6">
      <PageBreadcrumb />
      <div className="border-b border-border/40 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{t('templates.title')}</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {t('templates.description')}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TemplatesTabsList value={activeTab} onValueChange={setActiveTab} />
        
        <div className="mt-6 sm:mt-8">
          <TabsContent value="inspections">
            <div className="space-y-6">
              <div className="border-b border-border pb-3 sm:pb-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">{t('inspectionTemplates.title')}</h2>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                  {t('inspectionTemplates.description')}
                </p>
              </div>
              <EnhancedInspectionTemplateManager />
            </div>
          </TabsContent>
          
          <TabsContent value="emails">
            <Suspense fallback={
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                </div>
                <div className="grid gap-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            }>
              <EmailTemplateManagement />
            </Suspense>
          </TabsContent>
          
        <TabsContent value="pdfs">
          <Suspense fallback={
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
              <div className="grid gap-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          }>
            <RevampedPDFTemplateManagement />
          </Suspense>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
