"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuotationStatus } from "@/types/quotations";
import { useI18n } from "@/lib/i18n/context";
import { getQuotationStatusBadgeClasses } from "@/lib/utils/styles";

interface QuotationStatusFilterProps {
  currentStatus: QuotationStatus | 'all';
  onChange: (status: QuotationStatus | 'all') => void;
}

export function QuotationStatusFilter({
  currentStatus,
  onChange
}: QuotationStatusFilterProps) {
  const { t } = useI18n();

  const statusOptions: { value: QuotationStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('quotations.filters.all') },
    { value: 'draft', label: t('quotations.status.draft') },
    { value: 'sent', label: t('quotations.status.sent') },
    { value: 'approved', label: t('quotations.status.approved') },
    { value: 'rejected', label: t('quotations.status.rejected') },
    { value: 'expired', label: t('quotations.status.expired') },
    { value: 'converted', label: t('quotations.status.converted') }
  ];

  const getStatusStyles = (status: QuotationStatus | 'all', isSelected: boolean) => {
    const baseClasses = getQuotationStatusBadgeClasses(status);

    if (isSelected) {
      if (status === 'all') {
        return "bg-primary text-primary-foreground hover:bg-primary/90 border-primary";
      }
      // For selected items, make them brighter and more "solid"
      return `${baseClasses} bg-opacity-100 dark:bg-opacity-100 font-bold`;
    }
    
    // For unselected items, use the base classes with some transparency to distinguish
    // but keep them brighter than before.
    return `${baseClasses} bg-opacity-60 dark:bg-opacity-30 hover:bg-opacity-80 dark:hover:bg-opacity-40`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statusOptions.map(({ value, label }) => (
        <Badge
          key={value}
          variant="outline"
          className={cn(
            "cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-all",
            getStatusStyles(value, currentStatus === value)
          )}
          onClick={() => onChange(value)}
        >
          {label}
        </Badge>
      ))}
    </div>
  );
} 