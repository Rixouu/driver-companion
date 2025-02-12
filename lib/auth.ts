import { UserRole } from "@/types/next-auth"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

interface User {
  id: string
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'MANAGER' | 'DRIVER'
}

// Mock user for development
const MOCK_USER: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'password',
  role: 'ADMIN',
}

export const auth = {
  login: async (email: string, password: string) => {
    // Mock login - in real app this would validate against Supabase
    if (email === 'test@example.com' && password === 'password') {
      localStorage.setItem('user', JSON.stringify(MOCK_USER))
      return { user: MOCK_USER, error: null }
    }
    return { user: null, error: 'Invalid credentials' }
  },

  logout: async () => {
    localStorage.removeItem('user')
    await fetch('/api/auth/logout', { method: 'POST' })
  },

  getUser: () => {
    if (typeof window === 'undefined') return null
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated: () => {
    return !!auth.getUser()
  }
}

// Define the User type that NextAuth expects
declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'MANAGER' | 'DRIVER'
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        
        if (credentials.email === "test@example.com" && credentials.password === "password") {
          return {
            id: "1",
            email: credentials.email,
            name: "Test User",
            role: "ADMIN"
          }
        }
        return null
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    }
  }
}

