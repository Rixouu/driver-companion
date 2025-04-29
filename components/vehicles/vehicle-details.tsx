"use client"

import { Button } from "@/components/ui/button"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { useState } from "react"
import { Edit, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { VehicleTabs } from "./vehicle-tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { Card, CardHeader } from "@/components/ui/card"

interface VehicleDetailsProps {
  vehicle: DbVehicle
}

export function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicle.id)

      if (error) throw error

      toast({
        title: t("vehicles.messages.deleteSuccess"),
      })

      router.push("/vehicles")
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: t("vehicles.messages.deleteError"),
        description: error?.message || t("vehicles.messages.hasAssociatedRecords"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Header Card */}
      <Card className="shadow-sm print-hide">
        <CardHeader className="space-y-0 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Link href="/vehicles" legacyBehavior>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common.backToList')}
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {t('common.edit')}
            </Button>
          </div>
        </CardHeader>
      </Card>
      {/* Vehicle Tabs */}
      <VehicleTabs vehicle={vehicle} />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('vehicles.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('vehicles.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 