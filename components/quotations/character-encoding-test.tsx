"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { safeEncodeText, containsJapanese, containsThai, detectLanguage } from '@/lib/utils/character-encoding'

/**
 * Test component to verify Japanese and Thai character encoding
 * This helps debug character display issues in quotations
 */
export function CharacterEncodingTest() {
  const [testText, setTestText] = useState('')
  const [results, setResults] = useState<{
    original: string
    encoded: string
    language: string
    hasJapanese: boolean
    hasThai: boolean
    length: number
    charCodes: string
  } | null>(null)

  const handleTest = () => {
    if (!testText.trim()) return

    const encoded = safeEncodeText(testText)
    const language = detectLanguage(testText)
    const hasJapanese = containsJapanese(testText)
    const hasThai = containsThai(testText)
    const length = testText.length
    const charCodes = Array.from(testText)
      .map(char => `${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`)
      .join(', ')

    setResults({
      original: testText,
      encoded,
      language,
      hasJapanese,
      hasThai,
      length,
      charCodes
    })
  }

  const sampleTexts = {
    japanese: '株式会社ドライバー・タイランド\n〒103-0010 東京都中央区日本橋本町1-1-1',
    thai: 'บริษัท ไดรเวอร์ ประเทศไทย จำกัด\n580/17 ซอยรามคำแหง 39 แขวงวังทองหลาง',
    mixed: 'Driver (Thailand) Company Limited\n580/17 Soi Ramkhamhaeng 39, Wang Thong Lang\nBangkok 10310, Thailand\n会社名: ドライバー・タイランド',
    english: 'Driver (Thailand) Company Limited\n580/17 Soi Ramkhamhaeng 39\nWang Thong Lang, Bangkok 10310'
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Character Encoding Test</CardTitle>
          <CardDescription>
            Test Japanese and Thai character encoding for quotations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-text">Test Text:</Label>
            <Textarea
              id="test-text"
              placeholder="Enter text with Japanese or Thai characters..."
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestText(sampleTexts.japanese)}
            >
              Japanese Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestText(sampleTexts.thai)}
            >
              Thai Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestText(sampleTexts.mixed)}
            >
              Mixed Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestText(sampleTexts.english)}
            >
              English Sample
            </Button>
          </div>

          <Button onClick={handleTest} disabled={!testText.trim()}>
            Test Encoding
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Original Text:</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                  {results.original}
                </div>
              </div>
              
              <div>
                <Label className="font-semibold">Encoded Text:</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                  {results.encoded}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="font-semibold">Language:</Label>
                <div className="mt-1 text-sm">{results.language}</div>
              </div>
              
              <div>
                <Label className="font-semibold">Has Japanese:</Label>
                <div className="mt-1 text-sm">{results.hasJapanese ? 'Yes' : 'No'}</div>
              </div>
              
              <div>
                <Label className="font-semibold">Has Thai:</Label>
                <div className="mt-1 text-sm">{results.hasThai ? 'Yes' : 'No'}</div>
              </div>
              
              <div>
                <Label className="font-semibold">Length:</Label>
                <div className="mt-1 text-sm">{results.length}</div>
              </div>
            </div>

            <div>
              <Label className="font-semibold">Character Codes:</Label>
              <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                {results.charCodes}
              </div>
            </div>

            <div>
              <Label className="font-semibold">Preview in Quotation Format:</Label>
              <div className="mt-2 p-4 border rounded bg-white">
                <div className="text-sm">
                  <h3 className="font-bold mb-2">BILLING ADDRESS:</h3>
                  <p className="mb-1">{results.encoded}</p>
                  <p className="mb-1">test@example.com</p>
                  <p className="mb-3">+66-2-123-4567</p>
                  
                  <p className="mb-1">
                    <strong>Company:</strong> {results.encoded}
                  </p>
                  <p className="mb-1">
                    <strong>Tax ID:</strong> 1234567890123
                  </p>
                  <p className="mb-1">
                    <strong>Address:</strong> {results.encoded}
                  </p>
                  <p className="mb-1">
                    <strong>City/State/Postal:</strong> Bangkok, 10310
                  </p>
                  <p>
                    <strong>Country:</strong> Thailand
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Known Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Issue:</strong> Japanese and Thai characters not displaying in quotations</p>
            <p><strong>Root Cause:</strong> Character encoding issues during data processing</p>
            <p><strong>Solution:</strong> Use safeEncodeText() function to properly handle characters</p>
          </div>
          
          <div className="text-sm space-y-2">
            <h4 className="font-semibold">What the fix does:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Decodes HTML entities that might corrupt characters</li>
              <li>Ensures proper UTF-8 encoding</li>
              <li>Handles Unicode character ranges for Japanese and Thai</li>
              <li>Provides consistent text processing across all quotation components</li>
            </ul>
          </div>
          
          <div className="text-sm space-y-2">
            <h4 className="font-semibold">Files updated:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>lib/html-pdf-generator.ts - Main quotation PDF generator</li>
              <li>app/api/quotations/generate-invoice-pdf/route.ts - Invoice PDF generator</li>
              <li>components/quotations/quotation-pdf-button.tsx - Client-side quotation generator</li>
              <li>lib/utils/character-encoding.ts - New utility functions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
