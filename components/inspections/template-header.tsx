"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, XCircle, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface TemplateHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedSections: Set<string>
  onDeleteMultiple: () => void
  onCreateTemplate: () => void
  isSubmitting: boolean
}

export function TemplateHeader({
  searchQuery,
  setSearchQuery,
  selectedSections,
  onDeleteMultiple,
  onCreateTemplate,
  isSubmitting
}: TemplateHeaderProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('inspectionTemplates.searchTemplates')}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery("")}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {selectedSections.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onDeleteMultiple}
              disabled={isSubmitting}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('inspectionTemplates.sections.deleteSections', { count: selectedSections.size })}
              </span>
              <span className="sm:hidden">
                {t('common.delete')} ({selectedSections.size})
              </span>
            </Button>
          )}
          <Button 
            onClick={onCreateTemplate} 
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('inspectionTemplates.createTemplate')}</span>
            <span className="sm:hidden">{t('common.create')}</span>
          </Button>
        </div>
      </div>
    </div>
  )
} 