import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/styles"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Car, ClipboardCheck, Settings, LogOut, Wrench, User } from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Car, label: "Vehicles", href: "/vehicles" },
  { icon: User, label: "Drivers", href: "/drivers" },
  { icon: ClipboardCheck, label: "Inspections", href: "/inspections" },
  { icon: Wrench, label: "Maintenance", href: "/maintenance" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-800 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-700">
        <h1 className="text-xl font-bold">Driver Inspection</h1>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn("w-full justify-start", pathname === item.href ? "bg-gray-700" : "hover:bg-gray-700")}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-700 p-4">
        <Button variant="ghost" className="w-full justify-start text-red-400 hover:bg-gray-700 hover:text-red-400">
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}

