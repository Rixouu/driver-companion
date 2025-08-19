import { NextRequest, NextResponse } from 'next/server';
import { generateOptimizedPdfFromHtml } from '@/lib/optimized-html-pdf-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing font loading and PDF generation...');
    
    // Test HTML with Japanese and Thai characters
    const testHtml = `
      <div style="font-family: 'Work Sans', sans-serif; padding: 20px;">
        <h1 style="color: #333;">Font Test - フォントテスト - ทดสอบฟอนต์</h1>
        
        <div style="margin: 20px 0;">
          <h2>English Text</h2>
          <p>This is a test of the Work Sans font in English.</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h2>Japanese Text - 日本語テキスト</h2>
          <p style="font-family: 'Noto Sans JP', sans-serif;">
            これは日本語のテキストです。フォントが正しく表示されるかテストしています。
          </p>
        </div>
        
        <div style="margin: 20px 0;">
          <h2>Thai Text - ข้อความภาษาไทย</h2>
          <p style="font-family: 'Noto Sans Thai', sans-serif;">
            นี่คือข้อความภาษาไทย กำลังทดสอบว่าแสดงผลฟอนต์ได้ถูกต้องหรือไม่
          </p>
        </div>
        
        <div style="margin: 20px 0;">
          <h2>Mixed Text</h2>
          <p>
            English: Hello World<br>
            Japanese: こんにちは世界<br>
            Thai: สวัสดีชาวโลก
          </p>
        </div>
      </div>
    `;
    
    // Generate PDF
    const pdfBuffer = await generateOptimizedPdfFromHtml(
      testHtml,
      {
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true
      }
    );
    
    console.log('✅ Font test PDF generated successfully');
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="font-test.pdf"'
      }
    });
    
  } catch (error) {
    console.error('❌ Font test failed:', error);
    return NextResponse.json({ 
      error: 'Font test failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
