"use client"

import { Input } from "./ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select"
import { useLanguage } from "./providers/language-provider"

interface SearchFilterProps {
  onSearch: (value: string) => void
  onFilter: (value: string) => void
  filterOptions: { value: string; label: string }[]
}

export function SearchFilter({ onSearch, onFilter, filterOptions }: SearchFilterProps) {
  const { t } = useLanguage()

  return (
    <div className="flex gap-4">
      <Input 
        placeholder={t("common.search")} 
        onChange={(e) => onSearch(e.target.value)}
        className="max-w-[300px]"
      />
      <Select onValueChange={onFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("common.filter")} />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 