import { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import DispatchAssignments from "@/components/dispatch/dispatch-assignments";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { t } = await getDictionary();
    
    return {
      title: t("dispatch.assignments.title") || "Driver & Vehicle Assignments",
      description: t("dispatch.assignments.description") || "Manage driver and vehicle assignments for bookings",
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Driver & Vehicle Assignments",
      description: "Manage driver and vehicle assignments for bookings",
    };
  }
}

export default async function DispatchAssignmentsPage() {
  return (
    <div className="w-full">
      <DispatchAssignments />
    </div>
  );
} 