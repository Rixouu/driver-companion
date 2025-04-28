'use client'

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from '@/lib/i18n/context'

export type BookingStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'canceled'

interface StatusFilterProps {
  value: string
  onChange: (value: BookingStatus) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const { t } = useI18n()
  
  return (
    <Select 
      value={value} 
      onValueChange={(value) => onChange(value as BookingStatus)}
    >
      <SelectTrigger className="w-[180px] h-8">
        <SelectValue placeholder={t('bookings.filters.statusPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('bookings.filters.all')}</SelectItem>
        <SelectItem value="pending">{t('bookings.filters.pending')}</SelectItem>
        <SelectItem value="confirmed">{t('bookings.filters.confirmed')}</SelectItem>
        <SelectItem value="completed">{t('bookings.filters.completed')}</SelectItem>
        <SelectItem value="canceled">{t('bookings.filters.cancelled')}</SelectItem>
      </SelectContent>
    </Select>
  )
} 