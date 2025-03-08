"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Plus, Save, Trash2 } from "lucide-react"

interface InspectionItem {
  id: string
  description: string
  isRequired: boolean
  requiresPhoto: boolean
  requiresVoiceNote: boolean
}

interface InspectionSection {
  id: string
  title: string
  items: InspectionItem[]
}

interface InspectionTemplate {
  id: string
  name: string
  description: string
  sections: InspectionSection[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export function TemplateManager() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<InspectionTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<InspectionTemplate | null>(null)

  const handleAddSection = () => {
    if (!currentTemplate) return

    const newSection: InspectionSection = {
      id: Date.now().toString(),
      title: "inspections.templates.newSection",
      items: [],
    }

    setCurrentTemplate({
      ...currentTemplate,
      sections: [...currentTemplate.sections, newSection],
    })
  }

  const handleAddItem = (sectionId: string) => {
    if (!currentTemplate) return

    const newItem: InspectionItem = {
      id: Date.now().toString(),
      description: "",
      isRequired: true,
      requiresPhoto: false,
      requiresVoiceNote: false,
    }

    setCurrentTemplate({
      ...currentTemplate,
      sections: currentTemplate.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: [...section.items, newItem],
          }
        }
        return section
      }),
    })
  }

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return

    try {
      // Here you would normally save to your backend
      setTemplates([...templates, currentTemplate])
      toast({
        title: "common.success",
        description: "inspections.templates.saved",
      })
    } catch (error) {
      toast({
        title: "errors.error",
        description: "errors.somethingWentWrong",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{"inspections.templates.title"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="templateName">{"inspections.templates.name"}</Label>
                <Input
                  id="templateName"
                  value={currentTemplate?.name || ""}
                  onChange={(e) => setCurrentTemplate(curr => curr ? {
                    ...curr,
                    name: e.target.value,
                  } : null)}
                />
              </div>
              <div>
                <Label htmlFor="templateDescription">{"inspections.templates.description"}</Label>
                <Input
                  id="templateDescription"
                  value={currentTemplate?.description || ""}
                  onChange={(e) => setCurrentTemplate(curr => curr ? {
                    ...curr,
                    description: e.target.value,
                  } : null)}
                />
              </div>
            </div>

            {currentTemplate?.sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <Input
                    value={section.title}
                    onChange={(e) => setCurrentTemplate(curr => curr ? {
                      ...curr,
                      sections: curr.sections.map(s => 
                        s.id === section.id ? { ...s, title: e.target.value } : s
                      ),
                    } : null)}
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div key={item.id} className="grid gap-2">
                        <Input
                          value={item.description}
                          onChange={(e) => setCurrentTemplate(curr => curr ? {
                            ...curr,
                            sections: curr.sections.map(s => 
                              s.id === section.id ? {
                                ...s,
                                items: s.items.map(i => 
                                  i.id === item.id ? { ...i, description: e.target.value } : i
                                ),
                              } : s
                            ),
                          } : null)}
                        />
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`required-${item.id}`}
                              checked={item.isRequired}
                              onCheckedChange={(checked) => setCurrentTemplate(curr => curr ? {
                                ...curr,
                                sections: curr.sections.map(s => 
                                  s.id === section.id ? {
                                    ...s,
                                    items: s.items.map(i => 
                                      i.id === item.id ? { ...i, isRequired: checked as boolean } : i
                                    ),
                                  } : s
                                ),
                              } : null)}
                            />
                            <Label htmlFor={`required-${item.id}`}>
                              {"inspections.templates.required"}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`photo-${item.id}`}
                              checked={item.requiresPhoto}
                              onCheckedChange={(checked) => setCurrentTemplate(curr => curr ? {
                                ...curr,
                                sections: curr.sections.map(s => 
                                  s.id === section.id ? {
                                    ...s,
                                    items: s.items.map(i => 
                                      i.id === item.id ? { ...i, requiresPhoto: checked as boolean } : i
                                    ),
                                  } : s
                                ),
                              } : null)}
                            />
                            <Label htmlFor={`photo-${item.id}`}>
                              {"inspections.templates.requirePhoto"}
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddItem(section.id)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {"inspections.templates.addItem"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleAddSection}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {"inspections.templates.addSection"}
              </Button>
              <Button
                onClick={handleSaveTemplate}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {"inspections.templates.save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 