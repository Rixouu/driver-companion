import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log('🔍 [TEST PDF API] Starting test PDF generation route');
  
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('🔍 [TEST PDF API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get a sample quotation for testing PDF generation
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*')
      .limit(1)
      .single();
    
    if (error || !quotation) {
      console.error('🔍 [TEST PDF API] No quotations found for test:', error);
      return NextResponse.json(
        { error: 'No quotations found for testing' },
        { status: 404 }
      );
    }
    
    console.log('🔍 [TEST PDF API] Found quotation for testing:', quotation.id);
    
    // Create a simple HTML template for testing
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PDF Test</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 { color: #e03e2d; }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 5px;
        }
        pre {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>PDF Generation Test</h1>
        <p>This is a test PDF generated at: ${new Date().toISOString()}</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>User: ${session.user.email}</p>
        
        <h2>Sample Quotation Data</h2>
        <pre>${JSON.stringify(quotation, null, 2)}</pre>
      </div>
    </body>
    </html>
    `;
    
    // Generate a test PDF using puppeteer
    console.log('🔍 [TEST PDF API] Launching puppeteer for PDF generation');
    
    let browser: any = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      console.log('🔍 [TEST PDF API] Browser launched successfully');
      
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30000);
      
      // Log browser information
      const version = await browser.version();
      console.log(`🔍 [TEST PDF API] Browser version: ${version}`);
      
      await page.setContent(htmlContent, { 
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 30000 
      });
      
      console.log('🔍 [TEST PDF API] Content loaded, generating PDF');
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
      });
      
      await browser.close();
      console.log(`🔍 [TEST PDF API] PDF generation successful. Size: ${pdfBuffer.length / 1024}KB`);
      
      // Return the PDF directly for download
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="test-pdf-${Date.now()}.pdf"`
        }
      });
    } catch (error) {
      console.error('🔍 [TEST PDF API] Error during PDF generation:', error);
      return NextResponse.json({
        error: 'PDF generation failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('🔍 [TEST PDF API] Error closing browser:', closeError);
        }
      }
    }
  } catch (error) {
    console.error('🔍 [TEST PDF API] Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error during test',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 