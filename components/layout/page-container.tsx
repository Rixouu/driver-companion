export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 container mx-auto px-8 sm:px-10 md:px-12 py-4 md:py-6 lg:pl-72 space-y-8 max-w-[1600px]">
      {children}
    </main>
  )
} 