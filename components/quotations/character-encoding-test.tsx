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
            <Card className="border border-indigo-200/50 bg-indigo-50/30 dark:bg-indigo-950/20 dark:border-indigo-800/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-400 text-xl">🔤</span>
            </div>
            <div>
              <CardTitle className="text-indigo-800 dark:text-indigo-200">Character Encoding Test</CardTitle>
              <CardDescription className="text-indigo-700 dark:text-indigo-300">
                Test Japanese and Thai character encoding for quotations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-text" className="text-indigo-800 dark:text-indigo-200 font-semibold">Test Text:</Label>
            <Textarea
              id="test-text"
              placeholder="Enter text with Japanese or Thai characters..."
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={4}
              className="border-indigo-200/50 dark:border-indigo-800/50 focus:border-indigo-400 dark:focus:border-indigo-300 focus:ring-indigo-400 dark:focus:ring-indigo-300"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              onClick={() => setTestText(sampleTexts.japanese)}
            >
              🇯🇵 Japanese Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              onClick={() => setTestText(sampleTexts.thai)}
            >
              🇹🇭 Thai Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              onClick={() => setTestText(sampleTexts.mixed)}
            >
              🌏 Mixed Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              onClick={() => setTestText(sampleTexts.english)}
            >
              🇺🇸 English Sample
            </Button>
          </div>

          <Button 
            onClick={handleTest} 
            disabled={!testText.trim()}
            className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white"
          >
            🧪 Test Encoding
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="border border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-800/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 text-xl">📊</span>
              </div>
              <div>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">Test Results</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-emerald-800 dark:text-emerald-200">Original Text:</Label>
                <div className="mt-1 p-3 bg-white dark:bg-gray-800 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-sm font-mono whitespace-pre-wrap shadow-sm">
                  {results.original}
                </div>
              </div>
              
              <div>
                <Label className="font-semibold text-emerald-800 dark:text-emerald-200">Encoded Text:</Label>
                <div className="mt-1 p-3 bg-white dark:bg-gray-800 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-sm font-mono whitespace-pre-wrap shadow-sm">
                  {results.encoded}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg">
                <Label className="font-semibold text-emerald-800 dark:text-emerald-200 text-xs">Language:</Label>
                <div className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">{results.language}</div>
              </div>
              
              <div className="p-3 bg-white dark:bg-gray-800 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg">
                <Label className="font-semibold text-emerald-800 dark:text-emerald-200 text-xs">Has Japanese:</Label>
                <div className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">{results.hasJapanese ? 'Yes' : 'No'}</div>
              </div>
              
              <div className="p-3 bg-white dark:bg-gray-800 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg">
                <Label className="font-semibold text-emerald-800 dark:text-emerald-200 text-xs">Has Thai:</Label>
                <div className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">{results.hasThai ? 'Yes' : 'No'}</div>
              </div>
              
              <div className="p-3 bg-white dark:bg-gray-800 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg">
                <Label className="font-semibold text-emerald-800 dark:text-emerald-200 text-xs">Length:</Label>
                <div className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">{results.length}</div>
              </div>
            </div>

            <div>
              <Label className="font-semibold text-emerald-800 dark:text-emerald-200">Character Codes:</Label>
              <div className="mt-1 p-3 bg-white dark:bg-gray-800 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-xs font-mono shadow-sm">
                {results.charCodes}
              </div>
            </div>

            <div>
              <Label className="font-semibold text-emerald-800 dark:text-emerald-200">Preview in Quotation Format:</Label>
              <div className="mt-2 p-6 border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm">
                <div className="text-sm space-y-3">
                  <div className="pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3">BILLING ADDRESS</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{results.encoded}</p>
                      <p className="text-gray-600 dark:text-gray-400">test@example.com</p>
                      <p className="text-gray-600 dark:text-gray-400">+66-2-123-4567</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[80px]">Company:</span>
                      <span className="text-gray-700 dark:text-gray-300">{results.encoded}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[80px]">Tax ID:</span>
                      <span className="text-gray-700 dark:text-gray-300">1234567890123</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[80px]">Address:</span>
                      <span className="text-gray-700 dark:text-gray-300">{results.encoded}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[80px]">City/State/Postal:</span>
                      <span className="text-gray-700 dark:text-gray-300">Bangkok, 10310</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[80px]">Country:</span>
                      <span className="text-gray-700 dark:text-gray-300">Thailand</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-orange-200/50 bg-orange-50/30 dark:bg-orange-950/20 dark:border-orange-800/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-xl">📋</span>
            </div>
            <div>
              <CardTitle className="text-orange-800 dark:text-orange-200">Known Issues & Solutions</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                Understanding and resolving character encoding problems
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong className="text-orange-800 dark:text-orange-200">Issue:</strong> 
                  <span className="text-orange-700 dark:text-orange-300 ml-2">Japanese and Thai characters not displaying in quotations</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong className="text-orange-800 dark:text-orange-200">Root Cause:</strong> 
                  <span className="text-orange-700 dark:text-orange-300 ml-2">Character encoding issues during data processing</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong className="text-orange-800 dark:text-orange-200">Solution:</strong> 
                  <span className="text-orange-700 dark:text-orange-300 ml-2">Use safeEncodeText() function to properly handle characters</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">What the fix does:</h4>
              <ul className="space-y-2">
                {['Decodes HTML entities that might corrupt characters', 'Ensures proper UTF-8 encoding', 'Handles Unicode character ranges for Japanese and Thai', 'Provides consistent text processing across all quotation components'].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
                    <span className="w-1.5 h-1.5 bg-orange-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">Files updated:</h4>
              <ul className="space-y-2">
                {[
                  'lib/html-pdf-generator.ts - Main quotation PDF generator',
                  'app/api/quotations/generate-invoice-pdf/route.ts - Invoice PDF generator',
                  'components/quotations/quotation-pdf-button.tsx - Client-side quotation generator',
                  'lib/utils/character-encoding.ts - New utility functions'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
                    <span className="w-1.5 h-1.5 bg-orange-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
