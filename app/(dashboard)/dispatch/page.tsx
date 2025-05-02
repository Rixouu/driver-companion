import { Metadata } from "next";
import DispatchBoard from "@/components/dispatch/dispatch-board";
import { PageHeader } from "@/components/page-header";
import { getDictionary } from "@/lib/i18n/server";

// Force dynamic rendering to handle cookies
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
  const { t } = await getDictionary();
  
  return {
      title: t("dispatch.title") || "Dispatch Board",
      description: t("dispatch.description") || "Manage driver and vehicle assignments for bookings",
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Dispatch Board",
      description: "Manage driver and vehicle assignments for bookings",
  };
  }
}

export default async function DispatchPage() {
  const { t } = await getDictionary();
  
  return (
    <div className="container mx-auto px-1 py-3 space-y-3">
      <PageHeader
        title={t("dispatch.title")}
        description={t("dispatch.description")}
      />
      <DispatchBoard />
    </div>
  );
} 