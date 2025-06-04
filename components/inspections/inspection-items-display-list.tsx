'use client';

import { InspectionItem } from '@/components/inspections/inspection-details'; // Parent type
import { InspectionItemCard } from '@/components/inspections/inspection-item-card';
import { useI18n } from '@/lib/i18n/context';
import { AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Props for the InspectionItemsDisplayList component.
 */
interface InspectionItemsDisplayListProps {
  /** An array of inspection items to display. */
  items: InspectionItem[];
  /** The title for the list of items. */
  listTitle: string;
  /** Optional description to display below the title or for empty states. */
  listDescription?: string;
  /** Optional filter to display only items with a specific status. */
  itemStatusFilter?: 'pass' | 'fail' | 'pending';
  /** Optional callback when an item's status is updated. Passed to `InspectionItemCard`. */
  onUpdateItemStatus?: (itemId: string, status: 'pass' | 'fail') => void;
  /** Optional callback when the notes for an item should be edited. Passed to `InspectionItemCard`. */
  onEditNotes?: (itemId: string) => void;
  /** Optional callback when a photo should be added to an item. Passed to `InspectionItemCard`. */
  onAddPhoto?: (itemId: string) => void;
}

/**
 * Displays a list of inspection items, optionally filtered by status.
 * It renders `InspectionItemCard` for each item and handles empty states.
 *
 * @param props - The properties for the component.
 * @returns A list of inspection item cards or an empty state message.
 */
export function InspectionItemsDisplayList({
  items,
  listTitle,
  listDescription,
  itemStatusFilter,
  onUpdateItemStatus,
  onEditNotes,
  onAddPhoto,
}: InspectionItemsDisplayListProps) {
  const { t } = useI18n();

  const filteredItems = itemStatusFilter 
    ? items.filter(item => item.status === itemStatusFilter) 
    : items;

  if (filteredItems.length === 0) {
    let emptyStateTitle = t('inspections.details.results.noItemsInStatus', { status: itemStatusFilter || 'current' });
    let EmptyStateIcon = CheckCircle;
    let iconColor = "text-green-600 dark:text-green-400";

    if (itemStatusFilter === 'fail') {
      emptyStateTitle = t('inspections.details.results.allPassed');
    } else if (itemStatusFilter === 'pass') {
      emptyStateTitle = t('inspections.details.results.noPassedItems'); // Or a more generic "No items passed criteria"
      EmptyStateIcon = AlertTriangle; // Or a neutral icon
      iconColor = "text-yellow-600 dark:text-yellow-400";
    } else if (itemStatusFilter === 'pending') {
      emptyStateTitle = t('inspections.details.results.noPendingItems');
       EmptyStateIcon = AlertTriangle;
       iconColor = "text-gray-600 dark:text-gray-400";
    }

    return (
      <div className="text-center py-10 bg-muted/20 rounded-lg">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-background mb-6 shadow`}>
          <EmptyStateIcon className={`h-8 w-8 ${iconColor}`} />
        </div>
        <h3 className="text-xl font-semibold mb-2">{emptyStateTitle}</h3>
        {listDescription && <p className="text-muted-foreground max-w-md mx-auto">{listDescription}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Optional: Add a header for the list if needed, or it can be part of the parent TabContent CardHeader */}
      {/* 
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{listTitle}</h2>
        {listDescription && <p className="text-muted-foreground">{listDescription}</p>}
      </div> 
      */}
      {filteredItems.map((item, index) => (
        <InspectionItemCard 
          key={item.id} 
          item={item} 
          itemNumber={index + 1} 
          onUpdateItemStatus={onUpdateItemStatus}
          onEditNotes={onEditNotes}
          onAddPhoto={onAddPhoto}
        />
      ))}
    </div>
  );
} 