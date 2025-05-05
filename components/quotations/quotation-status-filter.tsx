"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuotationStatus } from "@/types/quotations";
import { useI18n } from "@/lib/i18n/context";

interface QuotationStatusFilterProps {
  currentStatus: QuotationStatus | 'all';
  onChange: (status: QuotationStatus | 'all') => void;
}

export function QuotationStatusFilter({
  currentStatus,
  onChange
}: QuotationStatusFilterProps) {
  const { t } = useI18n();

  const statusOptions = [
    { value: 'all', label: t('quotations.filters.all') },
    { value: 'draft', label: t('quotations.status.draft') },
    { value: 'sent', label: t('quotations.status.sent') },
    { value: 'approved', label: t('quotations.status.approved') },
    { value: 'rejected', label: t('quotations.status.rejected') },
    { value: 'expired', label: t('quotations.status.expired') },
    { value: 'converted', label: t('quotations.status.converted') }
  ];

  const getStatusStyles = (status: string, isSelected: boolean) => {
    if (isSelected) {
      // For selected badges, use filled style on dark background
      switch (status) {
        case 'all':
          return "bg-white text-gray-900 border-white";
        case 'draft':
          return "bg-gray-200 text-gray-900 border-gray-200";
        case 'sent':
          return "bg-blue-400 text-blue-950 border-blue-400";
        case 'approved':
          return "bg-green-400 text-green-950 border-green-400";
        case 'rejected':
          return "bg-red-400 text-red-950 border-red-400";
        case 'expired':
          return "bg-orange-400 text-orange-950 border-orange-400";
        case 'converted':
          return "bg-purple-400 text-purple-950 border-purple-400";
        default:
          return "bg-white text-gray-900 border-white";
      }
    } else {
      // For unselected badges, use outline style on dark background 
      switch (status) {
        case 'all':
          return "bg-transparent text-white border-white/40 hover:bg-white/10";
        case 'draft':
          return "bg-transparent text-gray-300 border-gray-400 hover:bg-gray-800";
        case 'sent':
          return "bg-transparent text-blue-300 border-blue-400 hover:bg-blue-900/30";
        case 'approved':
          return "bg-transparent text-green-300 border-green-400 hover:bg-green-900/30";
        case 'rejected':
          return "bg-transparent text-red-300 border-red-400 hover:bg-red-900/30";
        case 'expired':
          return "bg-transparent text-orange-300 border-orange-400 hover:bg-orange-900/30";
        case 'converted':
          return "bg-transparent text-purple-300 border-purple-400 hover:bg-purple-900/30";
        default:
          return "bg-transparent text-white border-white/40 hover:bg-white/10";
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto py-1">
      {statusOptions.map(option => (
        <Badge
          key={option.value}
          variant="outline"
          className={cn(
            "text-sm font-medium px-2.5 py-0.5 h-9 px-3 rounded-md border cursor-pointer transition-colors",
            getStatusStyles(option.value, currentStatus === option.value)
          )}
          onClick={() => onChange(option.value as QuotationStatus | 'all')}
        >
          {option.label}
        </Badge>
      ))}
    </div>
  );
} 