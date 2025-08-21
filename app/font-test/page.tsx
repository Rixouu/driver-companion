export default function FontTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8">Noto Sans Font Test - Japanese & Thai Support</h1>
      
      <div className="space-y-6">
        <section className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Japanese Text (日本語)</h2>
          <p className="text-lg leading-relaxed">
            こんにちは、世界！これは日本語のテキストです。Noto Sansフォントを使用して、
            美しく表示されるはずです。ひらがな、カタカナ、漢字すべてが適切に表示されます。
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Hello world! This is Japanese text. It should display beautifully using the Noto Sans font.
            All hiragana, katakana, and kanji should display properly.
          </p>
        </section>

        <section className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Thai Text (ภาษาไทย)</h2>
          <p className="text-lg leading-relaxed">
            สวัสดีชาวโลก! นี่คือข้อความภาษาไทยที่ใช้ฟอนต์ Noto Sans 
            ซึ่งควรจะแสดงผลได้สวยงามและอ่านง่าย ตัวอักษรไทยทั้งหมดจะแสดงผลได้อย่างถูกต้อง
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Hello world! This is Thai text using the Noto Sans font. 
            It should display beautifully and be easy to read. All Thai characters should display properly.
          </p>
        </section>

        <section className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Mixed Language Text</h2>
          <p className="text-lg leading-relaxed">
            This is a mixed language example: English, 日本語 (Japanese), and ภาษาไทย (Thai). 
            The Noto Sans font should handle all three languages seamlessly in a single paragraph.
          </p>
        </section>

        <section className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Font Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Font Family:</strong> Noto Sans (Base64 embedded)</p>
            <p><strong>Language Support:</strong> Japanese (日本語) + Thai (ภาษาไทย)</p>
            <p><strong>Font Weight:</strong> 400 (Regular)</p>
            <p><strong>Format:</strong> WOFF2 (Base64 encoded)</p>
            <p><strong>Benefits:</strong> Single font file, no external loading, consistent rendering</p>
          </div>
        </section>
      </div>
    </div>
  );
}
