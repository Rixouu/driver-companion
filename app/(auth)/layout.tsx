export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-gradient">
      <div className="w-full max-w-[400px] mx-auto p-4">
        {children}
      </div>
    </div>
  )
} 