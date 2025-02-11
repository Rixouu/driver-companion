"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/components/providers/language-provider"
import { Download, Share2, Archive, CheckCircle2, AlertCircle, Clock, Camera } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"

interface InspectionDetailsProps {
  vehicleId: string
}

export function InspectionDetails({ vehicleId }: InspectionDetailsProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("details")

  // TODO: Replace with actual API call
  const details = {
    id: "INS-2024-001",
    date: new Date(),
    inspector: "John Doe",
    status: "completed",
    duration: "45 minutes",
    location: "Main Service Center",
    notes: "Regular inspection completed. Minor issues found with left rear tire.",
    signature: {
      image: "/mock/signature.png",
      timestamp: new Date(),
      location: "35.6762° N, 139.6503° E",
      device: "iPad Pro",
    },
    photos: [
      { url: "/mock/inspection-1.jpg", section: "Front", timestamp: new Date() },
      { url: "/mock/inspection-2.jpg", section: "Left Side", timestamp: new Date() },
      { url: "/mock/inspection-3.jpg", section: "Issue - Left Rear Tire", timestamp: new Date() },
    ],
    results: {
      total: 24,
      passed: 23,
      failed: 1,
      skipped: 0,
    },
    history: [
      {
        id: "INS-2024-000",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        inspector: "Jane Smith",
        status: "completed",
        issues: 0,
      },
      {
        id: "INS-2023-099",
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        inspector: "John Doe",
        status: "completed",
        issues: 2,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("inspections.details.title")}</CardTitle>
              <CardDescription>ID: {details.id}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t("inspections.actions.export")}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                {t("inspections.actions.share")}
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                {t("inspections.actions.archive")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("inspections.details.date")}
                </p>
                <p className="text-base">{format(details.date, "PPP")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("inspections.details.inspector")}
                </p>
                <p className="text-base">{details.inspector}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("inspections.details.status")}
                </p>
                <Badge variant="outline" className="mt-1">
                  {t(`status.${details.status}`)}
                </Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("inspections.details.duration")}
                </p>
                <p className="text-base">{details.duration}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("inspections.details.location")}
                </p>
                <p className="text-base">{details.location}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("inspections.details.results")}
                </p>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{details.results.passed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>{details.results.failed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>{details.results.skipped}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("inspections.details.notes")}
                </p>
                <p className="text-base">{details.notes}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Details, Photos, History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">{t("common.details")}</TabsTrigger>
          <TabsTrigger value="photos">{t("inspections.details.photos")}</TabsTrigger>
          <TabsTrigger value="history">{t("inspections.details.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{t("inspections.details.signature")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <Image
                    src={details.signature.image}
                    alt="Inspector signature"
                    width={300}
                    height={100}
                    className="dark:invert"
                  />
                </div>
                <div className="grid gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("inspections.signature.metadata.timestamp")}
                    </span>
                    <span>{format(details.signature.timestamp, "PPp")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("inspections.signature.metadata.location")}
                    </span>
                    <span>{details.signature.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("inspections.signature.metadata.device")}
                    </span>
                    <span>{details.signature.device}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>{t("inspections.details.photos")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {details.photos.map((photo, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{photo.section}</span>
                      <span className="text-muted-foreground">
                        {format(photo.timestamp, "p")}
                      </span>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={photo.url}
                        alt={`Inspection photo - ${photo.section}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t("inspections.details.history")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {details.history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-4 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{record.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(record.date, "PPP")} • {record.inspector}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {t(`status.${record.status}`)}
                      </Badge>
                      {record.issues > 0 ? (
                        <Badge variant="destructive">
                          {record.issues} {t("inspections.details.issues")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t("inspections.details.noIssues")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 