interface PageContainerProps {
  children: React.ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className={`flex-1 w-full py-4 md:py-6 space-y-8 
      px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 3xl:px-20 4xl:px-24 5xl:px-28
      bg-[#FAFAFA] dark:bg-[#111111]`}>
      {children}
    </main>
  )
} 