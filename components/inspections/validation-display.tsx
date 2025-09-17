"use client"


interface ValidationDisplayProps {
  item: {
    status: 'passed' | 'failed' | 'na'
  }
}

export function ValidationDisplay({ item }: ValidationDisplayProps) {

  return (
    <span className={`status-badge ${
      item.status === 'passed' 
        ? 'bg-green-500/10 text-green-700 dark:text-green-300' 
        : item.status === 'failed'
          ? 'bg-red-500/10 text-red-700 dark:text-red-300'
          : 'bg-gray-500/10 text-gray-700 dark:text-gray-300'
    }`}>
      {item.status}
    </span>
  )
} 