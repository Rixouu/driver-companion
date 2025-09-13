import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailTemplateService } from '@/lib/email/template-service'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { 
      templateName, 
      to, 
      variables = {}, 
      team = 'japan', 
      language = 'en',
      bcc = []
    } = await request.json()

    if (!templateName || !to) {
      return NextResponse.json(
        { error: 'Template name and recipient email are required' },
        { status: 400 }
      )
    }

    // Render the template
    const rendered = await emailTemplateService.renderTemplate(
      templateName,
      variables,
      team,
      language
    )

    if (!rendered) {
      return NextResponse.json(
        { error: 'Failed to render template' },
        { status: 500 }
      )
    }

    // Send email
    const emailData = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: Array.isArray(to) ? to : [to],
      bcc: bcc.length > 0 ? bcc : undefined,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    }

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      template: templateName
    })

  } catch (error) {
    console.error('Error in send-template API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
