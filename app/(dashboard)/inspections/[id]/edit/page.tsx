import { createServerClient } from "@/lib/supabase/index";
import { cookies } from 'next/headers';
import { StepBasedInspectionForm } from "@/components/inspections/step-based-inspection-form";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/server";
// import { Breadcrumbs } from "@/components/shared/breadcrumbs";

interface InspectionEditPageProps {
  params: { id: string };
}

export default async function InspectionEditPage({ params }: InspectionEditPageProps) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { t } = await getDictionary();

  const { data: inspection, error: inspectionError } = await supabase
    .from("inspections")
    .select("*, vehicle:vehicles(*)")
    .eq("id", params.id)
    .single();

  if (inspectionError || !inspection) {
    console.error("Error fetching inspection for edit:", inspectionError);
    redirect("/inspections?error=not_found");
  }

  if (inspection.status === "completed" || inspection.status === "cancelled") {
    redirect(`/inspections/${params.id}?error=already_completed`);
  }

  // Fetch all vehicles for the selector, in case the user wants to change the vehicle.
  // However, the form is currently set up to take a vehicleId and not change it.
  // For now, we pass the specific vehicle associated with the inspection.
  // If changing vehicle during edit is a requirement, the form needs adjustment.
  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*")
    .order("name", { ascending: true });

  if (vehiclesError) {
    console.error("Error fetching vehicles for edit page:", vehiclesError);
    // We can still proceed without the full vehicle list if the current vehicle is loaded
  }

  // const breadcrumbItems = [
  //   { label: t("dashboard.title"), href: "/" },
  //   { label: t("inspections.title"), href: "/inspections" },
  //   {
  //     label: inspection.name || t("inspections.unnamedInspection"),
  //     href: `/inspections/${inspection.id}`,
  //   },
  //   { label: t("common.edit") },
  // ];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* <Breadcrumbs items={breadcrumbItems} /> */}
      <div className="my-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("inspections.editTitle")}
        </h1>
        <p className="text-muted-foreground">
          {t("inspections.editSubtitle")}
        </p>
      </div>

      {inspection.vehicle ? (
        <StepBasedInspectionForm
          inspectionId={inspection.id}
          vehicleId={inspection.vehicle_id}
          bookingId={inspection.booking_id || undefined}
          vehicles={vehicles || [inspection.vehicle]} // Pass all vehicles or at least the current one
        />
      ) : (
        <div className="text-red-500">
          {t("inspections.errors.vehicleNotAssociated")}
        </div>
      )}
    </div>
  );
} 