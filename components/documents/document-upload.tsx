"use client"

import { useState } from "react"
import { File, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import type { Document } from "@/types/api"

export function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // In a real app, upload to your backend/storage
      const documentData: Document = {
        id: Math.random().toString(),
        type: "other",
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      }
      setDocuments([...documents, documentData])
    } finally {
      setUploading(false)
    }
  }

  const handleDocumentTypeChange = (id: string, type: Document["type"]) => {
    setDocuments(documents.map((doc) => (doc.id === id ? { ...doc, type } : doc)))
  }

  const handleExpiryDateChange = (id: string, date: string) => {
    setDocuments(documents.map((doc) => (doc.id === id ? { ...doc, expiryDate: date } : doc)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="document">Upload Document</Label>
          <Input
            id="document"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <File className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="font-medium">{doc.fileName}</p>
                  <p className="text-sm text-muted-foreground">Uploaded on {format(new Date(doc.uploadedAt), "PPP")}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={doc.type}
                  onValueChange={(value) => handleDocumentTypeChange(doc.id, value as Document["type"])}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={doc.expiryDate ?? ""} // Added this line to handle undefined expiryDate
                  onChange={(e) => handleExpiryDateChange(doc.id, e.target.value)}
                  className="w-[120px]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDocuments(documents.filter((d) => d.id !== doc.id))
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

