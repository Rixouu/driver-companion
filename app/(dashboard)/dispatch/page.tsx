import { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import RealTimeDispatchCenter from "@/components/dispatch/real-time-dispatch-center";

// Force dynamic rendering for real-time features
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { t } = await getDictionary();
    
    return {
      title: "Dispatch Board",
      description: t("dispatch.description") || "Manage assignments and track vehicles in real-time",
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Dispatch Board",
      description: "Manage assignments and track vehicles in real-time",
    };
  }
}

export default async function DispatchPage() {
  const { t } = await getDictionary();
  
  return (
    <div className="w-full">
      <RealTimeDispatchCenter />
    </div>
  );
} 