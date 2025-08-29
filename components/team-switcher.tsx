'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, MapPin } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useToast } from '@/components/ui/use-toast'
import { getStatusBadgeClasses } from '@/lib/utils/styles'

interface TeamSwitcherProps {
  currentTeam: 'japan' | 'thailand'
  onTeamChange: (team: 'japan' | 'thailand') => void
  className?: string
}

export function TeamSwitcher({ currentTeam, onTeamChange, className = '' }: TeamSwitcherProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const teams = [
    {
      id: 'thailand',
      name: t('TeamSwitcher.thailand'),
      shortName: t('TeamSwitcher.thailandShort'),
      flag: '🇹🇭',
      description: t('TeamSwitcher.thailandDescription')
    },
    {
      id: 'japan',
      name: t('TeamSwitcher.japan'),
      shortName: t('TeamSwitcher.japanShort'),
      flag: '🇯🇵',
      description: t('TeamSwitcher.japanDescription')
    }
  ]

  const currentTeamData = teams.find(team => team.id === currentTeam)

  const handleTeamChange = (team: 'japan' | 'thailand') => {
    if (team !== currentTeam) {
      onTeamChange(team)
      const teamName = team === 'japan' ? 'Japan' : 'Thailand'
      toast({
        title: `Team ${teamName} Selected`,
        description: `Switched to ${teamName} team settings`,
        duration: 3000,
      })
    }
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 bg-background/80 backdrop-blur-sm border-border hover:bg-background hover:border-border/60 transition-all duration-200"
      >
        <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="mr-2">{currentTeamData?.flag}</span>
        <span className="font-medium text-foreground">{currentTeamData?.shortName}</span>
        <MapPin className="w-4 h-4 ml-2 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-background rounded-lg shadow-lg border border-border z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {t('TeamSwitcher.selectTeam')}
            </h3>
            
            <div className="space-y-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamChange(team.id as 'japan' | 'thailand')}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 text-left hover:shadow-sm relative ${
                    currentTeam === team.id
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-border hover:border-border/60 hover:bg-muted/50'
                  }`}
                >
                  {/* Active label positioned at top-right corner with exact vehicle list styling */}
                  {currentTeam === team.id && (
                    <div className="absolute top-2 right-2">
                      <Badge className={`text-xs font-medium px-2.5 py-1 ${getStatusBadgeClasses('active')}`}>
                        Active
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{team.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
