import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Manage pricing categories, items, and packages"
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full h-full">
      {children}
    </div>
  )
}
