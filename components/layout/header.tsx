"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserNav } from "@/components/layout/user-nav"
import { ArrowLeft } from "lucide-react"

import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n/context"

export function Header() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useI18n()

  // Determine if we should show the back button and where it should go
  const getBackButtonInfo = () => {
    if (!pathname) return null

    // Vehicle detail pages
    if (pathname.match(/^\/vehicles\/[^\/]+$/)) {
      return { href: '/vehicles', label: t('navigation.vehicles') }
    }
    
    // Vehicle edit pages
    if (pathname.match(/^\/vehicles\/[^\/]+\/edit$/)) {
      const vehicleId = pathname.split('/')[2]
      return { href: `/vehicles/${vehicleId}`, label: t('vehicles.backToVehicle') }
    }
    
    // Vehicle sub-pages (fuel, mileage, maintenance, etc.)
    if (pathname.match(/^\/vehicles\/[^\/]+\/.+$/)) {
      const vehicleId = pathname.split('/')[2]
      return { href: `/vehicles/${vehicleId}`, label: t('vehicles.backToVehicle') }
    }
    
    // New vehicle page
    if (pathname === '/vehicles/new') {
      return { href: '/vehicles', label: t('navigation.vehicles') }
    }
    
    // Booking detail pages
    if (pathname.match(/^\/bookings\/[^\/]+$/)) {
      return { href: '/bookings', label: t('navigation.bookings') }
    }
    
    // Booking edit pages
    if (pathname.match(/^\/bookings\/[^\/]+\/edit$/)) {
      const bookingId = pathname.split('/')[2]
      return { href: `/bookings/${bookingId}`, label: t('bookings.backToBooking') }
    }
    
    // Driver detail pages
    if (pathname.match(/^\/drivers\/[^\/]+$/)) {
      return { href: '/drivers', label: t('navigation.drivers') }
    }
    
    // Driver edit/new pages
    if (pathname.match(/^\/drivers\/[^\/]+\/(edit|assign-vehicle)$/)) {
      const driverId = pathname.split('/')[2]
      return { href: `/drivers/${driverId}`, label: t('drivers.backToDriver') }
    }
    
    if (pathname === '/drivers/new') {
      return { href: '/drivers', label: t('navigation.drivers') }
    }
    
    // Inspection detail pages
    if (pathname.match(/^\/inspections\/[^\/]+$/)) {
      return { href: '/inspections', label: t('navigation.inspections') }
    }
    
    // Maintenance detail pages
    if (pathname.match(/^\/maintenance\/[^\/]+$/)) {
      return { href: '/maintenance', label: t('navigation.maintenance') }
    }
    
    // Quotation detail pages
    if (pathname.match(/^\/quotations\/[^\/]+$/)) {
      return { href: '/quotations', label: t('navigation.quotations') }
    }
    
    // Customer detail pages
    if (pathname.match(/^\/customers\/[^\/]+$/)) {
      return { href: '/customers', label: t('navigation.customers') }
    }
    
    // Customer edit pages
    if (pathname.match(/^\/customers\/[^\/]+\/edit$/)) {
      const customerId = pathname.split('/')[2]
      return { href: `/customers/${customerId}`, label: t('customers.backToCustomer') }
    }
    
    // New customer page
    if (pathname === '/customers/new') {
      return { href: '/customers', label: t('navigation.customers') }
    }

    return null
  }

  const backButtonInfo = getBackButtonInfo()

  if (pathname && pathname.startsWith("/auth")) return null

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-14">
      <div className="px-8 sm:px-10 md:px-12 max-w-[1600px] ml-auto">
        <div className="flex h-14 items-center justify-between">
          {/* Left side - Back button */}
          <div className="flex items-center">
            {backButtonInfo && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => router.push(backButtonInfo.href as any)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{backButtonInfo.label}</span>
              </Button>
            )}
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center gap-4">
            {/* Show theme toggle and login only on desktop */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              {!loading && !user && (
                <Button asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
              )}
            </div>

            {!loading && (
              <>
                {/* Mobile Actions */}
                <div className="flex md:hidden items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                  {user && <UserNav user={user} />}
                </div>
                
                {/* Desktop User Nav */}
                <div className="hidden md:flex">
                  {user && <UserNav user={user} />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 