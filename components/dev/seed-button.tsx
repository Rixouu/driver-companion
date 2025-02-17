"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function SeedButton() {
  const { toast } = useToast()

  async function handleSeed() {
    try {
      const response = await fetch('/api/seed', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to seed database')
      
      toast({
        title: "Success",
        description: "Database seeded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed database",
        variant: "destructive",
      })
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleSeed}
      className="fixed bottom-4 right-4"
    >
      Seed Database
    </Button>
  )
} 