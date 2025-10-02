import { NextRequest, NextResponse } from 'next/server'
import { getTeamAddressHtmlFromDB, getTeamFooterHtmlFromDB } from '@/lib/partials-database-fetcher'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get('team') as 'japan' | 'thailand' || 'japan'
    const document_type = searchParams.get('document_type') as 'quotation' | 'invoice' || 'quotation'
    const language = searchParams.get('language') as 'en' | 'ja' || 'en'
    
    console.log(`🧪 [TEST-PARTIALS] Testing partials for ${team} ${document_type} (${language})`)
    
    // Test header partial
    const headerHtml = await getTeamAddressHtmlFromDB(team, document_type, language === 'ja')
    console.log('✅ [TEST-PARTIALS] Header HTML:', headerHtml.substring(0, 100) + '...')
    
    // Test footer partial
    const footerHtml = await getTeamFooterHtmlFromDB(team, document_type, language === 'ja')
    console.log('✅ [TEST-PARTIALS] Footer HTML:', footerHtml.substring(0, 100) + '...')
    
    return NextResponse.json({
      success: true,
      team,
      document_type,
      language,
      header: {
        html: headerHtml,
        length: headerHtml.length
      },
      footer: {
        html: footerHtml,
        length: footerHtml.length
      },
      message: 'Partials connection test successful!'
    })
    
  } catch (error) {
    console.error('❌ [TEST-PARTIALS] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test partials connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
