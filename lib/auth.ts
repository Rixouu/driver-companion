import { UserRole } from "@/types/next-auth"
import { NextAuthOptions, AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { supabase } from "./supabase"

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
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole
    sub: string
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !user) return null

        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name,
          role: user.user_metadata?.role,
        }
      }
    }),
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
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          email: session.user.email,
          name: session.user.name,
          id: token.sub!,
          role: token.role as UserRole
        }
      }
    },
  }
}

