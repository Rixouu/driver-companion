interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, description, icon, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3 text-left sm:text-left">
        {icon && <div className="rounded-lg p-2 bg-primary/10">{icon}</div>}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm sm:text-lg text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="w-full sm:w-auto">{children}</div>}
    </div>
  )
} 