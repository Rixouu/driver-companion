"use client"


interface ResultsDisplayProps {
  result: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {

  const statusClassName = `status-badge ${
    result.status === 'passed' 
      ? 'bg-green-500/10 text-green-500' 
      : result.status === 'failed'
        ? 'bg-red-500/10 text-red-500'
        : 'bg-gray-500/10 text-gray-500'
  }`

  return (
    <span className={statusClassName}>{result.status}</span>
  )
} 