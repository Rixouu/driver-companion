import { DefaultSession } from "next-auth"

export enum UserRole {
  ADMIN = "ADMIN",
  DRIVER = "DRIVER",
  MANAGER = "MANAGER",
}

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole
    name: string
    email: string
  }

  interface Session extends DefaultSession {
    user: User & DefaultSession["user"]
  }
} 