"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    default: "An error occurred during authentication.",
    configuration: "There is a problem with the server configuration.",
    accessdenied: "You do not have permission to sign in.",
    verification: "The verification failed.",
  }

  const message = errorMessages[error as string] || errorMessages.default

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="w-full max-w-[400px] space-y-6 p-6">
        <Card className="border-0 bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-xl text-white">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">{message}</p>
            <Button asChild className="w-full bg-white text-black hover:bg-gray-200">
              <Link href="/auth/login">
                Back to Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 