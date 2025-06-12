import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Define a simple type for name translations
type TranslationObject = { 
  en?: string;
  ja?: string;
  [key: string]: string | undefined;
};

export async function POST(request: NextRequest) {
  try {
    const { sections }: { sections: { id: string; order: number }[] } = await request.json()
    
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty sections data' },
        { status: 400 }
      )
    }

    console.log(`[REORDER] Attempting to reorder ${sections.length} sections: `, 
      sections.map(s => `${s.id}:${s.order}`).join(', ')
    )

    const supabase = createServiceClient()
    
    // Get the section IDs from the request
    const sectionIds = sections.map(s => s.id)
    console.log(`[REORDER] Section IDs from request:`, sectionIds)
    
    // First, get all the sections that exist in the database
    const { data: existingSections, error: fetchError } = await supabase
      .from('inspection_categories')
      .select('id, type, order_number, name_translations')
      .in('id', sectionIds)
    
    if (fetchError) {
      console.error('[REORDER] Error fetching sections:', fetchError)
      throw fetchError
    }
    
    if (!existingSections || existingSections.length === 0) {
      console.error('[REORDER] None of the requested sections exist in the database')
      return NextResponse.json(
        { error: 'No requested sections found in database' },
        { status: 404 }
      )
    }
    
    console.log(`[REORDER] Found ${existingSections.length} of ${sectionIds.length} requested sections in database`)
    
    // Identify which sections were not found
    const existingSectionIds = existingSections.map(s => s.id)
    const missingIds = sectionIds.filter(id => !existingSectionIds.includes(id))
    
    if (missingIds.length > 0) {
      console.warn(`[REORDER] ${missingIds.length} sections not found in database:`, missingIds)
    }
    
    // Get the template type from the first existing section
    const templateType = existingSections[0].type
    console.log(`[REORDER] Template type: ${templateType}`)
    
    // Get all sections for this template type
    const { data: templateSections, error: templateError } = await supabase
      .from('inspection_categories')
      .select('id, type, order_number, name_translations')
      .eq('type', templateType)
    
    if (templateError) {
      console.error('[REORDER] Error getting template sections:', templateError)
      throw templateError
    }
    
    console.log(`[REORDER] Found ${templateSections?.length || 0} sections for template ${templateType}:`,
      templateSections?.map(s => {
        // Safely access the English name with proper type casting
        const nameTranslations = s.name_translations as TranslationObject || {};
        return `${s.id}:${s.order_number}:${nameTranslations.en || 'unknown'}`;
      }).join(', ') || 'None'
    )
    
    // Now update each section with its new order
    const updateResults = []
    for (const section of sections) {
      // Skip sections that don't exist
      if (!existingSectionIds.includes(section.id)) {
        console.warn(`[REORDER] Section ${section.id} not found in database, skipping update`)
        continue
      }
      
      const matchingSection = existingSections.find(s => s.id === section.id)
      if (!matchingSection) {
        console.warn(`[REORDER] Section ${section.id} found in database but not in fetched data, skipping update`)
        continue
      }
      
      // Safely access the English name with proper type casting
      const nameTranslations = matchingSection.name_translations as TranslationObject || {};
      console.log(`[REORDER] Updating section ${section.id} (${nameTranslations.en || 'unnamed'}) to order ${section.order}`)
      
      // Use service client with admin privileges to bypass RLS
      const { error: updateError } = await supabase
        .from('inspection_categories')
        .update({ order_number: section.order })
        .eq('id', section.id)
      
      if (updateError) {
        console.error(`[REORDER] Error updating section ${section.id}:`, updateError)
      } else {
        console.log(`[REORDER] Successfully updated section ${section.id} to order ${section.order}`)
        updateResults.push({
          id: section.id,
          order: section.order,
          name: nameTranslations.en || 'unnamed'
        })
      }
    }
    
    // Verify update by fetching the updated sections
    const { data: updatedSections, error: updatedError } = await supabase
      .from('inspection_categories')
      .select('id, type, order_number, name_translations')
      .eq('type', templateType)
      .order('order_number', { ascending: true })
    
    if (updatedError) {
      console.error('[REORDER] Error fetching updated sections:', updatedError)
    } else {
      console.log('[REORDER] Updated sections:', 
        updatedSections?.map(s => {
          // Safely access the English name with proper type casting
          const nameTranslations = s.name_translations as TranslationObject || {};
          return `${s.id}:${s.order_number}:${nameTranslations.en || 'unnamed'}`;
        }).join(', ') || 'None'
      )
    }

    // Consider it a success if at least one section was updated
    const isSuccess = updateResults.length > 0
    return NextResponse.json({ 
      success: isSuccess,
      message: isSuccess 
        ? `Reordering complete. Updated ${updateResults.length} of ${sections.length} sections.`
        : 'No sections were updated. The sections may not exist in the database.',
      updates: updateResults,
      updatedSections: updatedSections || [],
      missingIds: missingIds
    }, { status: isSuccess ? 200 : 404 })
  } catch (error) {
    console.error('Error reordering sections:', error)
    return NextResponse.json(
      { error: 'Failed to reorder sections', details: error },
      { status: 500 }
    )
  }
} 