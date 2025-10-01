import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function POST() {
  try {
    const supabase = createServiceClient()
    
    // First, let's check if the table already exists
    const { data: existingTables, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'pdf_templates')

    if (tableCheckError) {
      console.log('Table check error (this is expected):', tableCheckError.message)
    }

    if (existingTables && existingTables.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'PDF templates table already exists' 
      })
    }

    // Since we can't create tables directly, let's just insert the default templates
    // The table will need to be created manually in Supabase dashboard
    return NextResponse.json({ 
      success: false, 
      message: 'Please create the pdf_templates table manually in Supabase dashboard first. See the SQL migration file for the schema.',
      sqlFile: 'database/migrations/20241225000001_pdf_templates.sql'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
