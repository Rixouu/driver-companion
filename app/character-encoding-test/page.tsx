import { CharacterEncodingTest } from '@/components/quotations/character-encoding-test'

export default function CharacterEncodingTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Character Encoding Test</h1>
        <p className="text-muted-foreground">
          Test and debug Japanese and Thai character encoding issues in quotations
        </p>
      </div>
      
      <CharacterEncodingTest />
    </div>
  )
}
