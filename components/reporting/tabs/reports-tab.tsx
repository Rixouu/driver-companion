"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Plus } from 'lucide-react'

interface ReportsTabProps {
  generatedReports: Array<{
    id: string
    name: string
    type: string
    format: string
    createdAt: string
    downloadUrl?: string
  }>
  onGenerateReport: () => void
  onDownloadReport: (reportId: string) => void
  onDeleteReport: (reportId: string) => void
}

export function ReportsTab({ 
  generatedReports, 
  onGenerateReport, 
  onDownloadReport, 
  onDeleteReport 
}: ReportsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Reports
          </CardTitle>
          <CardDescription>
            Access and manage your previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedReports.length > 0 ? (
            <div className="space-y-4">
              {generatedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.type} • {report.format.toUpperCase()} • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadReport(report.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteReport(report.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Generated</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first report to get started with detailed analytics
              </p>
              <Button onClick={onGenerateReport}>
                <Plus className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
