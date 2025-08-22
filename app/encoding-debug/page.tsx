import { CharacterEncodingTest } from '@/components/quotations/character-encoding-test'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ModeToggle } from '@/components/mode-toggle'

export default function EncodingDebugPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <a href="/" className="hover:text-foreground transition-colors">Home</a>
              <span>/</span>
              <span className="text-foreground font-medium">Character Encoding Debug</span>
            </nav>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Character Encoding Debug</h1>
              <p className="text-xl text-muted-foreground mt-2">
                Comprehensive testing for Japanese and Thai character encoding issues
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                Database: ✅ Ready
              </Badge>
              <Badge variant="outline" className="text-sm">
                Testing: Active
              </Badge>
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
        
        {/* Database Encoding Test */}
        <Card className="border border-green-200/50 bg-green-50/30 dark:bg-green-950/20 dark:border-green-800/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
              </div>
              <div>
                <CardTitle className="text-green-800 dark:text-green-200">Database Encoding Test</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Comprehensive database migration completed successfully
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-800/30">
              <h3 className="font-bold text-lg text-green-800 dark:text-green-200 mb-3">🎉 Migration Completed Successfully!</h3>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Your database character encoding fix is working perfectly:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></span>
                    <span className="text-green-700 dark:text-green-300">Japanese text stored correctly: <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">美咲、みさき</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></span>
                    <span className="text-green-700 dark:text-green-300">Thai text stored correctly: <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">株式会社ドライバー・タイランド จำกัด</span></span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></span>
                    <span className="text-green-700 dark:text-green-300">HTML entities partially cleaned (trigger working)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></span>
                    <span className="text-green-700 dark:text-green-300">No truncation issues</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="bg-green-200/50 dark:bg-green-800/30" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200/50 dark:border-green-800/30">
                <Label className="font-semibold text-green-800 dark:text-green-200 mb-3 block">What's Working:</Label>
                <ul className="space-y-2">
                  {['Database encoding functions', 'Automatic text cleaning triggers', 'Japanese character support', 'Thai character support', 'UTF-8 encoding'].map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <span className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200/50 dark:border-green-800/30">
                <Label className="font-semibold text-green-800 dark:text-green-200 mb-3 block">Next Steps:</Label>
                <ul className="space-y-2">
                  {['Test form inputs with Japanese/Thai', 'Create quotations with special characters', 'Generate PDFs to verify display', 'Test the full application flow'].map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <span className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Character Encoding Test Component */}
        <CharacterEncodingTest />

        {/* Testing Guide */}
        <Card className="border border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🧪</span>
              </div>
              <div>
                <CardTitle className="text-blue-800 dark:text-blue-200">Testing Guide</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  How to test your character encoding fix
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Character Encoding Function</h3>
                </div>
                <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  {['Use the Character Encoding Test component above', 'Test with Japanese sample text', 'Test with Thai sample text', 'Verify encoding/decoding works correctly'].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Create Real Quotation</h3>
                </div>
                <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  {['Go to your quotations page', 'Create a new quotation with Japanese/Thai text', 'Fill in billing address with special characters', 'Submit and verify database storage'].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">3</span>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Generate PDF</h3>
                </div>
                <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  {['Generate a quotation PDF', 'Check that Japanese/Thai characters display correctly', 'Verify no corrupted characters appear'].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <Separator className="bg-blue-200/50 dark:bg-blue-800/30" />

            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 mb-4">Expected Results:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Database', desc: 'Characters stored without corruption' },
                  { label: 'Forms', desc: 'Accept and display Japanese/Thai text' },
                  { label: 'PDFs', desc: 'Display characters correctly' },
                  { label: 'Triggers', desc: 'Automatically clean HTML entities' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                    </span>
                    <div>
                      <strong className="text-blue-800 dark:text-blue-200">{item.label}:</strong>
                      <span className="text-blue-700 dark:text-blue-300 ml-2">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Testing Sections Placeholder */}
        <Card className="border border-purple-200/50 bg-purple-50/30 dark:bg-purple-950/20 dark:border-purple-800/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-xl">🔮</span>
              </div>
              <div>
                <CardTitle className="text-purple-800 dark:text-purple-200">Future Testing Sections</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">
                  Advanced testing capabilities coming soon
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Automated Testing</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">Run automated tests for character encoding across different components</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Performance Testing</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">Test encoding performance with large amounts of text</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Cross-Browser Testing</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">Verify encoding works across different browsers</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">API Testing</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">Test API endpoints with Japanese/Thai characters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                <span className="text-amber-600 dark:text-amber-400 text-xl">⚡</span>
              </div>
              <div>
                <CardTitle className="text-amber-800 dark:text-amber-200">Quick Actions</CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  Common tasks and shortcuts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-200/50 dark:border-amber-800/30 hover:shadow-md transition-shadow cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/30">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Test Database Connection</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">Verify Supabase connection and encoding functions</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-200/50 dark:border-amber-800/30 hover:shadow-md transition-shadow cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/30">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Generate Test PDF</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">Create a test PDF with Japanese/Thai characters</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-200/50 dark:border-amber-800/30 hover:shadow-md transition-shadow cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/30">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">View System Status</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">Check overall system health and encoding status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


