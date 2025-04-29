interface PageContainerProps {
  children: React.ReactNode
  sidebarCollapsed?: boolean
}

export function PageContainer({ children, sidebarCollapsed = false }: PageContainerProps) {
  return (
    <main className={`flex-1 container mx-auto py-4 md:py-6 space-y-8 max-w-[1600px] 
      ${sidebarCollapsed 
        ? 'px-8 sm:px-10 md:px-12 lg:px-12 xl:px-16' 
        : 'px-8 sm:px-10 md:px-12'}`}>
      {children}
    </main>
  )
} 