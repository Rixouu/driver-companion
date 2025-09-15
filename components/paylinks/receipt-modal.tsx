'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Download, 
  Printer, 
  ExternalLink,
  CheckCircle,
  X,
  FileText,
  Image
} from 'lucide-react'

interface ReceiptData {
  id: string | number
  title?: string
  name?: string
  description?: string
  amount: number
  currency: string
  status: string
  paid_at: string
  transaction_url?: string
}

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  receiptData: ReceiptData | null
}

export function ReceiptModal({ open, onClose, receiptData }: ReceiptModalProps) {
  if (!receiptData) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receiptData.title || receiptData.name || 'Payment Receipt'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #f8f9fa;
              color: #333;
              line-height: 1.6;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .receipt-container {
              background: white;
              border-radius: 6px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              max-width: 320px;
              width: 100%;
              overflow: hidden;
              margin: 0 auto;
            }
                  .receipt-header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    text-align: center;
                    padding: 20px 15px;
                    position: relative;
                  }
            .success-icon {
              width: 40px;
              height: 40px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 10px;
              font-size: 16px;
              line-height: 1;
              position: relative;
            }
            .success-icon::before {
              content: "✓";
              font-size: 18px;
              font-weight: bold;
              color: white;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }
            .receipt-title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .receipt-subtitle {
              font-size: 12px;
              opacity: 0.9;
            }
            .receipt-body {
              padding: 15px;
            }
            .amount-section {
              text-align: center;
              margin-bottom: 15px;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 4px;
            }
            .amount-label {
              font-size: 10px;
              color: #6b7280;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .amount-value {
              font-size: 18px;
              font-weight: 700;
              color: #10b981;
            }
            .details-section {
              margin-bottom: 15px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 6px 0;
              border-bottom: 1px solid #e5e7eb;
              min-height: 20px;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 500;
              color: #374151;
              font-size: 10px;
              flex-shrink: 0;
              margin-right: 8px;
              display: flex;
              align-items: center;
              height: 18px;
            }
            .detail-value {
              color: #6b7280;
              font-size: 10px;
              text-align: right;
              flex: 1;
              word-break: break-word;
              line-height: 1.3;
              display: flex;
              align-items: center;
              justify-content: flex-end;
              height: 18px;
            }
            .transaction-url {
              color: #3b82f6;
              text-decoration: none;
              font-size: 9px;
              word-break: break-all;
              line-height: 1.2;
            }
            .transaction-url:hover {
              text-decoration: underline;
            }
            .receipt-footer {
              background: #f8f9fa;
              padding: 12px 15px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer-text {
              color: #6b7280;
              font-size: 10px;
              margin-bottom: 4px;
            }
            .omise-logo {
              color: #6b7280;
              font-size: 9px;
              font-weight: 500;
            }
            .status-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              background: transparent;
              color: #6b7280;
              font-size: 9px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              white-space: nowrap;
              height: 18px;
              min-width: 40px;
              line-height: 1;
              gap: 3px;
            }
            .status-badge::before {
              content: "✅";
              font-size: 8px;
            }
            @media print {
              body { background: white; padding: 0; }
              .receipt-container { box-shadow: none; border: 1px solid #e5e7eb; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="success-icon">✓</div>
              <div class="receipt-title">Payment Completed</div>
              <div class="receipt-subtitle">お支払いが完了しました</div>
            </div>
            
            <div class="receipt-body">
              <div class="amount-section">
                <div class="amount-label">Amount Paid</div>
                <div class="amount-value">${receiptData.amount.toLocaleString()} ${receiptData.currency}</div>
              </div>
              
              <div class="details-section">
                <div class="detail-row">
                  <div class="detail-label">Service</div>
                  <div class="detail-value">${receiptData.title || receiptData.name || 'N/A'}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Payment ID</div>
                  <div class="detail-value">${receiptData.id}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Payment Date</div>
                  <div class="detail-value">${formatDate(receiptData.paid_at)}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Status</div>
                  <div class="detail-value">
                    <span class="status-badge">${receiptData.status}</span>
                  </div>
                </div>
                ${receiptData.description ? `
                <div class="detail-row">
                  <div class="detail-label">Description</div>
                  <div class="detail-value">${receiptData.description}</div>
                </div>
                ` : ''}
                ${receiptData.transaction_url ? `
                <div class="detail-row">
                  <div class="detail-label">Transaction URL</div>
                  <div class="detail-value">
                    <a href="${receiptData.transaction_url}" target="_blank" class="transaction-url">${receiptData.transaction_url}</a>
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="receipt-footer">
              <div class="footer-text">Thank you for your payment!</div>
              <div class="omise-logo">Payment processed by OMISE</div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const downloadReceiptHTML = () => {
    const html = generateReceiptHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `receipt-${receiptData.id}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadReceiptPDF = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')
      
      // Create a temporary div with the receipt content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = generateReceiptHTML()
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '320px'
      tempDiv.style.backgroundColor = 'white'
      document.body.appendChild(tempDiv)
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        width: 320,
        height: tempDiv.scrollHeight,
        backgroundColor: '#ffffff',
        scale: 3
      })
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 140 // Even smaller width for better fit
      const pageHeight = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Center the image on the page
      const xOffset = (210 - imgWidth) / 2
      
      if (imgHeight <= pageHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', xOffset, 10, imgWidth, imgHeight)
      } else {
        // Multiple pages
        let heightLeft = imgHeight
        let position = 10
        pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + 10
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
      }
      
      // Download PDF
      pdf.save(`receipt-${receiptData.id}-${new Date().toISOString().split('T')[0]}.pdf`)
      
      // Clean up
      document.body.removeChild(tempDiv)
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to HTML download
      downloadReceiptHTML()
    }
  }

  const downloadReceiptPNG = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      
      // Create a temporary div with the receipt content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = generateReceiptHTML()
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '500px'
      tempDiv.style.backgroundColor = 'white'
      document.body.appendChild(tempDiv)
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        width: 500,
        height: tempDiv.scrollHeight,
        backgroundColor: '#ffffff',
        scale: 2
      })
      
      // Download PNG
      const link = document.createElement('a')
      link.download = `receipt-${receiptData.id}-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      // Clean up
      document.body.removeChild(tempDiv)
    } catch (error) {
      console.error('Error generating PNG:', error)
      // Fallback to HTML download
      downloadReceiptHTML()
    }
  }

  const printReceipt = () => {
    const html = generateReceiptHTML()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const openInNewTab = () => {
    const html = generateReceiptHTML()
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Payment Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Payment Completed</h3>
                  <p className="text-muted-foreground">お支払いが完了しました</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Amount Paid</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {receiptData.amount.toLocaleString()} {receiptData.currency}
                  </p>
                  <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                    {receiptData.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-muted-foreground">Service</span>
                  <span className="text-sm font-medium">{receiptData.title || receiptData.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-muted-foreground">Payment ID</span>
                  <span className="text-sm font-mono">{receiptData.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-muted-foreground">Payment Date</span>
                  <span className="text-sm">{formatDate(receiptData.paid_at)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-muted-foreground">Status</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                    {receiptData.status}
                  </Badge>
                </div>
                {receiptData.description && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-muted-foreground">Description</span>
                    <span className="text-sm text-right max-w-60">{receiptData.description}</span>
                  </div>
                )}
                {receiptData.transaction_url && (
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-muted-foreground">Transaction URL</span>
                    <a 
                      href={receiptData.transaction_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all max-w-60"
                    >
                      {receiptData.transaction_url}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={downloadReceiptPDF} className="flex-1 bg-green-600 hover:bg-green-700">
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={downloadReceiptPNG} variant="outline" className="flex-1">
                <Image className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
              <Button onClick={openInNewTab} variant="outline" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Payment processed by <span className="font-medium">OMISE</span></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
