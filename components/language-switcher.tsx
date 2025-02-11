"use client"

import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const isJapanese = pathname.startsWith('/ja')

  const toggleLanguage = () => {
    const newPath = isJapanese 
      ? pathname.replace('/ja', '') 
      : '/ja' + pathname

    router.push(newPath)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="w-16"
    >
      {isJapanese ? 'EN' : '日本語'}
    </Button>
  )
}

