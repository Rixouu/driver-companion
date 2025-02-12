"use client"

import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/layouts/page-container"
import { useLanguage } from "@/components/providers/language-provider"

export default function InspectionPage() {
  const { vehicleId } = useParams()
  const { t } = useLanguage()

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Vehicle Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            {t("inspections.vehicleInfo.title")}
          </h2>
          {/* ... vehicle info content ... */}
        </section>

        {/* Progress Indicators */}
        <section>
          <h3 className="text-lg font-medium mb-4">
            {t("inspections.progress.title")}
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div>{t("inspections.progress.front")}</div>
            <div>{t("inspections.progress.leftSide")}</div>
            <div>{t("inspections.progress.rightSide")}</div>
            <div>{t("inspections.progress.rear")}</div>
          </div>
        </section>

        {/* Checklist */}
        <section>
          <h3 className="text-lg font-medium mb-4">
            {t("inspections.checklist.title")}
          </h3>
          {/* ... checklist items ... */}
        </section>

        {/* Photos Section */}
        <section>
          <h3 className="text-lg font-medium mb-4">
            {t("inspections.photos.title")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("inspections.photos.instructions")}
          </p>
          {/* ... photo upload/capture UI ... */}
        </section>

        {/* Voice Notes */}
        <section>
          <h3 className="text-lg font-medium mb-4">
            {t("inspections.voiceNotes.title")}
          </h3>
          {/* ... voice recording UI ... */}
        </section>

        {/* Signature */}
        <section>
          <h3 className="text-lg font-medium mb-4">
            {t("inspections.signature.title")}
          </h3>
          {/* ... signature pad ... */}
        </section>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">
            {t("inspections.actions.cancel")}
          </Button>
          <Button>
            {t("inspections.actions.submit")}
          </Button>
        </div>
      </div>
    </PageContainer>
  )
} 