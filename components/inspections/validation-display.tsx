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
        ? 'bg-green-500/10 text-green-500' 
        : item.status === 'failed'
          ? 'bg-red-500/10 text-red-500'
          : 'bg-gray-500/10 text-gray-500'
    }`}>
      {item.status}
    </span>
  )
} 