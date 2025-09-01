export interface TeamAddress {
  companyName: string
  address: string[]
  taxId: string
  contactEmail: string
}

export const TEAM_ADDRESSES: Record<'japan' | 'thailand', TeamAddress> = {
  thailand: {
    companyName: 'Driver (Thailand) Company Limited',
    address: [
      '580/17 Soi Ramkhamhaeng 39',
      'Wang Thong Lang, Bangkok 10310, Thailand'
    ],
    taxId: 'Tax ID: 0105566135845',
    contactEmail: 'booking@japandriver.com'
  },
  japan: {
    companyName: 'Driver (Japan) Company Limited',
    address: [
      '#47 11F TOC Bldg 7-22-17 Nishi-Gotanda',
      'Shinagawa-Ku Tokyo Japan 141-0031'
    ],
    taxId: 'Tax ID: T2020001153198',
    contactEmail: 'booking@japandriver.com'
  }
}

export function getTeamAddress(team: 'japan' | 'thailand'): TeamAddress {
  return TEAM_ADDRESSES[team]
}

export function getTeamAddressHtml(team: 'japan' | 'thailand', isJapanese: boolean = false): string {
  const address = TEAM_ADDRESSES[team]
  
  if (isJapanese) {
    return `
      <h2 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">${address.companyName}</h2>
      ${address.address.map(line => `<p style="margin: 0 0 2px 0; color: #111827; font-size: 13px;">${line}</p>`).join('')}
      <p style="margin: 0; color: #111827; font-size: 13px;">${address.taxId}</p>
    `
  }
  
  return `
    <h2 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">${address.companyName}</h2>
    ${address.address.map(line => `<p style="margin: 0 0 2px 0; color: #111827; font-size: 13px;">${line}</p>`).join('')}
    <p style="margin: 0; color: #111827; font-size: 13px;">${address.taxId}</p>
  `
}

export function getTeamFooterHtml(team: 'japan' | 'thailand', isJapanese: boolean = false): string {
  const address = TEAM_ADDRESSES[team]
  
  if (isJapanese) {
    return `
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        ご利用いただきありがとうございます。
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        この請求書に関するお問い合わせは ${address.contactEmail} までご連絡ください。
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        ${address.companyName} • www.japandriver.com
      </p>
    `
  }
  
  return `
    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
      Thank you for your business!
    </p>
    <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
      If you have any questions about this invoice, please contact us at ${address.contactEmail}
    </p>
    <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
      ${address.companyName} • www.japandriver.com
    </p>
  `
}
