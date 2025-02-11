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

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        // Check if it matches our test user
        if (credentials.email !== MOCK_USER.email) {
          throw new Error("Invalid credentials")
        }

        // For testing, accept "password" as the password
        if (credentials.password !== "password") {
          throw new Error("Invalid credentials")
        }

        return {
          id: MOCK_USER.id,
          email: MOCK_USER.email,
          name: MOCK_USER.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (profile) {
        token.name = profile.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
      }
      return session
    },
    async signIn({ user, account, profile }) {
      return true // Add any custom sign in logic here
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

