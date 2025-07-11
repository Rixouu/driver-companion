"use client";

import { useState } from 'react';
import { saveAs } from 'file-saver';
import { toast } from '@/components/ui/use-toast'; // Assuming toast is importable this way
import { formatDate } from '@/lib/utils/formatting';
import type { ExtendedInspection, InspectionItem, InspectionItemTemplate } from '@/components/inspections/inspection-details'; // Adjust path as needed
import { useI18n } from '@/lib/i18n/context'; // Or wherever useI18n is located

interface UseInspectionReportExportProps {
  inspection: ExtendedInspection;
  itemsWithTemplates: InspectionItem[];
}

/**
 * Defines the shape of the object returned by the `useInspectionReportExport` hook.
 */
interface UseInspectionReportExportReturn {
  /** Boolean indicating if an export operation is currently in progress. */
  isExporting: boolean;
  /** Function to set the `isExporting` state. */
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>;
  /** Function to trigger the browser's print dialog for the report. */
  printReport: () => void;
  /** Function to export the inspection report as a CSV file. */
  exportCSV: () => void;
  /** Asynchronous function to export the inspection report as a PDF file. */
  exportPDF: () => Promise<void>;
  /** 
   * Retrieves the translated name of an inspection item template.
   * @param template - The inspection item template object.
   * @returns The translated template name or a fallback string.
   */
  getTemplateName: (template?: InspectionItemTemplate) => string;
  /** 
   * Checks if the code is running in a browser environment.
   * @returns True if running in a browser, false otherwise.
   */
  isBrowser: () => boolean;
}

// Helper to check if running in a browser environment
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Custom hook to manage inspection report exporting functionalities (CSV, PDF, Print).
 *
 * This hook encapsulates the logic for generating and downloading inspection reports
 * in various formats. It manages the export loading state and provides helper functions
 * for template name translation and browser environment checking.
 *
 * @param props - The properties required by the hook.
 * @param props.inspection - The extended inspection object containing all details.
 * @param props.itemsWithTemplates - An array of inspection items, each potentially with its template data.
 * @returns An object containing state and functions for report exporting.
 */
