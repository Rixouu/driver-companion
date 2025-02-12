"use client"

import { useLanguage } from "./providers/language-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <Select value={language} onValueChange={(value: "en" | "ja") => setLanguage(value)}>
      <SelectTrigger className="w-[100px]">
        <SelectValue>
          {language === "en" ? "English" : "日本語"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ja">日本語</SelectItem>
      </SelectContent>
    </Select>
  )
} 