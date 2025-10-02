import { createServiceClient } from '@/lib/supabase/service-client'

export interface PartialTemplate {
  id: string
  name: string
  type: 'header' | 'footer'
  document_type: 'quotation' | 'invoice'
  team: 'japan' | 'thailand' | 'both'
  content: string
  is_active: boolean
  variables: string[]
  last_modified: string
  created_at: string
  updated_at: string
}

/**
 * Fetch partial templates from database
 */
export async function fetchPartialTemplates(
  type: 'header' | 'footer',
  document_type: 'quotation' | 'invoice',
  team: 'japan' | 'thailand' | 'both'
): Promise<PartialTemplate | null> {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('partial_templates')
      .select('*')
      .eq('type', type)
      .eq('document_type', document_type)
      .eq('team', team)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error(`❌ [PARTIALS] Error fetching ${type} for ${document_type} (${team}):`, error)
      return null
    }
    
    return data as PartialTemplate
  } catch (error) {
    console.error(`❌ [PARTIALS] Exception fetching ${type} for ${document_type} (${team}):`, error)
    return null
  }
}

/**
 * Get team address HTML from database partials
 * Falls back to hardcoded data if database partial is not found
 */
export async function getTeamAddressHtmlFromDB(
  team: 'japan' | 'thailand' | 'both',
  document_type: 'quotation' | 'invoice',
  isJapanese: boolean = false
): Promise<string> {
  const partial = await fetchPartialTemplates('header', document_type, team)
  
  if (partial) {
    // Replace variables with actual data
    let content = partial.content
    
    // Get team-specific data
    const teamData = getTeamData(team)
    
    // Replace variables
    content = content.replace(/\{\{company_name\}\}/g, teamData.companyName)
    content = content.replace(/\{\{company_address\}\}/g, teamData.address.join('<br>'))
    content = content.replace(/\{\{tax_id\}\}/g, teamData.taxId)
    
    return content
  }
  
  // Fallback to hardcoded data
  console.warn(`⚠️ [PARTIALS] No database partial found for ${document_type} header (${team}), using hardcoded data`)
  return getTeamAddressHtmlFallback(team, isJapanese)
}

/**
 * Get team footer HTML from database partials
 * Falls back to hardcoded data if database partial is not found
 */
export async function getTeamFooterHtmlFromDB(
  team: 'japan' | 'thailand' | 'both',
  document_type: 'quotation' | 'invoice',
  isJapanese: boolean = false
): Promise<string> {
  const partial = await fetchPartialTemplates('footer', document_type, team)
  
  if (partial) {
    // Replace variables with actual data
    let content = partial.content
    
    // Get team-specific data
    const teamData = getTeamData(team)
    
    // Replace variables
    content = content.replace(/\{\{contact_email\}\}/g, teamData.contactEmail)
    content = content.replace(/\{\{company_name\}\}/g, teamData.companyName)
    
    return content
  }
  
  // Fallback to hardcoded data
  console.warn(`⚠️ [PARTIALS] No database partial found for ${document_type} footer (${team}), using hardcoded data`)
  return getTeamFooterHtmlFallback(team, isJapanese)
}

/**
 * Get team data for variable replacement
 */
function getTeamData(team: 'japan' | 'thailand' | 'both') {
  const teamKey = team === 'both' ? 'japan' : team
  
  const teamData = {
    japan: {
      companyName: 'Driver (Japan) Company Limited',
      address: [
        '#47 11F TOC Bldg 7-22-17 Nishi-Gotanda',
        'Shinagawa-Ku Tokyo Japan 141-0031'
      ],
      taxId: 'Tax ID: T2020001153198',
      contactEmail: 'booking@japandriver.com'
    },
    thailand: {
      companyName: 'Driver (Thailand) Company Limited',
      address: [
        '580/17 Soi Ramkhamhaeng 39',
        'Wang Thong Lang, Bangkok 10310, Thailand'
      ],
      taxId: 'Tax ID: 0105566135845',
      contactEmail: 'booking@japandriver.com'
    }
  }
  
  return teamData[teamKey]
}

/**
 * Fallback functions that match the original hardcoded implementation
 */
function getTeamAddressHtmlFallback(team: 'japan' | 'thailand' | 'both', isJapanese: boolean = false): string {
  const teamKey = team === 'both' ? 'japan' : team
  const teamData = getTeamData(teamKey)
  
  if (isJapanese) {
    return `
      <h2 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">${teamData.companyName}</h2>
      ${teamData.address.map(line => `<p style="margin: 0 0 2px 0; color: #111827; font-size: 13px;">${line}</p>`).join('')}
      <p style="margin: 0; color: #111827; font-size: 13px;">${teamData.taxId}</p>
    `
  }
  
  return `
    <h2 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">${teamData.companyName}</h2>
    ${teamData.address.map(line => `<p style="margin: 0 0 2px 0; color: #111827; font-size: 13px;">${line}</p>`).join('')}
    <p style="margin: 0; color: #111827; font-size: 13px;">${teamData.taxId}</p>
  `
}

function getTeamFooterHtmlFallback(team: 'japan' | 'thailand' | 'both', isJapanese: boolean = false): string {
  const teamKey = team === 'both' ? 'japan' : team
  const teamData = getTeamData(teamKey)
  
  if (isJapanese) {
    return `
      <p style="margin: 0 0 10px 0; font-weight: bold; font-family: 'Noto Sans Thai', 'Noto Sans', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ご利用いただきありがとうございます。
      </p>
      <p style="margin: 0 0 5px 0; font-family: 'Noto Sans Thai', 'Noto Sans', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        この請求書に関するお問い合わせは ${teamData.contactEmail} までご連絡ください。
      </p>
      <p style="margin: 10px 0 0 0; font-family: 'Noto Sans Thai', 'Noto Sans', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ${teamData.companyName} • www.japandriver.com
      </p>
    `
  }
  
  return `
    <p style="margin: 0 0 10px 0; font-weight: bold; font-family: 'Noto Sans Thai', 'Noto Sans', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Thank you for your business!
    </p>
    <p style="margin: 0 0 5px 0; font-family: 'Noto Sans Thai', 'Noto Sans', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      If you have any questions about this invoice, please contact us at ${teamData.contactEmail}
    </p>
    <p style="margin: 10px 0 0 0; font-family: 'Noto Sans Thai', 'Noto Sans', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      ${teamData.companyName} • www.japandriver.com
    </p>
  `
}
