'use client';

import Link from 'next/link';
import { ArrowLeft, Printer, Download, Pencil, Play, CheckCircle, MoreVertical } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { InspectionStatusBadge } from '@/components/inspections/inspection-status-badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ExtendedInspection } from '@/components/inspections/inspection-details';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

/**
 * Props for the InspectionDetailsHeader component.
 */
interface InspectionDetailsHeaderProps {
  /** The inspection object containing details to display. */
  inspection: ExtendedInspection;
  /** The current authenticated user, if any. */
  user: User | null | undefined;
  /** Optional flag indicating if an update operation is in progress. */
  isUpdating?: boolean;
  /** Optional flag indicating if an export operation is in progress. */
  isExporting?: boolean;
  /** Callback function to initiate starting the inspection. */
  onStartInspection: () => Promise<void>;
  /** Callback function to print the inspection report. */
  onPrint: () => void;
  /** Callback function to export the inspection report as HTML/CSV. */
  onExportHtml: () => void;
  /** Callback function to export the inspection report as PDF. */
  onExportPdf: () => Promise<void>;
}

/**
 * Displays the header section for inspection details.
 * It includes navigation, inspection name, vehicle name, action buttons (start, edit, print, export),
 * and the inspection status badge.
 */
export function InspectionDetailsHeader({ 
  inspection, 
  user,
  isUpdating,
  isExporting,
  onStartInspection,
  onPrint,
  onExportHtml,
  onExportPdf
}: InspectionDetailsHeaderProps) {
  const { t } = useI18n();
  const router = useRouter();

  const canEdit = inspection.status !== 'completed' && inspection.status !== 'cancelled';
  const canStart = inspection.status !== 'completed' && inspection.status !== 'cancelled' && user && user.id === inspection.created_by;

  return (
    <Card className="mb-6 print-hide shadow-sm">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label={t('common.back')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                {inspection?.name || t('inspections.unnamedInspection')}
              </h1>
              <div className="text-sm text-muted-foreground">
                {inspection.vehicle?.name || t('inspections.noVehicleAssigned')}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canStart && (
              <Button onClick={onStartInspection} disabled={isUpdating || inspection.status === 'in_progress' || inspection.status === 'completed'}>
                {inspection.status === 'pending' || inspection.status === 'scheduled' ? (
                  <><Play className="mr-2 h-4 w-4" /> {t('inspections.actions.start')}</>
                ) : inspection.status === 'draft' ? (
                  <><Pencil className="mr-2 h-4 w-4" /> {t('inspections.actions.continueEditing')}</>
                ) : (
                  <><CheckCircle className="mr-2 h-4 w-4" /> {t('inspections.actions.markAsCompleted')}</>
                )}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => router.push(`/inspections/${inspection.id}/edit` as any)} 
              disabled={!canEdit}
              aria-label={t('common.edit')}
            >
              <Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t('common.actions.default')}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  {t('inspections.actions.printReport')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportHtml} disabled={isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? t('common.exporting') : t('inspections.actions.exportHtml')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPdf} disabled={isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? t('common.exporting') : t('inspections.actions.exportPdf')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-4">
          <InspectionStatusBadge status={inspection.status || 'unknown'} />
        </div>
      </CardHeader>
    </Card>
  );
} 