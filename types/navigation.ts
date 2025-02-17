export type NavigationIcon = 
  | "dashboard" 
  | "vehicles" 
  | "inspections" 
  | "maintenance" 
  | "settings" 
  | "logout"

export type NavigationItem = {
  title: string
  href: string
  icon: NavigationIcon
} 