interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, description, icon, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 xl:gap-6 2xl:gap-8 3xl:gap-10 4xl:gap-12 5xl:gap-16">
      <div className="flex items-center gap-3 text-left sm:text-left xl:gap-4 2xl:gap-5 3xl:gap-6 4xl:gap-8 5xl:gap-10">
        {icon && <div className="rounded-lg p-2 bg-primary/10 xl:p-3 2xl:p-4 3xl:p-5 4xl:p-6 5xl:p-8">{icon}</div>}
        <div className="space-y-1 xl:space-y-2 2xl:space-y-3 3xl:space-y-4 4xl:space-y-5 5xl:space-y-6">
          <h1 className="text-xl sm:text-3xl xl:text-4xl 2xl:text-4xl 3xl:text-4xl 4xl:text-4xl 5xl:text-4xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm sm:text-lg xl:text-xl 2xl:text-xl 3xl:text-xl 4xl:text-xl 5xl:text-xl text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="w-full sm:w-auto">{children}</div>}
    </div>
  )
} 