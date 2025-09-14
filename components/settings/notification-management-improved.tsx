"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { generateEmailHeader, generateEmailFooter, generateEmailTemplate } from '@/lib/email/email-partials';
import { Plus, Edit, Trash2, Mail, Bell, Settings, Eye, Copy, Send, FileText, Calendar, CreditCard, Wrench, Globe, Download, RefreshCw, Code, Palette, Clock, ChevronLeft, ChevronRight, MoreHorizontal, Grid, List } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function NotificationManagementImproved() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<'japan' | 'thailand'>('thailand');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ja'>('en');
  
  // Modal-specific team and language states for preview
  const [modalTeam, setModalTeam] = useState<'japan' | 'thailand'>('thailand');
  const [modalLanguage, setModalLanguage] = useState<'en' | 'ja'>('en');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [populatingTemplates, setPopulatingTemplates] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState<EmailTemplate | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [contentMode, setContentMode] = useState<'html' | 'text'>('html');
  const [previewScale, setPreviewScale] = useState(0.8);
  const [modalPreviewScale, setModalPreviewScale] = useState(0.8);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Process language conditionals in template content
  const processLanguageConditionals = (content: string, language: 'en' | 'ja'): string => {
    // Replace {{language == "ja" ? "Japanese text" : "English text"}} patterns
    return content.replace(/\{\{language\s*==\s*"ja"\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\}\}/g, (match, japaneseText, englishText) => {
      return language === 'ja' ? japaneseText : englishText;
    });
  };

  // Generate preview content with sample data
  const generatePreviewContent = (template: EmailTemplate, team: 'japan' | 'thailand' = selectedTeam, language: 'en' | 'ja' = selectedLanguage) => {
    try {
      const sampleData = {
        customer_name: 'John Doe',
        quotation_id: 'Q-2024-001',
        company_name: team === 'japan' ? 'Driver Japan' : 'Driver Thailand',
        greeting_text: 'Thank you for your interest in our services.',
        service_type: 'Airport Transfer',
        vehicle_type: 'Toyota Alphard',
        duration_hours: 2,
        service_days: 1,
        hours_per_day: 8,
        service_total: 15000,
        final_total: 15000,
        subtotal: 15000,
        tax_amount: 0,
        tax_percentage: 0,
        regular_discount: 0,
        discount_percentage: 0,
        promotion_discount: 0,
        selected_promotion_name: '',
        selected_package: null,
        quotation_items: [
          {
            description: 'Airport Transfer Service',
            vehicle_type: 'Toyota Alphard',
            total_price: 15000,
            service_days: 1,
            hours_per_day: 8
          }
        ],
        magic_link: 'https://example.com/quote/123',
        primary_color: '#E03E2D',
        from_name: team === 'japan' ? 'Driver Japan Team' : 'Driver Thailand Team',
        quotation_title: 'Airport Transfer Service',
        total_amount: '15,000',
        currency: team === 'japan' ? 'JPY' : 'THB',
        approval_date: '2024-09-13',
        approval_notes: 'All requirements have been reviewed and approved.',
        formatCurrency: (amount: number) => {
          const symbol = team === 'japan' ? '¥' : '฿';
          return `${symbol}${amount.toLocaleString()}`;
        }
      };

      // Process the template content to handle language conditionals
      const processedContent = processLanguageConditionals(template.html_content, language);
      const processedSubject = processLanguageConditionals(template.subject, language);

      // Use the generateEmailTemplate function from email-partials to create full email
      return generateEmailTemplate({
        customerName: sampleData.customer_name,
        language: language,
        team: team,
        logoUrl: 'https://japandriver.com/img/driver-invoice-logo.png',
        title: processedSubject.replace(/\{\{[^}]+\}\}/g, sampleData.company_name),
        subtitle: template.name,
        content: processedContent
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      return template.html_content;
    }
  };

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
  });

  const categories = [
    { value: 'all', label: 'All Templates', icon: FileText, color: 'text-gray-500' },
    { value: 'booking', label: 'Bookings', icon: Calendar, color: 'text-blue-500' },
    { value: 'quotation', label: 'Quotations', icon: FileText, color: 'text-green-500' },
    { value: 'payment', label: 'Payments', icon: CreditCard, color: 'text-purple-500' },
    { value: 'invoice', label: 'Invoices', icon: FileText, color: 'text-orange-500' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-red-500' },
    { value: 'system', label: 'System Alerts', icon: Bell, color: 'text-yellow-500' },
  ];

  // Load templates from database
  useEffect(() => {
    loadTemplates();
  }, []);

  // Update preview when HTML content changes (with debounce)
  useEffect(() => {
    if (isTemplateDialogOpen && templateForm.html_content) {
      const timeoutId = setTimeout(() => {
        setPreviewKey(prev => prev + 1);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [templateForm.html_content, isTemplateDialogOpen]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/notification-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };


  const createQuotationSentTemplate = async () => {
    setPopulatingTemplates(true);
    try {
      const response = await fetch('/api/admin/notification-templates/create-quotation-sent', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: 'Quotation Sent template created successfully! 🎯'
        });
        await loadTemplates();
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create Quotation Sent template',
        variant: 'destructive'
      });
    } finally {
      setPopulatingTemplates(false);
    }
  };

  const createQuotationApprovedTemplate = async () => {
    setPopulatingTemplates(true);
    try {
      const response = await fetch('/api/admin/notification-templates/create-quotation-approved', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: 'Quotation Approved template created successfully! 🎯'
        });
        await loadTemplates();
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create Quotation Approved template',
        variant: 'destructive'
      });
    } finally {
      setPopulatingTemplates(false);
    }
  };


  // Filter templates based on selected category and search query
  const filteredTemplates = templates.filter(template => {
    if (selectedCategory && selectedCategory !== 'all' && template.category !== selectedCategory) return false;
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !template.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

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
    });
    setEditingTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const url = editingTemplate
        ? `/api/admin/notification-templates/${editingTemplate.id}`
        : '/api/admin/notification-templates';

      // Save only the content-only HTML (no header/footer)
      const payload = editingTemplate 
        ? { 
            id: editingTemplate.id, 
            ...templateForm
            // html_content is already content-only from templateForm
          }
        : {
            ...templateForm
            // html_content is already content-only from templateForm
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save template');

      await loadTemplates();
      setIsTemplateDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully. Changes will be applied to all future emails.`
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setTemplateForm({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject,
      html_content: template.html_content, // Already content-only from database
      text_content: template.text_content,
      variables: template.variables,
      is_active: template.is_active,
      is_default: template.is_default
    });
    setEditingTemplate(template);
    // Reset modal states to current global states
    setModalTeam(selectedTeam);
    setModalLanguage(selectedLanguage);
    setIsTemplateDialogOpen(true);
  };

  const handleToggleActive = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId, is_active: !template.is_active })
      });

      if (!response.ok) throw new Error('Failed to toggle template');

      await loadTemplates();
      toast({
        title: 'Success',
        description: `Template ${template.is_active ? 'deactivated' : 'activated'}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete template');

      await loadTemplates();
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    // Reset modal states to current global states
    setModalTeam(selectedTeam);
    setModalLanguage(selectedLanguage);
  };

  const handleTestSend = (template: EmailTemplate) => {
    setSendingTemplate(template);
    setSendEmail('test@japandriver.com');
    setIsSendDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!sendingTemplate || !sendEmail) return;

    try {
      // Use the new template service for consistent email sending
      const testVariables = {
        customer_name: 'Test Customer',
        quotation_id: 'QUO-TEST-001',
        booking_id: 'BOO-TEST-001',
        service_name: 'Airport Transfer',
        booking_date: '2024-12-25',
        booking_time: '10:00',
        pickup_location: 'Narita Airport (NRT)',
        dropoff_location: 'Shinjuku, Tokyo',
        driver_name: 'Test Driver',
        driver_phone: '090-1234-5678',
        vehicle_type: 'Toyota Alphard',
        license_plate: 'ABC-123',
        calendar_link: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
        magic_link: 'https://example.com/test-link',
        quotation_url: 'https://example.com/quotation/test',
        total_amount: '¥15,000',
        payment_date: '2024-12-25',
        hours_until_trip: 2,
        notes: 'Test notes for approval'
      };

      const response = await fetch('/api/email/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: sendingTemplate.name,
          to: sendEmail,
          variables: testVariables,
          team: selectedTeam,
          language: selectedLanguage,
          bcc: ['booking@japandriver.com']
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to send test email: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Test "${sendingTemplate.name}" email sent successfully to ${sendEmail} (ID: ${result.messageId})`
      });

      setIsSendDialogOpen(false);
      setSendingTemplate(null);
      setSendEmail('');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: `Failed to send test "${sendingTemplate.name}" email: ${(error as Error).message}`,
        variant: 'destructive'
      });
    }
  };

  const getTemplateIcon = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData?.icon || Mail;
  };

  const getTemplateColor = (category: string) => {
    switch (category) {
      case 'quotation':
        return 'text-blue-500';
      case 'booking':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const copyTemplateCode = async (template: EmailTemplate) => {
    try {
      await navigator.clipboard.writeText(template.html_content);
      toast({
        title: 'Copied!',
        description: 'Template HTML code copied to clipboard'
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div className="border-b border-border pb-3 sm:pb-4 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">Email Template Management</h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
            Manage your fleet management email templates and notifications with team-specific settings
          </p>
        </div>
      </div>


      {/* Search and Controls Bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-4">
            {/* Search Section - Full Width on Mobile */}
            <div className="w-full">
              <Label htmlFor="search" className="text-sm font-medium">Search Templates</Label>
              <Input
                id="search"
                placeholder="Search by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1 w-full"
              />
            </div>

            {/* Filters and Controls - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Category Filter */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="category-filter" className="text-sm">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
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

              {/* Language Filter */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="language-filter" className="text-sm">Language</Label>
                <Select value={selectedLanguage} onValueChange={(value: 'en' | 'ja') => setSelectedLanguage(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        English
                      </div>
                    </SelectItem>
                    <SelectItem value="ja">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        日本語
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team Filter */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="team-filter" className="text-sm">Team</Label>
                <Select value={selectedTeam} onValueChange={(value: 'japan' | 'thailand') => setSelectedTeam(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thailand">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">TH</span>
                        </div>
                        Thailand
                      </div>
                    </SelectItem>
                    <SelectItem value="japan">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">JP</span>
                        </div>
                        Japan
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Items Per Page */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="items-per-page" className="text-sm">Per page</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">View</Label>
                <div className="flex border rounded-lg w-full">
                  <button 
                    className={`flex items-center justify-center gap-2 px-2 py-2 text-sm rounded-l-lg border-r flex-1 ${
                      viewMode === "list" 
                        ? "bg-background text-foreground" 
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setViewMode("list")}
                    title="List view"
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center gap-2 px-2 py-2 text-sm rounded-r-lg flex-1 ${
                      viewMode === "grid" 
                        ? "bg-background text-foreground" 
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setViewMode("grid")}
                    title="Cards view"
                    aria-label="Cards view"
                  >
                    <Grid className="h-4 w-4" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid/List */}
      <div className="space-y-4">

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
                No email templates match your current filter. Create new templates using the buttons above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4' : 'space-y-3'}>
            {paginatedTemplates.map((template) => {
            const IconComponent = getTemplateIcon(template.category);
            const colorClass = getTemplateColor(template.category);
            const variables = template.variables ? Object.keys(template.variables) : [];
            
            return (
              <Card key={template.id} className={`transition-all hover:shadow-md ${!template.is_active ? 'opacity-60' : ''} ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
                {viewMode === 'grid' ? (
                  <>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className={`h-5 w-5 ${colorClass}`} />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate">{template.name}</CardTitle>
                            <CardDescription className="line-clamp-1 text-xs">{template.subject}</CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className={`text-xs ${
                            template.category === 'quotation' 
                              ? "text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                              : template.category === 'booking'
                              ? "text-purple-800 border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700"
                              : "text-gray-800 border-gray-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                          }`}>
                            {template.category}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${template.is_active ? "text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700" : "text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"}`}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 p-3 sm:p-6">
                      <div className="space-y-4">
                        {/* Email Preview */}
                        <div>
                          <Label className="text-sm font-medium">Email Preview</Label>
                          <div className="mt-1 bg-white border rounded-lg h-48 thumbnail-container" style={{ overflow: 'hidden', position: 'relative' }}>
                            {template.html_content ? (
                              <div style={{ 
                                width: '100%', 
                                height: '100%', 
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <iframe
                                  key={`thumbnail-${template.id}-${template.updated_at}-${selectedTeam}-${selectedLanguage}`}
                                  srcDoc={generatePreviewContent(template, selectedTeam, selectedLanguage)}
                                  className="border-0 thumbnail-iframe"
                                  title="Email Preview Thumbnail"
                                  sandbox="allow-same-origin"
                                  style={{
                                    transform: 'scale(0.6)',
                                    transformOrigin: 'top left',
                                    width: '166.67%',
                                    height: '166.67%',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    overflow: 'hidden'
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground text-sm">No preview available</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Variables */}
                        {variables.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Variables ({variables.length})</Label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {variables.slice(0, 4).map((variable) => (
                                <Badge key={variable} variant="outline" className="text-xs">
                                  {`{{${variable}}}`}
                                </Badge>
                              ))}
                              {variables.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{variables.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Enable Toggle - Moved to top right */}
                        <div className="flex justify-end">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={template.is_active}
                              onCheckedChange={() => handleToggleActive(template.id)}
                              className="scale-90"
                            />
                            <Label className="text-xs font-medium">Enable</Label>
                          </div>
                        </div>
                        
                        {/* Action Buttons - 50/50 in 2 rows for mobile/tablet */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(template)}
                            className="h-9 flex items-center justify-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-xs">Preview</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(template)}
                            className="h-9 flex items-center justify-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="text-xs">Edit</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  // List View
                  <>
                    <CardContent className="flex-1 p-3 sm:p-4">
                      <div className="space-y-3">
                        {/* Header with icon, title, and enable toggle */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <IconComponent className={`h-5 w-5 ${colorClass} flex-shrink-0`} />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium truncate">{template.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Switch
                              checked={template.is_active}
                              onCheckedChange={() => handleToggleActive(template.id)}
                              className="scale-90"
                            />
                            <span className="text-xs text-muted-foreground hidden sm:inline">Enable</span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={`text-xs ${
                            template.category === 'quotation' 
                              ? "text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                              : template.category === 'booking'
                              ? "text-purple-800 border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700"
                              : "text-gray-800 border-gray-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                          }`}>
                            {template.category}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${template.is_active ? "text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700" : "text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"}`}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {/* Variables */}
                        {variables.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {variables.slice(0, 3).map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                            {variables.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{variables.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Action Buttons - 50/50 for mobile/tablet */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(template)}
                            className="h-9 flex items-center justify-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-xs">Preview</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(template)}
                            className="h-9 flex items-center justify-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="text-xs">Edit</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredTemplates.length)} of {filteredTemplates.length} templates</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="h-8 w-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Template: {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Full template preview with HTML rendering and source code
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Template Information</h3>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <Badge variant="outline" className={`text-xs ${
                      previewTemplate?.category === 'quotation' 
                        ? "text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                        : previewTemplate?.category === 'booking'
                        ? "text-purple-800 border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700"
                        : "text-gray-800 border-gray-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                    }`}>
                      {previewTemplate?.category}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${previewTemplate?.is_active ? "text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700" : "text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"}`}>
                      {previewTemplate?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last updated: {previewTemplate?.updated_at ? new Date(previewTemplate.updated_at).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                {/* Template Details Group */}
                <div className="bg-muted/30 rounded-lg p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Template Name</Label>
                    <div className="text-sm bg-background p-3 rounded border font-medium">
                      {previewTemplate?.name}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subject Line</Label>
                    <div className="text-sm bg-background p-3 rounded border font-medium">
                      {previewTemplate?.subject}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content & Preview Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Content & Preview</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Editor - Left Side */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {contentMode === 'html' ? 'HTML Content' : 'Plain Text Content'}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Content Mode:</Label>
                        <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
                          <button
                            onClick={() => setContentMode('html')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              contentMode === 'html' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            HTML
                          </button>
                          <button
                            onClick={() => setContentMode('text')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              contentMode === 'text' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Plain Text
                          </button>
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="h-[500px] w-full border rounded-lg p-4 bg-muted/20">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {contentMode === 'html' 
                          ? (previewTemplate?.html_content || 'No HTML content')
                          : (previewTemplate?.text_content || 'No text content')
                        }
                      </pre>
                    </ScrollArea>
                    <p className="text-sm text-muted-foreground">
                      {contentMode === 'html' 
                        ? 'This is the main email content. Use HTML tags and Handlebars variables.'
                        : 'Fallback content for email clients that don\'t support HTML.'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Live Preview - Right Side */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium">Live Preview</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Team:</Label>
                        <Select value={modalTeam} onValueChange={(value: 'japan' | 'thailand') => setModalTeam(value)}>
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="thailand">TH</SelectItem>
                            <SelectItem value="japan">JP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Lang:</Label>
                        <Select value={modalLanguage} onValueChange={(value: 'en' | 'ja') => setModalLanguage(value)}>
                          <SelectTrigger className="w-16 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">EN</SelectItem>
                            <SelectItem value="ja">JA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Scale:</Label>
                        <div className="flex items-center space-x-1 bg-muted rounded-md p-1">
                          <button
                            onClick={() => setModalPreviewScale(Math.max(0.5, modalPreviewScale - 0.1))}
                            className="px-2 py-1 rounded text-xs hover:bg-background transition-colors"
                            title="Zoom Out"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 text-xs font-medium min-w-[3rem] text-center">
                            {Math.round(modalPreviewScale * 100)}%
                          </span>
                          <button
                            onClick={() => setModalPreviewScale(Math.min(1.2, modalPreviewScale + 0.1))}
                            className="px-2 py-1 rounded text-xs hover:bg-background transition-colors"
                            title="Zoom In"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border rounded-lg overflow-hidden h-[500px] relative">
                    {previewTemplate?.html_content ? (
                      <iframe
                        key={`modal-preview-${previewTemplate.id}-${previewTemplate.updated_at}-${modalTeam}-${modalLanguage}`}
                        srcDoc={generatePreviewContent(previewTemplate, modalTeam, modalLanguage)}
                        className="w-full h-full border-0"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                        style={{
                          transform: `scale(${modalPreviewScale})`,
                          transformOrigin: 'top left',
                          width: `${100 / modalPreviewScale}%`,
                          height: `${100 / modalPreviewScale}%`
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                          <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                            <Eye className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground">No HTML content</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                const template = previewTemplate!;
                setPreviewTemplate(null);
                // Use setTimeout to ensure the preview modal closes before opening edit dialog
                setTimeout(() => {
                  handleEdit(template);
                }, 100);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
              <Button onClick={() => {
                const template = previewTemplate!;
                setPreviewTemplate(null);
                // Use setTimeout to ensure the preview modal closes before opening send dialog
                setTimeout(() => {
                  handleTestSend(template);
                }, 100);
              }}>
                <Send className="h-4 w-4 mr-2" />
                Test Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Modify the template content and settings' : 'Create a new email template for your fleet management system'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <Badge variant="outline" className={`text-xs ${
                      templateForm.category === 'quotation' 
                        ? "text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                        : templateForm.category === 'booking'
                        ? "text-purple-800 border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700"
                        : "text-gray-800 border-gray-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                    }`}>
                      {templateForm.category}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${templateForm.is_active ? "text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700" : "text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"}`}>
                      {templateForm.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last updated: {editingTemplate?.updated_at ? new Date(editingTemplate.updated_at).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                
                {/* Template Details Group */}
                <div className="bg-muted/30 rounded-lg p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="template-name" className="text-sm font-medium">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="Enter template name"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-subject" className="text-sm font-medium">Subject Line</Label>
                    <Input
                      id="template-subject"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      placeholder="Enter email subject"
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use variables like {`{{customer_name}}`} for dynamic content
                    </p>
                  </div>
                </div>
                
                {/* Template Settings Group */}
                <div className="bg-muted/30 rounded-lg p-6">
                  <h4 className="text-sm font-semibold mb-4 text-foreground">Template Settings</h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="template-category" className="text-sm font-medium">Category</Label>
                      <Select value={templateForm.category} onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                      <div className="space-y-1">
                        <Label htmlFor="template-active" className="text-sm font-medium">Active Template</Label>
                        <p className="text-xs text-muted-foreground">Enable this template for sending emails</p>
                      </div>
                      <Switch
                        id="template-active"
                        checked={templateForm.is_active}
                        onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                      <div className="space-y-1">
                        <Label htmlFor="template-default" className="text-sm font-medium">Default Template</Label>
                        <p className="text-xs text-muted-foreground">Use as fallback when specific templates are not found</p>
                      </div>
                      <Switch
                        id="template-default"
                        checked={templateForm.is_default}
                        onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_default: checked })}
                      />
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content & Preview Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Content & Preview</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Editor - Left Side */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="template-content">
                        {contentMode === 'html' ? 'HTML Content' : 'Plain Text Content'}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Content Mode:</Label>
                        <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
                          <button
                            onClick={() => setContentMode('html')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              contentMode === 'html' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            HTML
                          </button>
                          <button
                            onClick={() => setContentMode('text')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              contentMode === 'text' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Plain Text
                          </button>
                        </div>
                      </div>
                    </div>
                    <Textarea
                      id="template-content"
                      value={contentMode === 'html' ? templateForm.html_content : templateForm.text_content}
                      onChange={(e) => setTemplateForm({ 
                        ...templateForm, 
                        [contentMode === 'html' ? 'html_content' : 'text_content']: e.target.value 
                      })}
                      placeholder={contentMode === 'html' ? 'Enter HTML content' : 'Enter plain text content'}
                      className="min-h-[500px] font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      {contentMode === 'html' 
                        ? 'This is the main email content. Use HTML tags and Handlebars variables.'
                        : 'Fallback content for email clients that don\'t support HTML.'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Live Preview - Right Side */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium">Live Preview</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Team:</Label>
                        <Select value={modalTeam} onValueChange={(value: 'japan' | 'thailand') => setModalTeam(value)}>
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="thailand">TH</SelectItem>
                            <SelectItem value="japan">JP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Lang:</Label>
                        <Select value={modalLanguage} onValueChange={(value: 'en' | 'ja') => setModalLanguage(value)}>
                          <SelectTrigger className="w-16 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">EN</SelectItem>
                            <SelectItem value="ja">JA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Scale:</Label>
                        <div className="flex items-center space-x-1 bg-muted rounded-md p-1">
                          <button
                            onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.1))}
                            className="px-2 py-1 rounded text-xs hover:bg-background transition-colors"
                            title="Zoom Out"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 text-xs font-medium min-w-[3rem] text-center">
                            {Math.round(previewScale * 100)}%
                          </span>
                          <button
                            onClick={() => setPreviewScale(Math.min(1.2, previewScale + 0.1))}
                            className="px-2 py-1 rounded text-xs hover:bg-background transition-colors"
                            title="Zoom In"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border rounded-lg overflow-hidden h-[500px] relative">
                    {templateForm.html_content ? (
                      <iframe
                        key={`edit-preview-${editingTemplate?.id || 'preview'}-${modalTeam}-${modalLanguage}`}
                        srcDoc={generatePreviewContent({
                          ...templateForm,
                          id: editingTemplate?.id || 'preview',
                          variables: editingTemplate?.variables || {},
                          created_at: editingTemplate?.created_at || new Date().toISOString(),
                          updated_at: editingTemplate?.updated_at || new Date().toISOString()
                        }, modalTeam, modalLanguage)}
                        className="w-full h-full border-0"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                        style={{ 
                          transform: `scale(${previewScale})`,
                          transformOrigin: 'top left',
                          width: `${100 / previewScale}%`,
                          height: `${100 / previewScale}%`
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                          <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                            <Eye className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground">Enter HTML content to see live preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={(e) => handleSubmit(e)}>
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Modal */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email for "{sendingTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="send-email">Recipient Email</Label>
              <Input
                id="send-email"
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>This will send a test email with sample data to the specified recipient.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={!sendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
