import type { TranslationValues } from "@/types"
import en from "./locales/en"

export async function getDictionary() {
  return { dictionary: en }
} 