import { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import DispatchTimetable from "@/components/dispatch/dispatch-timetable";

// Force dynamic rendering for real-time features
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { t } = await getDictionary();
    
    return {
      title: "Dispatch Timetable",
      description: t("dispatch.timetable.description") || "View and manage bookings in a weekly timetable format",
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Dispatch Timetable",
      description: "View and manage bookings in a weekly timetable format",
    };
  }
}

export default async function TimetablePage() {
  const { t } = await getDictionary();
  
  return (
    <div className="w-full">
      <DispatchTimetable entries={[]} />
    </div>
  );
}
