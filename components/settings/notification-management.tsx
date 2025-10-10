"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/context'
import { Plus, Edit, Trash2, Mail, Bell, Settings, Eye, Copy, Send, FileText, Calendar, CreditCard, Wrench } from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  type: string
  category: string
  subject: string
  html_content: string
  text_content: string
  variables: any
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export function NotificationManagement() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'email',
    category: 'booking',
    subject: '',
    html_content: '',
    text_content: '',
    variables: {},
    is_active: true,
    is_default: false
  })

  const categories = [
    { value: 'all', label: 'All Templates', icon: FileText },
    { value: 'booking', label: 'Bookings', icon: Calendar },
    { value: 'quotation', label: 'Quotations', icon: FileText },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench },
    { value: 'system', label: 'System Alerts', icon: Bell },
  ]

  // Load templates from database
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/notification-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory && selectedCategory !== 'all' && template.category !== selectedCategory) return false
    return true
  })

  const resetForm = () => {
    setTemplateForm({
      name: '',
      type: 'email',
      category: 'booking',
      subject: '',
      html_content: '',
      text_content: '',
      variables: {},
      is_active: true,
      is_default: false
    })
    setEditingTemplate(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingTemplate ? 'PUT' : 'POST'
      const url = editingTemplate 
        ? `/api/admin/notification-templates/${editingTemplate.id}` 
        : '/api/admin/notification-templates'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      })

      if (!response.ok) throw new Error('Failed to save template')

      await loadTemplates()
      setIsTemplateDialogOpen(false)
      resetForm()
      
      toast({
        title: 'Success',
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setTemplateForm({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables,
      is_active: template.is_active,
      is_default: template.is_default
    })
    setEditingTemplate(template)
    setIsTemplateDialogOpen(true)
  }

  const handleToggleActive = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) return

      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, is_active: !template.is_active })
      })

      if (!response.ok) throw new Error('Failed to toggle template')

      await loadTemplates()
      toast({
        title: 'Success',
        description: `Template ${template.is_active ? 'deactivated' : 'activated'}`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete template')

      await loadTemplates()
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      })
    }
  }

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template)
  }

  const handleTestSend = async (template: EmailTemplate) => {
    try {
      // Test sending based on template category
      let testEndpoint = ''
      let testData = {}
      
      switch (template.category) {
        case 'booking':
          testEndpoint = '/api/trip-reminders/test'
          testData = { booking_id: 'BOO-007' }
          break
        case 'quotation':
          testEndpoint = '/api/quotations/send-email-unified'
          testData = { quotation_id: 'QUO-001', email: 'test@example.com' }
          break
        default:
          throw new Error(`No test endpoint available for ${template.category}`)
      }

      const response = await fetch(testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      if (!response.ok) throw new Error('Failed to send test email')

      toast({
        title: 'Success',
        description: `Test ${template.name} email sent successfully`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to send test ${template.name} email`,
        variant: 'destructive'
      })
    }
  }

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'booking': return Calendar
      case 'quotation': return FileText
      case 'maintenance': return Wrench
      case 'system': return Bell
      default: return Mail
    }
  }

  const getTemplateColor = (category: string) => {
    switch (category) {
      case 'booking': return 'text-blue-500'
      case 'quotation': return 'text-green-500'
      case 'maintenance': return 'text-orange-500'
      case 'system': return 'text-purple-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Email Template Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your fleet management email templates and notifications
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="category-filter">Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All templates" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Template Button */}
      <div className="flex justify-end">
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
              <DialogDescription>
                Create or modify email templates for your fleet management system
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={templateForm.category}
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat.value !== 'all').map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject with {{variables}}"
                  required
                />
              </div>

              <Tabs defaultValue="html" className="w-full">
                <TabsList>
                  <TabsTrigger value="html">HTML Content</TabsTrigger>
                  <TabsTrigger value="text">Text Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="html" className="space-y-2">
                  <Label htmlFor="html_content">HTML Content</Label>
                  <Textarea
                    id="html_content"
                    value={templateForm.html_content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, html_content: e.target.value }))}
                    rows={12}
                    placeholder="HTML email template with {{variables}}"
                    className="font-mono text-sm"
                  />
                </TabsContent>
                
                <TabsContent value="text" className="space-y-2">
                  <Label htmlFor="text_content">Text Content</Label>
                  <Textarea
                    id="text_content"
                    value={templateForm.text_content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, text_content: e.target.value }))}
                    rows={12}
                    placeholder="Plain text version with {{variables}}"
                  />
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={templateForm.is_active}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={templateForm.is_default}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_default: checked }))}
                    />
                    <Label htmlFor="is_default">Default Template</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-muted-foreground">Loading templates...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No templates found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                No email templates match your current filter
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => {
            const IconComponent = getTemplateIcon(template.category)
            const colorClass = getTemplateColor(template.category)
            const variables = template.variables ? Object.keys(template.variables) : []
            
            return (
              <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${colorClass}`} />
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>{template.subject}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={template.is_default ? "default" : "secondary"}>
                        {template.is_default ? 'Default' : template.category}
                      </Badge>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">HTML Content (first 200 chars)</Label>
                      <p className="text-sm text-muted-foreground mt-1 bg-gray-50 p-2 rounded">
                        {template.html_content?.substring(0, 200)}...
                      </p>
                    </div>
                    
                    {variables.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Variables</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {variables.map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => handleToggleActive(template.id)}
                        />
                        <Label className="text-sm">Enable this template</Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Full
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestSend(template)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Test
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this template? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(template.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Template: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Full template content and details
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="html">HTML Source</TabsTrigger>
              <TabsTrigger value="text">Text Version</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <p className="text-sm bg-gray-50 p-2 rounded mt-1">{previewTemplate?.subject}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">HTML Preview</Label>
                <ScrollArea className="h-[400px] w-full border rounded-lg p-4 bg-white">
                  {previewTemplate?.html_content ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewTemplate.html_content) }} />
                  ) : (
                    <p className="text-muted-foreground">No HTML content</p>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="html" className="space-y-2">
              <Label className="text-sm font-medium">HTML Source Code</Label>
              <ScrollArea className="h-[500px] w-full border rounded-lg p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {previewTemplate?.html_content || 'No HTML content'}
                </pre>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="text" className="space-y-2">
              <Label className="text-sm font-medium">Plain Text Version</Label>
              <ScrollArea className="h-[500px] w-full border rounded-lg p-4">
                <pre className="text-sm whitespace-pre-wrap">
                  {previewTemplate?.text_content || 'No text content'}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex flex-wrap gap-1">
              {previewTemplate?.variables && Object.keys(previewTemplate.variables).map((variable) => (
                <Badge key={variable} variant="outline" className="text-xs">
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleEdit(previewTemplate!)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
              <Button onClick={() => handleTestSend(previewTemplate!)}>
                <Send className="h-4 w-4 mr-2" />
                Test Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
