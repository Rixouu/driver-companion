"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import { 
  FileText,
  Mail,
  MessageSquare,
  CalendarPlus,
  Eye
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms'
  subject?: string
  body: string
  variables: string[]
}

interface NotificationPreviewProps {
  template: NotificationTemplate
  data: {
    vehicleName: string
    date: Date
    time: string
    location?: string
    inspector?: string
  }
}

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: "1",
    name: "Default Email Reminder",
    type: "email",
    subject: "Upcoming Vehicle Inspection - {vehicleName}",
    body: "Dear Inspector,\n\nThis is a reminder about the upcoming vehicle inspection:\n\nVehicle: {vehicleName}\nDate: {date}\nTime: {time}\n\nPlease ensure you arrive on time.\n\nBest regards,\nVehicle Management System",
    variables: ['vehicleName', 'date', 'time'],
  },
  {
    id: "2",
    name: "Default SMS Reminder",
    type: "sms",
    body: "Reminder: Vehicle inspection for {vehicleName} scheduled for {date} at {time}.",
    variables: ['vehicleName', 'date', 'time'],
  },
]

function NotificationPreview({ template, data }: NotificationPreviewProps) {
  const replacePlaceholders = (text: string) => {
    return text
      .replace('{vehicleName}', data.vehicleName)
      .replace('{date}', new Date(data.date).toLocaleDateString())
      .replace('{time}', data.time)
      .replace('{location}', data.location || '')
      .replace('{inspector}', data.inspector || '')
  }

  return (
    <div className="space-y-4">
      {template.type === 'email' && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Subject:</p>
            <p className="text-sm">{replacePlaceholders(template.subject || '')}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Body:</p>
            <div className="whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm">
              {replacePlaceholders(template.body)}
            </div>
          </div>
        </>
      )}
      {template.type === 'sms' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Message:</p>
          <div className="whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm">
            {replacePlaceholders(template.body)}
          </div>
        </div>
      )}
    </div>
  )
}

interface NotificationTemplatesProps {
  onSelectTemplate: (template: NotificationTemplate) => void
  previewData: {
    vehicleName: string
    date: Date
    time: string
    location?: string
    inspector?: string
  }
}

export function NotificationTemplates({ onSelectTemplate, previewData }: NotificationTemplatesProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate>()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTemplate, setEditedTemplate] = useState<NotificationTemplate>()
  const [showPreview, setShowPreview] = useState(false)

  const handleSaveTemplate = () => {
    if (!editedTemplate) return

    if (editedTemplate.id) {
      setTemplates(prev => prev.map(t => 
        t.id === editedTemplate.id ? editedTemplate : t
      ))
    } else {
      setTemplates(prev => [...prev, {
        ...editedTemplate,
        id: Date.now().toString(),
      }])
    }

    setIsEditing(false)
    toast({
      title: t("common.success"),
      description: t("inspections.schedule.notifications.templateSaved"),
    })
  }

  const handleAddToCalendar = async () => {
    try {
      const calendarEvent = generateICSFile({
        title: `Vehicle Inspection - ${previewData.vehicleName}`,
        start: previewData.date,
        duration: { hours: 1 },
        description: selectedTemplate?.body || '',
      })

      // Create a Blob and download link
      const blob = new Blob([calendarEvent], { type: 'text/calendar' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'inspection.ics')
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({
        title: t("common.success"),
        description: t("inspections.schedule.notifications.calendarAdded"),
      })
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("inspections.schedule.notifications.calendarError"),
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("inspections.schedule.notifications.templates")}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditedTemplate({
                id: '',
                name: '',
                type: 'email',
                subject: '',
                body: '',
                variables: [],
              })
              setIsEditing(true)
            }}
          >
            {t("inspections.schedule.notifications.newTemplate")}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{template.name}</span>
                  <div className="flex gap-2">
                    {template.type === 'email' ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        onSelectTemplate(template)
                      }}
                    >
                      {t("common.select")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowPreview(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t("common.preview")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddToCalendar}
                    >
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      {t("inspections.schedule.notifications.addToCalendar")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editedTemplate?.id
                  ? t("inspections.schedule.notifications.editTemplate")
                  : t("inspections.schedule.notifications.newTemplate")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("common.name")}</Label>
                <Input
                  value={editedTemplate?.name || ''}
                  onChange={(e) => setEditedTemplate(prev => ({
                    ...prev!,
                    name: e.target.value,
                  }))}
                />
              </div>
              {editedTemplate?.type === 'email' && (
                <div className="space-y-2">
                  <Label>{t("common.subject")}</Label>
                  <Input
                    value={editedTemplate?.subject || ''}
                    onChange={(e) => setEditedTemplate(prev => ({
                      ...prev!,
                      subject: e.target.value,
                    }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("common.content")}</Label>
                <Textarea
                  value={editedTemplate?.body || ''}
                  onChange={(e) => setEditedTemplate(prev => ({
                    ...prev!,
                    body: e.target.value,
                  }))}
                  rows={6}
                />
              </div>
              <Button onClick={handleSaveTemplate}>
                {t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("inspections.schedule.notifications.preview")}</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <NotificationPreview
                template={selectedTemplate}
                data={previewData}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function generateICSFile({ title, start, duration, description }: {
  title: string
  start: Date
  duration: { hours: number }
  description: string
}) {
  const end = new Date(start.getTime() + duration.hours * 60 * 60 * 1000)
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
} 