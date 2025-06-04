import { getServerSession } from "next-auth"
import { authOptions } from "./main"

export async function getServerAuthSession() {
  const session = await getServerSession(authOptions)
  return session
}

export function getUserFromSession(session: any) {
  return session?.user ?? null
}

export function isAdmin(session: any) {
  return session?.user?.role === "admin"
}

export function isManager(session: any) {
  return session?.user?.role === "manager"
}

export function canManageVehicles(session: any) {
  return isAdmin(session) || isManager(session)
} 