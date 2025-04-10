"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"

export type UserRole = "admin" | "manager" | "driver" | "guest"

export interface UserPermissions {
  canViewDashboard: boolean
  canCreateVehicles: boolean
  canEditVehicles: boolean
  canDeleteVehicles: boolean
  canAssignDrivers: boolean
  canPerformInspections: boolean
  canViewReports: boolean
  canManageUsers: boolean
  canManageSettings: boolean
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  canViewDashboard: false,
  canCreateVehicles: false,
  canEditVehicles: false,
  canDeleteVehicles: false,
  canAssignDrivers: false,
  canPerformInspections: false,
  canViewReports: false,
  canManageUsers: false,
  canManageSettings: false,
}

const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canViewDashboard: true,
    canCreateVehicles: true,
    canEditVehicles: true,
    canDeleteVehicles: true,
    canAssignDrivers: true,
    canPerformInspections: true,
    canViewReports: true,
    canManageUsers: true,
    canManageSettings: true,
  },
  manager: {
    canViewDashboard: true,
    canCreateVehicles: true,
    canEditVehicles: true,
    canDeleteVehicles: false,
    canAssignDrivers: true,
    canPerformInspections: true,
    canViewReports: true,
    canManageUsers: false,
    canManageSettings: false,
  },
  driver: {
    canViewDashboard: true,
    canCreateVehicles: false,
    canEditVehicles: false,
    canDeleteVehicles: false,
    canAssignDrivers: false,
    canPerformInspections: true,
    canViewReports: false,
    canManageUsers: false,
    canManageSettings: false,
  },
  guest: {
    canViewDashboard: true,
    canCreateVehicles: false,
    canEditVehicles: false,
    canDeleteVehicles: false,
    canAssignDrivers: false,
    canPerformInspections: false,
    canViewReports: false,
    canManageUsers: false,
    canManageSettings: false,
  },
}

export function usePermissions() {
  const { user, loading: authLoading } = useAuth()
  const [role, setRole] = useState<UserRole>("guest")
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // If auth is still loading, don't do anything yet
    if (authLoading) return

    // Set default guest role if no user
    if (!user) {
      setRole("guest")
      setPermissions(ROLE_PERMISSIONS.guest)
      setLoading(false)
      return
    }

    // Get user role from user metadata (or default to guest)
    try {
      // In a real app, we'd extract role from the user object or metadata
      // For now, assume admin for test@example.com, otherwise driver
      const userEmail = user.email || ""
      const userRole = userEmail.includes("admin") || userEmail === "test@example.com" 
        ? "admin" 
        : userEmail.includes("manager") 
          ? "manager" 
          : "driver"
      
      setRole(userRole as UserRole)
      setPermissions(ROLE_PERMISSIONS[userRole as UserRole] || ROLE_PERMISSIONS.guest)
    } catch (err) {
      console.error("Error determining user role:", err)
      setRole("guest")
      setPermissions(ROLE_PERMISSIONS.guest)
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission]
  }

  return {
    role,
    permissions,
    hasPermission,
    loading: loading || authLoading,
  }
} 