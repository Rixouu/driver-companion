"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils/formatting"
import { Bell, History, Calendar, ArrowRight, ClipboardCheck, Wrench, FileText, User, Clock, MapPin } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"
import { Booking } from "@/types/bookings"
import { getQuotationUrl } from '@/lib/utils/quotation-url'
import { cn, getInspectionStatusBadgeClasses, getMaintenanceStatusBadgeClasses } from "@/lib/utils/styles"

interface ActivityFeedProps {
  recentInspections: DbInspection[]
  upcomingInspections: DbInspection[]
  recentMaintenance: DbMaintenanceTask[]
  upcomingMaintenance: DbMaintenanceTask[]
  recentQuotations: any[]
  upcomingBookings: Booking[]
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

function getBookingStatusBadge(status: string, t: (key: string, options?: any) => string) {
  switch (status) {
    case 'completed':
    case 'confirmed':
      return <Badge variant="outline" className="text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'assigned':
      return <Badge variant="outline" className="text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'pending':
      return <Badge variant="outline" className="text-yellow-800 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">{t(`bookings.status.${status}`)}</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">{t(`bookings.status.${status}`)}</Badge>;
  }
}

function getMaintenanceStatusBadge(status: string, t: (key: string, options?: any) => string) {
  switch (status) {
    case 'completed':
      return <Badge variant="outline" className="text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">{t(`maintenance.status.${status}`)}</Badge>;
    case 'in_progress':
      return <Badge variant="outline" className="text-yellow-800 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">{t(`maintenance.status.${status}`)}</Badge>;
    case 'scheduled':
    case 'pending':
      return <Badge variant="outline" className="text-amber-800 border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">{t(`maintenance.status.${status}`)}</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">{t(`maintenance.status.${status}`)}</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">{t(`maintenance.status.${status}`)}</Badge>;
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

function MaintenanceTaskCard({ task }: { task: DbMaintenanceTask }) {
  const { t } = useI18n()
  return (
    <Link href={`/maintenance/${task.id}`} className="block">
      <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded w-fit">
                  MAINTENANCE
                </span>
                <h4 className="font-semibold text-sm text-muted-foreground truncate">
                  {task.title}
                </h4>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground truncate">
                  {task.vehicle?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {task.status === 'completed' ? t('common.status.completed') : t('maintenance.details.scheduledFor', { date: formatDate(task.due_date) })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getMaintenanceStatusBadge(task.status, t)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function InspectionCard({ inspection }: { inspection: DbInspection }) {
  const { t } = useI18n()
  
  // Get full inspection type name
  const getFullTypeName = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'routine':
        return t('inspections.type.routine')
      case 'safety':
        return t('inspections.type.safety')
      case 'maintenance':
        return t('inspections.type.maintenance')
      case 'daily':
        return t('inspections.type.daily')
      default:
        return String(t('inspections.defaultType')) || 'Routine'
    }
  }
  
  return (
    <Link href={`/inspections/${inspection.id}`} className="block">
      <div className="py-4 border-b border-border/50 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
            <ClipboardCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                INSPECTION
              </span>
              <Badge variant="outline" className={getInspectionStatusBadgeClasses(inspection.status)}>
                {t(`inspections.status.${inspection.status}`)}
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground">
              {getFullTypeName(inspection.type)}
            </p>
            <p className="text-xs text-muted-foreground">
              {inspection.vehicle?.name || t("common.noVehicle")}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const { t } = useI18n()
  
  return (
    <Link 
      href={`/bookings/${booking.id}`}
      className="block"
    >
      <div className="py-4 border-b border-border/50 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
            <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                BOOKING
              </span>
              {getBookingStatusBadge(booking.status, t)}
            </div>
            <p className="text-sm font-medium text-foreground">
              {booking.customer_name || t("bookings.unnamed", { defaultValue: "Unnamed Customer" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(booking.date)} • {booking.time || '00:00'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

function QuotationCard({ quotation }: { quotation: any }) {
  const { t } = useI18n()
  return (
    <Link href={getQuotationUrl(quotation)} className="block">
      <div className="py-4 border-b border-border/50 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/20">
            <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                QUOTATION
              </span>
              {getQuotationStatusBadge(quotation.status, t)}
            </div>
            <p className="text-sm font-medium text-foreground">
              {quotation.customer_name || t('bookings.unnamed')}
            </p>
            <p className="text-xs text-muted-foreground">
              {quotation.currency || 'JPY'} {Number(quotation.total_amount || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ActivityFeed({
  recentInspections,
  upcomingInspections,
  recentMaintenance,
  upcomingMaintenance,
  recentQuotations,
  upcomingBookings
}: ActivityFeedProps) {
  const { t } = useI18n()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          {t("dashboard.activityFeed.title")}
        </CardTitle>
        <CardDescription className="text-sm">{t("dashboard.activityFeed.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1">
            <TabsTrigger value="recent" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground">
              <History className="mr-2 h-4 w-4" />
              {t("common.status.recent")}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              {t("common.status.upcoming")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            {recentMaintenance.length === 0 && recentInspections.length === 0 && recentQuotations.length === 0 ? (
              <EmptyState icon={History} message={t("dashboard.activityFeed.noRecent")} />
            ) : (
              <div className="space-y-4">
                {/* Show mix of recent activities - prioritize quotations, then inspections, then maintenance */}
                {recentQuotations.slice(0, 3).map((quotation: any) => (
                  <QuotationCard key={quotation.id} quotation={quotation} />
                ))}
                {recentInspections.slice(0, 2).map((inspection) => (
                  <InspectionCard key={inspection.id} inspection={inspection} />
                ))}
                {recentMaintenance.slice(0, 1).map((task) => (
                  <MaintenanceTaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
            {(recentMaintenance.length > 0 || recentInspections.length > 0 || recentQuotations.length > 0) && (
              <div className="mt-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    {t("dashboard.activityFeed.viewAll")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingMaintenance.length === 0 && upcomingInspections.length === 0 && upcomingBookings.length === 0 ? (
              <EmptyState icon={Calendar} message={t("dashboard.activityFeed.noUpcoming")} />
            ) : (
              <div className="space-y-4">
                {/* Show mix of upcoming activities - prioritize bookings, then inspections, then maintenance */}
                {upcomingBookings.slice(0, 2).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
                {upcomingInspections.slice(0, 2).map((inspection) => (
                  <InspectionCard key={inspection.id} inspection={inspection} />
                ))}
                {upcomingMaintenance.slice(0, 1).map((task) => (
                  <MaintenanceTaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
            {(upcomingMaintenance.length > 0 || upcomingInspections.length > 0 || upcomingBookings.length > 0) && (
              <div className="mt-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    {t("dashboard.activityFeed.viewAll")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
