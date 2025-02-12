export type UserRole = 'ADMIN' | 'MANAGER' | 'DRIVER'

declare module 'next-auth' {
  interface Session {
    user: {
      role: UserRole
      email: string
      name: string
    }
  }
} 