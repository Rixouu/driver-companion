"use client"

import dynamic from 'next/dynamic'
import { useLanguage } from "@/components/providers/language-provider"
import type { PDFViewer, Styles } from '@react-pdf/renderer'
import { StyleSheet } from '@react-pdf/renderer'

// Dynamically import each component
const PDFDocument = dynamic(() => import('@react-pdf/renderer').then(mod => mod.Document), {
  ssr: false,
})
const PDFPage = dynamic(() => import('@react-pdf/renderer').then(mod => mod.Page), {
  ssr: false,
})
const PDFText = dynamic(() => import('@react-pdf/renderer').then(mod => mod.Text), {
  ssr: false,
})
const PDFView = dynamic(() => import('@react-pdf/renderer').then(mod => mod.View), {
  ssr: false,
})
const PDFImage = dynamic(() => import('@react-pdf/renderer').then(mod => mod.Image), {
  ssr: false,
})

// Register fonts
import { Font } from '@react-pdf/renderer'
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
})

interface InspectionReportProps {
  inspection: {
    id: string
    date: string
    vehicleId: string
    vehicleName: string
    plateNumber: string
    inspector: string
    sections: {
      [key: string]: {
        items: {
          id: string
          description: string
          status: 'pass' | 'fail'
          notes?: string
        }[]
        photos: {
          url: string
          timestamp: string
        }[]
        voiceNotes: {
          duration: number
          timestamp: string
        }[]
      }
    }
    signature: {
      image: string
      metadata: {
        timestamp: string
        inspector: string
        location?: GeolocationCoordinates
      }
    }
  }
}

// Create styles with proper types
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'NotoSansJP',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  section: {
    marginTop: 15,
    borderBottom: '1px solid #eee',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  item: {
    flexDirection: 'row' as const, // Type assertion for flex direction
    marginBottom: 5,
  },
  itemDescription: {
    flex: 1,
  },
  status: {
    width: 60,
    textAlign: 'right' as const, // Type assertion for text align
  },
  photoGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginTop: 10,
  },
  photo: {
    width: '30%',
    height: 100,
    objectFit: 'cover' as const,
  },
  signature: {
    marginTop: 20,
    alignItems: 'center' as const,
  },
  signatureImage: {
    width: 200,
    height: 100,
    marginBottom: 10,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center' as const,
    color: '#666',
    fontSize: 10,
  },
})

export function InspectionReport({ inspection }: InspectionReportProps) {
  const { t } = useLanguage()

  return (
    <PDFDocument>
      <PDFPage size="A4" style={styles.page}>
        {/* Header */}
        <PDFView style={styles.header}>
          <PDFText style={styles.title}>{t("inspections.title")}</PDFText>
          <PDFText style={styles.subtitle}>
            {t("inspections.vehicleInformation")}: {inspection.vehicleName}
          </PDFText>
          <PDFText style={styles.subtitle}>
            {t("vehicles.plateNumber")}: {inspection.plateNumber}
          </PDFText>
          <PDFText style={styles.subtitle}>
            {t("inspections.date")}: {new Date(inspection.date).toLocaleDateString()}
          </PDFText>
        </PDFView>

        {/* Inspection Sections */}
        {Object.entries(inspection.sections).map(([sectionKey, section]) => (
          <PDFView key={sectionKey} style={styles.section}>
            <PDFText style={styles.sectionTitle}>
              {t(`inspections.sections.${sectionKey}`)}
            </PDFText>

            {/* Items */}
            {section.items.map((item) => (
              <PDFView key={item.id} style={styles.item}>
                <PDFText style={styles.itemDescription}>
                  {t(`inspections.items.${item.id}`)}
                </PDFText>
                <PDFText style={styles.status}>
                  {t(`inspections.actions.${item.status}`)}
                </PDFText>
              </PDFView>
            ))}

            {/* Photos */}
            {section.photos.length > 0 && (
              <PDFView style={styles.photoGrid}>
                {section.photos.map((photo, index) => (
                  <PDFImage
                    key={index}
                    src={photo.url}
                    style={styles.photo}
                  />
                ))}
              </PDFView>
            )}
          </PDFView>
        ))}

        {/* Signature */}
        <PDFView style={styles.signature}>
          <PDFImage
            src={inspection.signature.image}
            style={styles.signatureImage}
          />
          <PDFText style={styles.subtitle}>
            {t("inspections.signature.metadata.inspector")}: {inspection.signature.metadata.inspector}
          </PDFText>
          <PDFText style={styles.subtitle}>
            {t("inspections.signature.metadata.timestamp")}:{" "}
            {new Date(inspection.signature.metadata.timestamp).toLocaleString()}
          </PDFText>
        </PDFView>

        {/* Footer */}
        <PDFText style={styles.footer}>
          {t("inspections.report.generatedAt")}: {new Date().toLocaleString()}
        </PDFText>
      </PDFPage>
    </PDFDocument>
  )
} 