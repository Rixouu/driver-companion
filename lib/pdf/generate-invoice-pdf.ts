import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  invoiceId: string;
  quotationId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  serviceName: string;
  date: string;
  items: InvoiceItem[];
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const { invoiceId, quotationId, customerName, customerEmail, amount, serviceName, date, items } = data;
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a new page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  
  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Define colors and positions
  const textColor = rgb(0.1, 0.1, 0.1);
  const headerColor = rgb(0.2, 0.2, 0.5);
  const margin = 50;
  const width = page.getWidth() - 2 * margin;
  
  // Draw header
  page.drawText("INVOICE", {
    x: margin,
    y: page.getHeight() - margin - 30,
    size: 30,
    font: helveticaBold,
    color: headerColor
  });
  
  // Draw invoice details
  page.drawText(`Invoice #: ${invoiceId}`, {
    x: margin,
    y: page.getHeight() - margin - 60,
    size: 12,
    font: helveticaFont,
    color: textColor
  });
  
  page.drawText(`Date: ${new Date(date).toLocaleDateString()}`, {
    x: margin,
    y: page.getHeight() - margin - 80,
    size: 12,
    font: helveticaFont,
    color: textColor
  });
  
  page.drawText(`Reference: Quotation #${quotationId}`, {
    x: margin,
    y: page.getHeight() - margin - 100,
    size: 12,
    font: helveticaFont,
    color: textColor
  });
  
  // Draw company info (right-aligned)
  const companyName = "Japan Driver";
  const companyInfo = [
    companyName,
    "1-2-3 Shibuya",
    "Tokyo, Japan 150-0002",
    "info@japandriver.com"
  ];
  
  companyInfo.forEach((line, index) => {
    const textWidth = helveticaFont.widthOfTextAtSize(line, 12);
    page.drawText(line, {
      x: page.getWidth() - margin - textWidth,
      y: page.getHeight() - margin - 60 - (index * 20),
      size: 12,
      font: index === 0 ? helveticaBold : helveticaFont,
      color: textColor
    });
  });
  
  // Draw customer info
  page.drawText("Bill To:", {
    x: margin,
    y: page.getHeight() - margin - 150,
    size: 12,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText(customerName, {
    x: margin,
    y: page.getHeight() - margin - 170,
    size: 12,
    font: helveticaFont,
    color: textColor
  });
  
  page.drawText(customerEmail, {
    x: margin,
    y: page.getHeight() - margin - 190,
    size: 12,
    font: helveticaFont,
    color: textColor
  });
  
  // Draw items table
  const tableTop = page.getHeight() - margin - 240;
  const rowHeight = 30;
  const colWidths = [250, 70, 100, 100];
  
  // Table header
  const headers = ["Description", "Quantity", "Unit Price", "Total"];
  headers.forEach((header, i) => {
    let xPos = margin;
    for (let j = 0; j < i; j++) {
      xPos += colWidths[j];
    }
    
    page.drawText(header, {
      x: xPos,
      y: tableTop,
      size: 12,
      font: helveticaBold,
      color: textColor
    });
  });
  
  // Table content
  items.forEach((item, rowIndex) => {
    const y = tableTop - (rowIndex + 1) * rowHeight;
    
    page.drawText(item.description, {
      x: margin,
      y,
      size: 11,
      font: helveticaFont,
      color: textColor
    });
    
    page.drawText(item.quantity.toString(), {
      x: margin + colWidths[0],
      y,
      size: 11,
      font: helveticaFont,
      color: textColor
    });
    
    page.drawText(`¥${item.unitPrice.toLocaleString()}`, {
      x: margin + colWidths[0] + colWidths[1],
      y,
      size: 11,
      font: helveticaFont,
      color: textColor
    });
    
    page.drawText(`¥${item.total.toLocaleString()}`, {
      x: margin + colWidths[0] + colWidths[1] + colWidths[2],
      y,
      size: 11,
      font: helveticaFont,
      color: textColor
    });
  });
  
  // Draw total
  const totalY = tableTop - (items.length + 2) * rowHeight;
  
  page.drawText("Total Due:", {
    x: margin + colWidths[0] + colWidths[1],
    y: totalY,
    size: 14,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText(`¥${amount.toLocaleString()}`, {
    x: margin + colWidths[0] + colWidths[1] + colWidths[2],
    y: totalY,
    size: 14,
    font: helveticaBold,
    color: textColor
  });
  
  // Draw notes
  const notesY = totalY - 50;
  
  page.drawText("Payment Information:", {
    x: margin,
    y: notesY,
    size: 12,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText("Please use the payment link sent via email to complete your payment.", {
    x: margin,
    y: notesY - 20,
    size: 11,
    font: helveticaFont,
    color: textColor
  });
  
  // Footer
  const footerY = 50;
  
  page.drawText(`Thank you for choosing ${companyName}`, {
    x: page.getWidth() / 2 - 100,
    y: footerY,
    size: 12,
    font: helveticaFont,
    color: textColor
  });
  
  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();
  
  // Convert to Buffer
  return Buffer.from(pdfBytes);
} 