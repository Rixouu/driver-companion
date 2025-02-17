import { toast } from "@/components/ui/use-toast"
import { PostgrestError } from "@supabase/supabase-js"

export function handleError(error: unknown) {
  console.error(error)
  
  if (error instanceof PostgrestError) {
    toast({
      title: "Database Error",
      description: error.message,
      variant: "destructive",
    })
    return
  }

  if (error instanceof Error) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    })
    return
  }

  toast({
    title: "Error",
    description: "An unexpected error occurred",
    variant: "destructive",
  })
} 