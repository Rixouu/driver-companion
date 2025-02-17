export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="container max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {children}
    </main>
  )
} 