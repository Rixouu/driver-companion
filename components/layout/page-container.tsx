export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 container mx-auto p-4 md:p-6 lg:pl-72 space-y-8">
      {children}
    </main>
  )
} 