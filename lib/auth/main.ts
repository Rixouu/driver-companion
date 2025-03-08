import { UserRole } from "@/types/next-auth"
import { NextAuthOptions, AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { supabase } from "../supabase"

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

    // Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  },

  logout: async () => {
    localStorage.removeItem('user')
    await supabase.auth.signOut()
  },

  getUser: () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return JSON.parse(userStr) as User
    }
    return null
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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For demo purposes, check if using test credentials
        if (credentials.email === 'test@example.com' && credentials.password === 'password') {
          return {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'ADMIN' as UserRole
          }
        }

        // In production, validate against Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          return null
        }

        // Get user profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        return {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || data.user.email!.split('@')[0],
          role: (profile?.role || 'USER') as UserRole
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as UserRole
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

