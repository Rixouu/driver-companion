import { NextRequest, NextResponse } from 'next/server'
import { unifiedEmailService } from '@/lib/services/unified-email-service'

// =============================================================================
// EMAIL TEMPLATE MANAGEMENT API - Clean Interface
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const name = searchParams.get('name')

    console.log(`🔄 [TEMPLATE-API] Fetching templates - category: ${category}, type: ${type}, name: ${name}`)

    let templates

    if (name) {
      // Get specific template
      const template = await unifiedEmailService.getTemplate(name, category || undefined)
      templates = template ? [template] : []
    } else if (category) {
      // Get templates by category
      templates = await unifiedEmailService.getTemplatesByCategory(category)
    } else {
      // Get all templates
      const categories = ['quotation', 'booking', 'system', 'maintenance']
      const allTemplates = []
      
      for (const cat of categories) {
        const categoryTemplates = await unifiedEmailService.getTemplatesByCategory(cat)
        allTemplates.push(...categoryTemplates)
      }
      
      templates = allTemplates
    }

    // Filter by type if specified
    if (type) {
      templates = templates.filter(t => t.type === type)
    }

    console.log(`✅ [TEMPLATE-API] Found ${templates.length} templates`)

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    })

  } catch (error) {
    console.error('❌ [TEMPLATE-API] Error fetching templates:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch templates' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, templateName, category, variables } = body

    console.log(`🔄 [TEMPLATE-API] Template action: ${action} - ${templateName}`)

    switch (action) {
      case 'test':
        // Test template rendering
        if (!templateName || !variables) {
          return NextResponse.json({ error: 'Template name and variables are required for testing' }, { status: 400 })
        }

        const template = await unifiedEmailService.getTemplate(templateName, category)
        if (!template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        const rendered = await unifiedEmailService.renderTemplate(template, variables)
        
        return NextResponse.json({
          success: true,
          rendered,
          template: {
            name: template.name,
            subject: template.subject
          }
        })

      case 'clear_cache':
        // Clear template cache
        unifiedEmailService.clearCache()
        
        return NextResponse.json({
          success: true,
          message: 'Template cache cleared'
        })

      case 'cache_stats':
        // Get cache statistics
        const stats = unifiedEmailService.getCacheStats()
        
        return NextResponse.json({
          success: true,
          cache: stats
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ [TEMPLATE-API] Error processing template action:', error)
    return NextResponse.json({ 
      error: 'Failed to process template action' 
    }, { status: 500 })
  }
}
