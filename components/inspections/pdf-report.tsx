"use client"

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { useLanguage } from "@/components/providers/language-provider"

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

// Register fonts if needed
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
})

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
    flexDirection: 'row',
    marginBottom: 5,
  },
  itemDescription: {
    flex: 1,
  },
  status: {
    width: 60,
    textAlign: 'right',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  photo: {
    width: '30%',
    height: 100,
    objectFit: 'cover',
  },
  signature: {
    marginTop: 20,
    alignItems: 'center',
  },
  signatureImage: {
    width: 200,
    height: 100,
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666',
    fontSize: 10,
  },
})

export function InspectionReport({ inspection }: InspectionReportProps) {
  const { t } = useLanguage()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("inspections.title")}</Text>
          <Text style={styles.subtitle}>
            {t("inspections.vehicleInformation")}: {inspection.vehicleName}
          </Text>
          <Text style={styles.subtitle}>
            {t("vehicles.plateNumber")}: {inspection.plateNumber}
          </Text>
          <Text style={styles.subtitle}>
            {t("inspections.date")}: {new Date(inspection.date).toLocaleDateString()}
          </Text>
        </View>

        {/* Inspection Sections */}
        {Object.entries(inspection.sections).map(([sectionKey, section]) => (
          <View key={sectionKey} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t(`inspections.sections.${sectionKey}`)}
            </Text>

            {/* Items */}
            {section.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemDescription}>
                  {t(`inspections.items.${item.id}`)}
                </Text>
                <Text style={styles.status}>
                  {t(`inspections.actions.${item.status}`)}
                </Text>
              </View>
            ))}

            {/* Photos */}
            {section.photos.length > 0 && (
              <View style={styles.photoGrid}>
                {section.photos.map((photo, index) => (
                  <Image
                    key={index}
                    src={photo.url}
                    style={styles.photo}
                  />
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Signature */}
        <View style={styles.signature}>
          <Image
            src={inspection.signature.image}
            style={styles.signatureImage}
          />
          <Text style={styles.subtitle}>
            {t("inspections.signature.metadata.inspector")}: {inspection.signature.metadata.inspector}
          </Text>
          <Text style={styles.subtitle}>
            {t("inspections.signature.metadata.timestamp")}:{" "}
            {new Date(inspection.signature.metadata.timestamp).toLocaleString()}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {t("inspections.report.generatedAt")}: {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  )
} 