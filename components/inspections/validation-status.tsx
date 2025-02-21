"use client"


interface ValidationStatusProps {
  status: 'passed' | 'failed' | 'na' | 'pending'
}

export function ValidationStatus({ status }: ValidationStatusProps) {

  const statusClassName = `status-badge ${
    status === 'passed' 
      ? 'bg-green-500/10 text-green-500' 
      : status === 'failed'
        ? 'bg-red-500/10 text-red-500'
        : 'bg-gray-500/10 text-gray-500'
  }`

  return (
    <span className={statusClassName}>
      {status}
    </span>
  )
} 