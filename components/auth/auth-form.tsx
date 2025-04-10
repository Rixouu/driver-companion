"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/providers/auth-provider"

const authFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type AuthFormValues = z.infer<typeof authFormSchema>

type AuthMode = "signin" | "signup" | "reset"

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()
  const { toast } = useToast()
  const { signIn, signUp, resetPassword, error: authError } = useAuth()

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: AuthFormValues) => {
    setIsLoading(true)
    try {
      if (mode === "signin") {
        const { success, error } = await signIn(data.email, data.password)
        
        if (success) {
          router.push("/dashboard") // Redirect to dashboard on successful login
        } else if (error) {
          toast({
            title: "Authentication failed",
            description: error,
            variant: "destructive",
          })
        }
      } else if (mode === "signup") {
        const { success, error } = await signUp(data.email, data.password)
        
        if (success) {
          toast({
            title: "Account created",
            description: "Please check your email to verify your account.",
          })
          // Switch to sign in mode after successful signup
          setMode("signin")
        } else if (error) {
          toast({
            title: "Registration failed",
            description: error,
            variant: "destructive",
          })
        }
      } else if (mode === "reset") {
        const { success, error } = await resetPassword(data.email)
        
        if (success) {
          // Do nothing, the toast is already shown in the resetPassword function
        } else if (error) {
          toast({
            title: "Password reset failed",
            description: error,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
        </h1>
        <p className="text-muted-foreground">
          {mode === "signin" 
            ? "Enter your credentials to access your account" 
            : mode === "signup" 
              ? "Fill in the form to create your account" 
              : "Enter your email to receive a reset link"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="email@example.com" 
                    type="email" 
                    {...field}
                    disabled={isLoading} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode !== "reset" && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
                      {...field}
                      disabled={isLoading} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : 
              mode === "signin" ? "Sign In" : 
              mode === "signup" ? "Create Account" : 
              "Send Reset Link"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        {mode === "signin" ? (
          <>
            <Button 
              variant="link" 
              onClick={() => setMode("reset")}
              disabled={isLoading}
              className="px-2"
            >
              Forgot password?
            </Button>
            <span className="text-muted-foreground">•</span>
            <Button 
              variant="link" 
              onClick={() => setMode("signup")}
              disabled={isLoading}
              className="px-2"
            >
              Create account
            </Button>
          </>
        ) : mode === "signup" ? (
          <Button 
            variant="link" 
            onClick={() => setMode("signin")}
            disabled={isLoading}
          >
            Already have an account? Sign in
          </Button>
        ) : (
          <Button 
            variant="link" 
            onClick={() => setMode("signin")}
            disabled={isLoading}
          >
            Back to sign in
          </Button>
        )}
      </div>
    </div>
  )
} 