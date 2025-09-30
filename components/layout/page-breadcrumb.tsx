"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  // If custom items are provided, use them
  if (items) {
    return (
      <Breadcrumb className={className}>
        <BreadcrumbList>
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href as any}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Auto-generate breadcrumbs based on pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname?.split('/').filter(Boolean) ?? []
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with Dashboard
    breadcrumbs.push({
      label: t('navigation.dashboard'),
      href: '/'
    })

    if (segments.length === 0) {
      return breadcrumbs
    }

    // Build breadcrumbs based on path segments
    let currentPath = ''
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      currentPath += `/${segment}`
      
      // Skip dynamic segments (UUIDs, IDs, etc.)
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
          segment.match(/^[a-zA-Z0-9]{8,}$/)) {
        continue
      }

      let label = ''
      let href = currentPath

      // Map segments to labels
      switch (segment) {
        case 'vehicles':
          label = t('navigation.vehicles')
          break
        case 'drivers':
          label = t('navigation.drivers')
          break
        case 'bookings':
          label = t('navigation.bookings')
          break
        case 'quotations':
          label = t('navigation.quotations')
          break
        case 'dispatch':
          label = t('navigation.dispatch')
          break
        case 'assignments':
          label = t('navigation.assignments')
          break
        case 'maintenance':
          label = t('navigation.maintenance')
          break
        case 'inspections':
          label = t('navigation.inspections')
          break
        case 'templates':
          label = t('navigation.templates')
          break
        case 'reporting':
          label = t('navigation.reporting')
          break
        case 'settings':
          label = t('navigation.settings')
          break
        case 'customers':
          label = t('navigation.customers')
          break
        case 'new':
          label = t('common.new')
          href = undefined as any // Current page, no link
          break
        case 'edit':
          label = t('common.edit')
          href = undefined as any // Current page, no link
          break
        case 'fuel':
          label = t('vehicles.fuel')
          break
        case 'mileage':
          label = t('vehicles.mileage')
          break
        case 'pricing':
          label = t('vehicles.pricing')
          break
        case 'bookings':
          label = t('vehicles.bookings')
          break
        case 'inspections':
          label = t('vehicles.inspections')
          break
        case 'maintenance':
          label = t('vehicles.maintenance')
          break
        case 'activity':
          label = t('vehicles.activity')
          break
        case 'assign-vehicle':
          label = t('drivers.assignVehicle')
          href = undefined as any // Current page, no link
          break
        case 'create':
          label = t('inspections.createNewInspection')
          href = undefined as any // Current page, no link
          break
        default:
          // Try to get a translation for the segment
          label = t(`navigation.${segment}`) || segment.charAt(0).toUpperCase() + segment.slice(1)
      }

      breadcrumbs.push({
        label,
        href: href === currentPath ? undefined : href
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href as any}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
