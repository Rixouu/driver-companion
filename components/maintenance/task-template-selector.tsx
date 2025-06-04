"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils/styles"
import { useI18n } from "@/lib/i18n/context"
import { getMaintenanceTaskTemplates, getMaintenanceTaskTemplateCategories } from "@/lib/services/maintenance-templates"
import type { MaintenanceTaskTemplate } from "@/lib/services/maintenance-templates"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface TaskTemplateSelectorProps {
  onSelect: (template: MaintenanceTaskTemplate) => void
}

export function TaskTemplateSelector({ onSelect }: TaskTemplateSelectorProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<MaintenanceTaskTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true)
      try {
        const fetchedTemplates = await getMaintenanceTaskTemplates()
        const fetchedCategories = await getMaintenanceTaskTemplateCategories()
        
        setTemplates(fetchedTemplates)
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Error loading maintenance task templates:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTemplates()
  }, [])

  const filteredTemplates = searchQuery
    ? templates.filter(template => 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : templates

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span>{t('maintenance.templates.selectTemplate')}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder={t('maintenance.templates.searchPlaceholder')} 
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="p-2 space-y-1">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ) : (
                t('maintenance.templates.noResults')
              )}
            </CommandEmpty>
            
            {categories.map(category => {
              const categoryTemplates = filteredTemplates.filter(
                template => template.category === category
              )
              
              if (categoryTemplates.length === 0) return null
              
              return (
                <CommandGroup key={category} heading={category}>
                  {categoryTemplates.map(template => (
                    <CommandItem
                      key={template.id}
                      value={template.id}
                      onSelect={() => {
                        onSelect(template)
                        setOpen(false)
                      }}
                      className="flex flex-col items-start py-3"
                    >
                      <div className="flex w-full justify-between items-center">
                        <span className="font-medium">{template.title}</span>
                        <Badge variant={getPriorityVariant(template.priority)}>
                          {t(`maintenance.priority.${template.priority}`)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 text-left">
                        {template.description}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {t('maintenance.fields.estimatedDuration')}: {template.estimated_duration} {t('maintenance.details.hours')}
                        </span>
                        <span>
                          {t('maintenance.fields.estimatedCost')}: ${template.estimated_cost}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
          <CommandSeparator />
          <div className="p-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setOpen(false)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('maintenance.templates.createCustomTask')}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'warning'
    case 'low':
      return 'secondary'
    default:
      return 'outline'
  }
} 