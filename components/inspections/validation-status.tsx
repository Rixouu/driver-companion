"use client"


interface ValidationStatusProps {
  status: 'passed' | 'failed' | 'na' | 'pending'
}

export function ValidationStatus({ status }: ValidationStatusProps) {

  const statusClassName = `status-badge ${
    status === 'passed' 
      ? 'bg-green-500/10 text-green-700 dark:text-green-300' 
      : status === 'failed'
        ? 'bg-red-500/10 text-red-700 dark:text-red-300'
        : 'bg-gray-500/10 text-gray-700 dark:text-gray-300'
  }`

  return (
    <span className={statusClassName}>
      {status}
    </span>
  )
} 