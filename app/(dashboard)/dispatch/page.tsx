import { Metadata } from "next";
import DispatchBoard from "@/components/dispatch/dispatch-board";
import { PageHeader } from "@/components/page-header";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  
  return {
    title: t("dispatch.title"),
    description: t("dispatch.description"),
  };
}

export default async function DispatchPage() {
  const { t } = await getDictionary();
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title={t("dispatch.title")}
        description={t("dispatch.description")}
      />
      <DispatchBoard />
    </div>
  );
} 