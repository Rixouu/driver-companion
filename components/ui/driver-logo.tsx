'use client'

interface DriverLogoProps {
  className?: string
  height?: number
}

export function DriverLogo({ className = '', height = 60 }: DriverLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="bg-red-600 text-white font-bold text-xl px-3 py-2 rounded">
        D DRIVER
      </div>
    </div>
  )
}
