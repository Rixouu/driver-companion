import { getDictionary } from "@/lib/i18n/server";
import DispatchAssignments from "@/components/dispatch/dispatch-assignments";

export const dynamic = 'force-dynamic';

export default async function DispatchAssignmentsPage() {
  return (
    <div className="w-full">
      <DispatchAssignments />
    </div>
  );
} 