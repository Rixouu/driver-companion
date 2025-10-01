import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function POST() {
  try {
    const supabase = createServiceClient()
    
    // Create PDF Templates table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS pdf_templates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('quotation', 'invoice', 'report')),
          category VARCHAR(100) NOT NULL,
          description TEXT,
          
          -- Template structure
          template_data JSONB NOT NULL DEFAULT '{}',
          
          -- Translations for different languages
          translations JSONB NOT NULL DEFAULT '{}',
          
          -- Template settings
          is_active BOOLEAN DEFAULT true,
          is_default BOOLEAN DEFAULT false,
          team VARCHAR(20) CHECK (team IN ('japan', 'thailand', 'both')),
          
          -- Metadata
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID REFERENCES auth.users(id),
          
          -- Constraints
          CONSTRAINT unique_default_per_type_team UNIQUE (type, team, is_default) DEFERRABLE INITIALLY DEFERRED
        );
      `
    })

    if (createTableError) {
      console.error('Error creating pdf_templates table:', createTableError)
      return NextResponse.json({ error: 'Failed to create pdf_templates table' }, { status: 500 })
    }

    // Create indexes
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_pdf_templates_type ON pdf_templates(type);
        CREATE INDEX IF NOT EXISTS idx_pdf_templates_team ON pdf_templates(team);
        CREATE INDEX IF NOT EXISTS idx_pdf_templates_active ON pdf_templates(is_active);
        CREATE INDEX IF NOT EXISTS idx_pdf_templates_category ON pdf_templates(category);
      `
    })

    // Create updated_at trigger
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_pdf_templates_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_update_pdf_templates_updated_at ON pdf_templates;
        CREATE TRIGGER trigger_update_pdf_templates_updated_at
          BEFORE UPDATE ON pdf_templates
          FOR EACH ROW
          EXECUTE FUNCTION update_pdf_templates_updated_at();
      `
    })

    // Create PDF template variables table
    const { error: createVariablesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS pdf_template_variables (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          template_id UUID REFERENCES pdf_templates(id) ON DELETE CASCADE,
          variable_name VARCHAR(100) NOT NULL,
          variable_type VARCHAR(50) NOT NULL CHECK (variable_type IN ('text', 'number', 'currency', 'date', 'boolean', 'array', 'object')),
          default_value TEXT,
          description TEXT,
          is_required BOOLEAN DEFAULT false,
          validation_rules JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          UNIQUE(template_id, variable_name)
        );
      `
    })

    if (createVariablesError) {
      console.error('Error creating pdf_template_variables table:', createVariablesError)
      return NextResponse.json({ error: 'Failed to create pdf_template_variables table' }, { status: 500 })
    }

    // Insert default PDF templates
    const { error: insertError } = await supabase
      .from('pdf_templates')
      .insert([
        {
          name: 'Standard Quotation',
          type: 'quotation',
          category: 'standard',
          description: 'Default quotation template with company branding',
          template_data: {
            header: {
              logo_url: '{{logo_url}}',
              company_name: '{{company_name}}',
              company_address: '{{company_address}}',
              tax_id: '{{tax_id}}',
              primary_color: '{{primary_color}}'
            },
            body: {
              quotation_title: '{{quotation_title}}',
              quotation_number: '{{quotation_number}}',
              quotation_date: '{{quotation_date}}',
              expiry_date: '{{expiry_date}}',
              customer_info: '{{customer_info}}',
              service_info: '{{service_info}}',
              price_details: '{{price_details}}',
              terms_conditions: '{{terms_conditions}}'
            },
            footer: {
              contact_info: '{{contact_info}}',
              website: '{{website}}',
              legal_disclaimer: '{{legal_disclaimer}}'
            },
            styles: {
              primary_color: '{{primary_color}}',
              font_family: 'Noto Sans Thai, Noto Sans, sans-serif',
              font_size: '14px',
              line_height: '1.6'
            }
          },
          translations: {
            en: {
              quotation: 'QUOTATION',
              quotation_number: 'Quotation #:',
              quotation_date: 'Quotation Date:',
              expiry_date: 'Expiry Date:',
              valid_for: 'Valid for:',
              days: 'days',
              customer_info: 'CUSTOMER INFO:',
              billing_address: 'BILLING ADDRESS:',
              service_info: 'SERVICE INFO:',
              service_type: 'Service Type:',
              vehicle_type: 'Vehicle Type:',
              pickup_date: 'Pickup Date:',
              pickup_time: 'Pickup Time:',
              duration: 'Duration:',
              hours: 'hours',
              price_details: 'PRICE DETAILS:',
              description: 'Description',
              price: 'Price',
              subtotal: 'Subtotal:',
              discount: 'Discount:',
              tax: 'Tax:',
              total: 'TOTAL:',
              terms_conditions: 'Terms and Conditions',
              thanks_message: 'Thank you for considering our services!',
              contact_message: 'If you have any questions about this quotation, please contact us at {{contact_email}}'
            },
            ja: {
              quotation: '見積書',
              quotation_number: '見積書番号:',
              quotation_date: '見積書発行日:',
              expiry_date: '有効期限:',
              valid_for: '有効期間:',
              days: '日',
              customer_info: 'お客様情報:',
              billing_address: '請求先住所:',
              service_info: 'サービス情報:',
              service_type: 'サービス種別:',
              vehicle_type: '車両タイプ:',
              pickup_date: 'お迎え日:',
              pickup_time: 'お迎え時間:',
              duration: '所要時間:',
              hours: '時間',
              price_details: '料金詳細:',
              description: '内容',
              price: '価格',
              subtotal: '小計:',
              discount: '割引:',
              tax: '税金:',
              total: '合計:',
              terms_conditions: '利用規約',
              thanks_message: '弊社サービスをご検討いただき、ありがとうございます！',
              contact_message: 'この見積書についてご質問がございましたら、{{contact_email}}までお問い合わせください。'
            }
          },
          team: 'both',
          is_default: true
        },
        {
          name: 'Standard Invoice',
          type: 'invoice',
          category: 'standard',
          description: 'Default invoice template with company branding',
          template_data: {
            header: {
              logo_url: '{{logo_url}}',
              company_name: '{{company_name}}',
              company_address: '{{company_address}}',
              tax_id: '{{tax_id}}',
              primary_color: '{{primary_color}}'
            },
            body: {
              invoice_title: '{{invoice_title}}',
              invoice_number: '{{invoice_number}}',
              invoice_date: '{{invoice_date}}',
              due_date: '{{due_date}}',
              booking_ref: '{{booking_ref}}',
              customer_info: '{{customer_info}}',
              service_details: '{{service_details}}',
              price_details: '{{price_details}}',
              payment_terms: '{{payment_terms}}'
            },
            footer: {
              contact_info: '{{contact_info}}',
              website: '{{website}}',
              legal_disclaimer: '{{legal_disclaimer}}'
            },
            styles: {
              primary_color: '{{primary_color}}',
              font_family: 'Noto Sans Thai, Noto Sans, sans-serif',
              font_size: '14px',
              line_height: '1.6'
            }
          },
          translations: {
            en: {
              invoice: 'INVOICE',
              invoice_number: 'Invoice #:',
              invoice_date: 'Invoice Date:',
              due_date: 'Due Date:',
              booking_ref: 'Booking Ref:',
              bill_to: 'BILL TO:',
              service_details: 'SERVICE DETAILS:',
              service_description: 'Service Description',
              date: 'Date',
              quantity: 'Quantity',
              price: 'Price',
              subtotal: 'Subtotal:',
              total: 'TOTAL:',
              thanks_message: 'Thank you for your business!',
              contact_message: 'If you have any questions about this invoice, please contact us at {{contact_email}}'
            },
            ja: {
              invoice: '請求書',
              invoice_number: '請求書番号:',
              invoice_date: '請求書発行日:',
              due_date: '支払期限:',
              booking_ref: '予約番号:',
              bill_to: '請求先:',
              service_details: 'サービス詳細:',
              service_description: 'サービス内容',
              date: '日付',
              quantity: '数量',
              price: '価格',
              subtotal: '小計:',
              total: '合計:',
              thanks_message: 'ご利用いただき、ありがとうございます！',
              contact_message: 'この請求書についてご質問がございましたら、{{contact_email}}までお問い合わせください。'
            }
          },
          team: 'both',
          is_default: true
        }
      ])

    if (insertError) {
      console.error('Error inserting default templates:', insertError)
      return NextResponse.json({ error: 'Failed to insert default templates' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'PDF templates migration completed successfully' 
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
