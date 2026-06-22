import { requireReportsReadAll } from "@/lib/auth-utils";
import StaffReportClient from "./staff-client";

export default async function Page() {
  await requireReportsReadAll();
  return <StaffReportClient />;
}
