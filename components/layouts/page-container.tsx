interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`container max-w-5xl mx-auto px-4 py-8 ${className}`}>
      {children}
    </div>
  )
} 