'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Expand, Download, Edit2, Camera, MessageSquare } from 'lucide-react';
import type { InspectionItem, InspectionItemTemplate, InspectionPhoto } from '@/components/inspections/inspection-details';
import { useI18n } from '@/lib/i18n/context';

/**
 * Props for the InspectionItemCard component.
 */
interface InspectionItemCardProps {
  /** The inspection item data to display. */
  item: InspectionItem;
  /** Optional item number to display (e.g., for ordered lists). */
  itemNumber?: number;
  // getTranslationKeys: (template?: InspectionItemTemplate) => { section: string; item: string }; // To resolve translated names
  // getTemplateName: (template?: InspectionItemTemplate) => string;
  // getTemplateDescription: (template?: InspectionItemTemplate) => string;
  /** Optional callback when the item's status (pass/fail) should be updated. */
  onUpdateItemStatus?: (itemId: string, status: 'pass' | 'fail') => void;
  /** Optional callback when the notes for the item should be edited. */
  onEditNotes?: (itemId: string) => void;
  /** Optional callback when a photo should be added to the item. */
  onAddPhoto?: (itemId: string) => void;
}

// Helper to get status variant for badge
function getItemStatusVariant(status: string | null): 'default' | 'destructive' | 'success' | 'outline' {
  switch (status) {
    case 'pass': return 'success';
    case 'fail': return 'destructive';
    case 'pending': return 'outline';
    default: return 'default';
  }
}

/**
 * Displays a card for a single inspection item.
 * It shows the item's name, description, status, notes, and photos.
 * It also provides action buttons for editing notes or adding photos if callbacks are provided.
 *
 * @param props - The properties for the component.
 * @returns A card component representing the inspection item.
 */
export function InspectionItemCard({ 
  item, 
  itemNumber,
  // getTranslationKeys, 
  // getTemplateName, 
  // getTemplateDescription,
  onUpdateItemStatus,
  onEditNotes,
  onAddPhoto 
}: InspectionItemCardProps) {
  const { t, locale } = useI18n();

  // Simplified name/description fetching for now, assuming direct properties or simple lookup
  // In a real scenario, these would use the passed helper functions or a more robust translation mechanism
  const itemName = item.template?.name_translations?.[locale] || item.template?.name_translations?.['en'] || t('inspections.unnamedInspection');
  const itemDescription = item.template?.description_translations?.[locale] || item.template?.description_translations?.['en'] || '';

  const cardBorderColor = item.status === 'fail' 
    ? 'border-red-200 dark:border-red-900/50' 
    : item.status === 'pass' 
    ? 'border-green-200 dark:border-green-900/50' 
    : 'border-gray-200 dark:border-gray-700';

  const headerBgColor = item.status === 'fail' 
    ? 'bg-red-50/50 dark:bg-red-900/20' 
    : item.status === 'pass' 
    ? 'bg-green-50/50 dark:bg-green-900/20' 
    : 'bg-muted/30';

  const titleColor = item.status === 'fail' 
    ? 'text-red-800 dark:text-red-300' 
    : item.status === 'pass' 
    ? 'text-green-800 dark:text-green-300' 
    : '';

  return (
    <Card className={`${cardBorderColor} shadow-sm`}>
      <CardHeader className={`${headerBgColor} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            {itemNumber && (
              <div className="flex-shrink-0 mt-1">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium 
                  ${item.status === 'fail' ? 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300' : 
                    item.status === 'pass' ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 
                    'bg-gray-500/10 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300'}
                `}>
                  {itemNumber}
                </div>
              </div>
            )}
            <div className="flex-grow">
              <CardTitle className={`text-base ${titleColor}`}>{itemName}</CardTitle>
              {itemDescription && (
                <CardDescription className={`${item.status === 'fail' ? 'text-red-600 dark:text-red-400' : item.status === 'pass' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'} mt-1 text-xs`}>
                  {itemDescription}
                </CardDescription>
              )}
            </div>
          </div>
          {item.status && <Badge variant={getItemStatusVariant(item.status)}>{t(`inspections.statusValues.${item.status.toLowerCase()}`)}</Badge>}
        </div>
      </CardHeader>
      {(item.notes || (item.inspection_photos && item.inspection_photos.length > 0)) && (
        <CardContent className="p-4 pt-3">
          {item.notes && (
            <div className="mb-3 bg-muted/30 p-3 rounded-md">
              <h4 className="font-medium text-xs mb-1 flex items-center gap-1.5">
                <MessageSquare className={`h-3.5 w-3.5 ${item.status === 'fail' ? 'text-red-600' : item.status === 'pass' ? 'text-green-600' : 'text-gray-600'}`} />
                {t('inspections.details.items.notesHeader')}
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}
          {item.inspection_photos && item.inspection_photos.length > 0 && (
            <div>
              <h4 className="font-medium text-xs mb-1.5 flex items-center gap-1.5">
                 <Camera className={`h-3.5 w-3.5 ${item.status === 'fail' ? 'text-red-600' : item.status === 'pass' ? 'text-green-600' : 'text-gray-600'}`} />
                {t('inspections.fields.photos')} ({item.inspection_photos.length})
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {item.inspection_photos.map((photo) => (
                  <Dialog key={photo.id}>
                    <DialogTrigger asChild>
                      <button className="group relative aspect-square rounded-md overflow-hidden border focus:outline-none focus:ring-2 focus:ring-primary" title={t('inspections.fields.photo')}>
                        <Image
                          src={photo.photo_url}
                          alt={t('inspections.fields.photo')}
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Expand className="h-5 w-5 text-white" />
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl p-0">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={photo.photo_url}
                          alt={t('inspections.fields.photo')}
                          fill
                          className="rounded-t-lg object-contain"
                        />
                      </div>
                      <div className="flex justify-end gap-2 p-3 bg-muted/50 rounded-b-lg">
                        <Button variant="outline" size="sm" asChild>
                          <a href={photo.photo_url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            {t('inspections.details.photos.downloadPhoto')}
                          </a>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
      {/* Placeholder for action buttons within the card if needed */}
      {/* Example: Edit Notes, Add Photo, Change Status directly on card */}
      {(onUpdateItemStatus || onEditNotes || onAddPhoto) && (
        <CardContent className="p-4 border-t">
            <div className="flex items-center justify-end space-x-2">
                {onEditNotes && <Button variant="ghost" size="sm" onClick={() => onEditNotes(item.id)}><Edit2 className="h-4 w-4 mr-1"/> {t('common.notes')}</Button>}
                {onAddPhoto && <Button variant="ghost" size="sm" onClick={() => onAddPhoto(item.id)}><Camera className="h-4 w-4 mr-1"/> {t('inspections.fields.photo')}</Button>}
                {/* Add more actions as needed */}
            </div>
        </CardContent>
      )}
    </Card>
  );
} 