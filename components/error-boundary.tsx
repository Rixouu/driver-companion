"use client"

import { useEffect } from "react"
import { Button } from "./ui/button"
import { useLanguage } from "./providers/language-provider"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLanguage()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">{t("errors.somethingWentWrong")}</h2>
      <Button onClick={reset}>{t("errors.tryAgain")}</Button>
    </div>
  )
} 