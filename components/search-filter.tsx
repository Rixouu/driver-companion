"use client"

import { Input } from "./ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select"

interface SearchFilterProps {
  onSearch: (value: string) => void
  onFilter: (value: string) => void
  filterOptions: { value: string; label: string }[]
}

export function SearchFilter({ onSearch, onFilter, filterOptions }: SearchFilterProps) {

  return (
    <div className="flex gap-4">
      <Input 
        placeholder={"common.search"} 
        onChange={(e) => onSearch(e.target.value)}
        className="max-w-[300px]"
      />
      <Select onValueChange={onFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={"common.filter"} />
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