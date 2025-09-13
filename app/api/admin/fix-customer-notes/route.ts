import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // First, let's see how many customers have duplicate notes
    const { data: customersWithDuplicates, error: countError } = await supabase
      .from('customers')
      .select('id, email, notes')
      .not('notes', 'is', null)
      .or('notes.like.*From quotation #*From quotation #*,notes.like.*From booking #*From booking #*,notes.like.*From quotation #*From booking #*,notes.like.*From booking #*From quotation #*')

    if (countError) {
      console.error('Error fetching customers with duplicates:', countError)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    console.log(`Found ${customersWithDuplicates?.length || 0} customers with duplicate notes`)

    // Clean up each customer's notes
    const cleanedCustomers = []
    
    for (const customer of customersWithDuplicates || []) {
      if (!customer.notes) continue
      
      // Split by the separator and take only unique entries
      const noteParts = customer.notes.split('\n---\n')
      const uniqueNotes = []
      const seenNotes = new Set()
      
      for (const note of noteParts) {
        const trimmedNote = note.trim()
        if (trimmedNote && !seenNotes.has(trimmedNote)) {
          uniqueNotes.push(trimmedNote)
          seenNotes.add(trimmedNote)
        }
      }
      
      const cleanedNotes = uniqueNotes.join('\n---\n')
      
      if (cleanedNotes !== customer.notes) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ 
            notes: cleanedNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id)
        
        if (updateError) {
          console.error(`Error updating customer ${customer.email}:`, updateError)
        } else {
          cleanedCustomers.push({
            id: customer.id,
            email: customer.email,
            originalLength: customer.notes.length,
            cleanedLength: cleanedNotes.length
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up notes for ${cleanedCustomers.length} customers`,
      cleanedCustomers,
      totalFound: customersWithDuplicates?.length || 0
    })

  } catch (error) {
    console.error('Error fixing customer notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
