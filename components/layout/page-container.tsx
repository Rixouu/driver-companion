interface PageContainerProps {
  children: React.ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className={`flex-1 container mx-auto py-4 md:py-6 space-y-8 max-w-[1600px] 
      px-4 sm:px-6 md:px-8`}>
      {children}
    </main>
  )
} 