export function useInspectionReportExport({
  inspection,
  itemsWithTemplates,
}: UseInspectionReportExportProps): UseInspectionReportExportReturn {
  const { t, locale } = useI18n();
  const [isExporting, setIsExporting] = useState(false);

  // Helper function to get template name (moved from InspectionDetails)
  // This needs access to `t` and `locale` from the hook's scope.
  function getTemplateName(template?: InspectionItemTemplate): string {
    if (!template?.name_translations) return t('common.noResults');
    
    const translations = template.name_translations;
    
    if (locale && translations[locale]) {
      return translations[locale];
    }
    return translations.en || translations.ja || Object.values(translations)[0] || t('common.noResults');
  }

  const printReport = () => {
    if (!isBrowser()) return;
    window.print();
    toast({
      title: t('inspections.messages.printStarted'),
    });
  };

  const exportCSV = () => {
    if (!isBrowser()) return;

    setIsExporting(true);
    try {
      const formattedDate = inspection.date
        ? new Date(inspection.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      const vehicleName = inspection.vehicle?.name || 'vehicle';
      const sanitizedVehicleName = vehicleName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `inspection-report-${formattedDate}-${sanitizedVehicleName}.csv`;

      const vehicleInfo = [
        [t('inspections.details.vehicleInfo.title'), ''],
        [t('vehicles.fields.name'), inspection.vehicle?.name || t('common.notAvailable')],
        [t('vehicles.fields.plateNumber'), inspection.vehicle?.plate_number || t('common.notAvailable')],
        [t('vehicles.fields.brand'), inspection.vehicle?.brand || t('common.notAvailable')],
        [t('vehicles.fields.model'), inspection.vehicle?.model || t('common.notAvailable')],
        ['', ''],
      ];

      const inspectionInfoData = [
        [t('inspections.details.inspectionInfo.title'), ''],
        [t('inspections.dateLabel'), inspection.date ? formatDate(inspection.date) : t('common.notAvailable')],
        [t('inspections.typeLabel'), inspection.type || t('common.notAvailable')],
        [t('inspections.statusLabel'), inspection.status ? t(`inspections.statusValues.${inspection.status.toLowerCase()}`) : t('common.notAvailable')],
        [t('inspections.inspectorLabel'), inspection.inspector?.name || t('common.notAvailable')],
        [t('inspections.inspectorEmailLabel'), inspection.inspector?.email || t('common.notAvailable')],
        ['', ''],
      ];
      
      const headers = [t('inspections.details.items.itemHeader'), t('inspections.details.items.statusHeader'), t('inspections.details.items.notesHeader')];
      const rows = itemsWithTemplates.map(item => {
        const templateName = getTemplateName(item.template) || t('common.unknown');
        const status = item.status ? t(`inspections.statusValues.${item.status.toLowerCase()}`) : t('inspections.statusValues.pending');
        const notes = item.notes || '';
        return `"${templateName}","${status}","${notes}"`;
      });

      const csvContent = [
        ...vehicleInfo.map(row => row.map(cell => `"${cell}"`).join(',')),
        ...inspectionInfoData.map(row => row.map(cell => `"${cell}"`).join(',')),
        headers.join(','),
        ...rows,
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, filename);

      toast({
        title: t('inspections.messages.exportSuccess'),
        description: t('inspections.messages.csvDownloaded', { filename }),
      });
    } catch (error) {
      console.error('Error exporting CSV report:', error);
      toast({
        title: t('inspections.messages.exportError'),
        description: (error instanceof Error) ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!isBrowser()) return;
    
    setIsExporting(true); // Use hook's own setIsExporting
    
    try {
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      const passedItemsCount = itemsWithTemplates.filter(item => item.status === 'pass').length;
      const failedItemsCount = itemsWithTemplates.filter(item => item.status === 'fail').length;
      const notesItemsCount = itemsWithTemplates.filter(item => item.notes).length;
      const photosItemsCount = itemsWithTemplates.reduce((count, item) => count + (item.inspection_photos?.length || 0), 0);
      const currentLanguage = locale || 'en';
      const pdfContainer = document.createElement('div');
      pdfContainer.className = 'pdf-export-container';
      pdfContainer.classList.add(`lang-${currentLanguage}`);
      pdfContainer.style.fontFamily = 'Work Sans, sans-serif';
      pdfContainer.style.margin = '0';
      pdfContainer.style.padding = '0';
      pdfContainer.style.color = '#333';
      pdfContainer.style.backgroundColor = '#fff';
      pdfContainer.style.width = '190mm';
      pdfContainer.style.boxSizing = 'border-box';
      pdfContainer.style.position = 'relative';
      pdfContainer.style.borderTop = '2px solid #FF2600';
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(fontLink);
      const logoContainer = document.createElement('div');
      logoContainer.style.textAlign = 'left';
      logoContainer.style.marginBottom = '20px';
      logoContainer.style.marginTop = '30px';
      logoContainer.style.paddingLeft = '20px';
      const logo = document.createElement('img');
      logo.src = '/img/driver-header-logo.png';
      logo.alt = 'Driver Logo';
      logo.style.height = '50px';
      logo.crossOrigin = 'anonymous';
      logo.onerror = () => {
        console.warn('Failed to load logo, using fallback text');
        const fallbackText = document.createElement('h2');
        fallbackText.textContent = 'DRIVER';
        fallbackText.style.fontSize = '24px';
        fallbackText.style.color = '#FF2600';
        fallbackText.style.fontWeight = 'bold';
        fallbackText.style.margin = '0';
        logoContainer.innerHTML = '';
        logoContainer.appendChild(fallbackText);
      };
      logoContainer.appendChild(logo);
      pdfContainer.appendChild(logoContainer);
      const reportHeader = document.createElement('div');
      reportHeader.style.padding = '0 20px';
      const reportTitleElement = document.createElement('h1');
      reportTitleElement.textContent = t('inspections.details.printTitle');
      reportTitleElement.style.fontSize = '28px';
      reportTitleElement.style.fontWeight = 'bold';
      reportTitleElement.style.margin = '0 0 5px 0';
      reportTitleElement.style.color = '#333';
      const inspectionDate = inspection.date ? new Date(inspection.date) : new Date();
      const formattedDateForPDF = formatDate(inspectionDate); // formatDate from hook's import
      const formattedTime = inspectionDate.toLocaleTimeString(currentLanguage === 'ja' ? 'ja-JP' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const reportDateElement = document.createElement('p');
      reportDateElement.textContent = `${t('inspections.dateLabel')}: ${formattedDateForPDF} ${formattedTime}`;
      reportDateElement.style.fontSize = '16px';
      reportDateElement.style.margin = '0 0 20px 0';
      reportDateElement.style.color = '#666';
      reportHeader.appendChild(reportTitleElement);
      reportHeader.appendChild(reportDateElement);
      pdfContainer.appendChild(reportHeader);
      const separator = document.createElement('hr');
      separator.style.border = 'none';
      separator.style.borderBottom = '1px solid #e0e0e0';
      separator.style.margin = '0 0 20px 0';
      pdfContainer.appendChild(separator);
      const firstPageContent = document.createElement('div');
      const vehicleSection = document.createElement('div');
      vehicleSection.style.margin = '0 20px 20px';
      vehicleSection.style.padding = '0';
      vehicleSection.style.border = '1px solid #e0e0e0';
      vehicleSection.style.borderRadius = '4px';
      const vehicleTitleContainer = document.createElement('div');
      vehicleTitleContainer.style.backgroundColor = '#f9f9f9';
      vehicleTitleContainer.style.padding = '10px 20px';
      vehicleTitleContainer.style.borderBottom = '1px solid #e0e0e0';
      const vehicleTitle = document.createElement('h2');
      vehicleTitle.textContent = t('inspections.details.vehicleInfo.title');
      vehicleTitle.style.fontSize = '18px';
      vehicleTitle.style.fontWeight = 'bold';
      vehicleTitle.style.margin = '0';
      vehicleTitle.style.color = '#333';
      vehicleTitleContainer.appendChild(vehicleTitle);
      vehicleSection.appendChild(vehicleTitleContainer);
      const vehicleDetailsContainer = document.createElement('div');
      vehicleDetailsContainer.style.padding = '15px 20px';
      vehicleDetailsContainer.style.backgroundColor = '#fff';
      const vehicleGrid = document.createElement('div');
      vehicleGrid.style.display = 'grid';
      vehicleGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      vehicleGrid.style.gap = '10px 30px';
      function createDetailItem(label: string, value?: string | null) {
        const itemContainer = document.createElement('div');
        const labelDiv = document.createElement('div');
        labelDiv.textContent = label;
        labelDiv.style.color = '#666';
        labelDiv.style.fontSize = '14px';
        labelDiv.style.marginBottom = '2px';
        const valueDiv = document.createElement('div');
        valueDiv.textContent = value || t('common.notAvailable');
        valueDiv.style.fontSize = '16px';
        valueDiv.style.fontWeight = 'normal';
        valueDiv.style.color = '#333';
        itemContainer.appendChild(labelDiv);
        itemContainer.appendChild(valueDiv);
        return itemContainer;
      }
      vehicleGrid.appendChild(createDetailItem(t('vehicles.fields.name'), inspection.vehicle?.name));
      vehicleGrid.appendChild(createDetailItem(t('vehicles.fields.brand'), inspection.vehicle?.brand));
      vehicleGrid.appendChild(createDetailItem(t('vehicles.fields.plateNumber'), inspection.vehicle?.plate_number));
      vehicleGrid.appendChild(createDetailItem(t('vehicles.fields.model'), inspection.vehicle?.model));
      vehicleGrid.appendChild(createDetailItem(t('vehicles.fields.year'), inspection.vehicle?.year?.toString()));
      vehicleGrid.appendChild(createDetailItem(t('vehicles.fields.vin'), inspection.vehicle?.vin));
      vehicleDetailsContainer.appendChild(vehicleGrid);
      vehicleSection.appendChild(vehicleDetailsContainer);
      firstPageContent.appendChild(vehicleSection);
      const summarySection = document.createElement('div');
      summarySection.style.margin = '0 20px 20px';
      summarySection.style.padding = '0';
      summarySection.style.border = '1px solid #e0e0e0';
      summarySection.style.borderRadius = '4px';
      const summaryTitleContainer = document.createElement('div');
      summaryTitleContainer.style.backgroundColor = '#f9f9f9';
      summaryTitleContainer.style.padding = '10px 20px';
      summaryTitleContainer.style.borderBottom = '1px solid #e0e0e0';
      const summaryTitle = document.createElement('h2');
      summaryTitle.textContent = t('inspections.details.summary.title');
      summaryTitle.style.fontSize = '18px';
      summaryTitle.style.fontWeight = 'bold';
      summaryTitle.style.margin = '0';
      summaryTitle.style.color = '#333';
      summaryTitleContainer.appendChild(summaryTitle);
      summarySection.appendChild(summaryTitleContainer);
      const summaryDetailsContainer = document.createElement('div');
      summaryDetailsContainer.style.padding = '15px 20px';
      summaryDetailsContainer.style.backgroundColor = '#fff';
      const summaryGrid = document.createElement('div');
      summaryGrid.style.display = 'grid';
      summaryGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      summaryGrid.style.gap = '10px 30px';
      summaryGrid.appendChild(createDetailItem(t('inspections.typeLabel'), inspection.type ? t(`inspections.typeValues.${inspection.type.toLowerCase()}`) : t('common.notAvailable')));
      summaryGrid.appendChild(createDetailItem(t('inspections.statusLabel'), inspection.status ? t(`inspections.statusValues.${inspection.status.toLowerCase()}`) : t('common.notAvailable')));
      summaryGrid.appendChild(createDetailItem(t('inspections.inspectorLabel'), inspection.inspector?.name || t('common.notAvailable')));
      summaryGrid.appendChild(createDetailItem(t('inspections.inspectorEmailLabel'), inspection.inspector?.email || t('common.notAvailable')));
      summaryGrid.appendChild(createDetailItem(t('inspections.details.summary.passedItems'), passedItemsCount.toString()));
      summaryGrid.appendChild(createDetailItem(t('inspections.details.summary.failedItems'), failedItemsCount.toString()));
      summaryGrid.appendChild(createDetailItem(t('inspections.details.summary.itemsWithNotes'), notesItemsCount.toString()));
      summaryGrid.appendChild(createDetailItem(t('inspections.details.summary.photosTaken'), photosItemsCount.toString()));
      summaryDetailsContainer.appendChild(summaryGrid);
      summarySection.appendChild(summaryDetailsContainer);
      firstPageContent.appendChild(summarySection);
      pdfContainer.appendChild(firstPageContent);
      const itemsSection = document.createElement('div');
      itemsSection.style.margin = '0 20px 20px';
      itemsSection.style.padding = '0';
      const itemsTitleContainer = document.createElement('div');
      itemsTitleContainer.style.padding = '10px 0px';
      itemsTitleContainer.style.borderBottom = '1px solid #e0e0e0';
      itemsTitleContainer.style.marginBottom = '15px';
      const itemsTitleElement = document.createElement('h2');
      itemsTitleElement.textContent = t('inspections.details.items.title');
      itemsTitleElement.style.fontSize = '18px';
      itemsTitleElement.style.fontWeight = 'bold';
      itemsTitleElement.style.margin = '0';
      itemsTitleElement.style.color = '#333';
      itemsTitleContainer.appendChild(itemsTitleElement);
      itemsSection.appendChild(itemsTitleContainer);
      itemsWithTemplates.forEach((item, index) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'inspection-item-card-pdf';
        itemCard.style.border = '1px solid #eee';
        itemCard.style.borderRadius = '4px';
        itemCard.style.padding = '15px';
        itemCard.style.marginBottom = '15px';
        itemCard.style.backgroundColor = '#fff';
        itemCard.style.pageBreakInside = 'avoid';
        const itemName = document.createElement('h3');
        itemName.textContent = `${index + 1}. ${getTemplateName(item.template)}`; // getTemplateName from hook
        itemName.style.fontSize = '16px';
        itemName.style.fontWeight = 'bold';
        itemName.style.margin = '0 0 10px 0';
        itemName.style.color = '#333';
        const itemStatus = document.createElement('p');
        const statusText = item.status ? t(`inspections.statusValues.${item.status.toLowerCase()}`) : t('inspections.statusValues.pending');
        itemStatus.innerHTML = `${t('inspections.details.items.statusHeader')}: <span style="font-weight: bold; color: ${item.status === 'fail' ? '#dc3545' : item.status === 'pass' ? '#28a745' : '#6c757d'};">${statusText}</span>`;
        itemStatus.style.fontSize = '14px';
        itemStatus.style.margin = '0 0 5px 0';
        itemStatus.style.color = '#555';
        itemCard.appendChild(itemName);
        itemCard.appendChild(itemStatus);
        if (item.notes) {
          const itemNotes = document.createElement('p');
          itemNotes.innerHTML = `${t('inspections.details.items.notesHeader')}: <span style="font-style: italic;">${item.notes}</span>`;
          itemNotes.style.fontSize = '14px';
          itemNotes.style.margin = '0 0 10px 0';
          itemNotes.style.color = '#555';
          itemCard.appendChild(itemNotes);
        }
        if (item.inspection_photos && item.inspection_photos.length > 0) {
          const photosContainer = document.createElement('div');
          photosContainer.style.marginTop = '10px';
          const photosTitle = document.createElement('p');
          photosTitle.textContent = t('inspections.details.items.photosHeader');
          photosTitle.style.fontSize = '14px';
          photosTitle.style.fontWeight = '500';
          photosTitle.style.margin = '0 0 5px 0';
          photosContainer.appendChild(photosTitle);
          item.inspection_photos.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo.photo_url;
            img.alt = 'Inspection photo';
            img.style.maxWidth = '150px';
            img.style.maxHeight = '150px';
            img.style.borderRadius = '4px';
            img.style.marginRight = '10px';
            img.style.marginBottom = '10px';
            img.style.border = '1px solid #ddd';
            img.crossOrigin = 'anonymous';
            photosContainer.appendChild(img);
          });
          itemCard.appendChild(photosContainer);
        }
        itemsSection.appendChild(itemCard);
      });
      pdfContainer.appendChild(itemsSection);
      const footerText = `${t('inspections.details.pdfFooter.generatedOn')} ${new Date().toLocaleDateString(currentLanguage === 'ja' ? 'ja-JP' : 'en-US')} | ${t('inspections.details.pdfFooter.vehicleName')}: ${inspection.vehicle?.name || 'N/A'}`;
      document.body.appendChild(pdfContainer);
      const vehicleNameForFile = inspection.vehicle?.name || 'vehicle';
      const sanitizedVehicleName = vehicleNameForFile.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `inspection-report-${inspection.id.substring(0,8)}-${sanitizedVehicleName}.pdf`;
      const opt = {
        margin: [5, 5, 15, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.page-break-before' },
        worker: true,
        html2pdf__pageCounter: function(currentPage: number, totalPages: number) { // Explicitly type if possible, or use any
            return (
                `<div style="position: absolute; bottom: 5mm; left: 5mm; width: calc(100% - 10mm); font-size: 10px; color: #888; text-align: center;">` +
                `${footerText} | Page ${currentPage} of ${totalPages}` +
                `</div>`
            );
        }
      };
      await html2pdf().from(pdfContainer).set(opt).save();
      document.body.removeChild(pdfContainer);
      document.head.removeChild(fontLink);

      toast({
        title: t('inspections.messages.exportSuccess'),
        description: t('inspections.messages.pdfDownloaded', { filename }),
      });
    } catch (error) {
      console.error('Error exporting PDF report:', error);
      toast({
        title: t('inspections.messages.exportError'),
        description: (error instanceof Error) ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false); // Use hook's own setIsExporting
    }
  };

  return {
    isExporting,
    setIsExporting,
    printReport,
    exportCSV,
    exportPDF,
    getTemplateName,
    isBrowser,
  };
}
