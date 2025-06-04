import { Wrench, ClipboardCheck, Calendar, LucideIcon } from "lucide-react"

export type RecordType = 'maintenance' | 'inspection' | 'booking'

export interface RecordTypeStyle {
  colors: {
    primary: string
    secondary: string
    background: string
    backgroundHover: string
    border: string
    gradient: string
    text: string
  }
  icon: LucideIcon
  bgClass: string
  hoverClass: string
  borderClass: string
  textClass: string
  iconClass: string
}

export const getRecordTypeStyle = (type: RecordType): RecordTypeStyle => {
  const styles: Record<RecordType, RecordTypeStyle> = {
    maintenance: {
      colors: {
        primary: '#2563eb', // blue-600
        secondary: '#3b82f6', // blue-500
        background: '#eff6ff', // blue-50
        backgroundHover: '#dbeafe', // blue-100
        border: '#bfdbfe', // blue-200
        gradient: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30',
        text: '#1d4ed8' // blue-700
      },
      icon: Wrench,
      bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
      hoverClass: 'hover:bg-blue-100/50 dark:hover:bg-blue-950/30',
      borderClass: 'border-blue-200/30 dark:border-blue-800/30',
      textClass: 'text-blue-600 dark:text-blue-400',
      iconClass: 'text-blue-600 dark:text-blue-400'
    },
    inspection: {
      colors: {
        primary: '#059669', // green-600  
        secondary: '#10b981', // green-500
        background: '#ecfdf5', // green-50
        backgroundHover: '#d1fae5', // green-100
        border: '#a7f3d0', // green-200
        gradient: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30',
        text: '#047857' // green-700
      },
      icon: ClipboardCheck,
      bgClass: 'bg-green-50/50 dark:bg-green-950/20',
      hoverClass: 'hover:bg-green-100/50 dark:hover:bg-green-950/30',
      borderClass: 'border-green-200/30 dark:border-green-800/30',
      textClass: 'text-green-600 dark:text-green-400',
      iconClass: 'text-green-600 dark:text-green-400'
    },
    booking: {
      colors: {
        primary: '#7c3aed', // purple-600
        secondary: '#8b5cf6', // purple-500
        background: '#faf5ff', // purple-50
        backgroundHover: '#f3e8ff', // purple-100
        border: '#d8b4fe', // purple-200
        gradient: 'from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30',
        text: '#6d28d9' // purple-700
      },
      icon: Calendar,
      bgClass: 'bg-purple-50/50 dark:bg-purple-950/20',
      hoverClass: 'hover:bg-purple-100/50 dark:hover:bg-purple-950/30',
      borderClass: 'border-purple-200/30 dark:border-purple-800/30',
      textClass: 'text-purple-600 dark:text-purple-400',
      iconClass: 'text-purple-600 dark:text-purple-400'
    }
  }

  return styles[type]
}

export const getRecordTypeColors = (type: RecordType) => getRecordTypeStyle(type).colors
export const getRecordTypeIcon = (type: RecordType) => getRecordTypeStyle(type).icon 