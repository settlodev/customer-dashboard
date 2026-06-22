import { requireReportsReadAll } from "@/lib/auth-utils";
import CreditReportClient from "./credit-client";

export default async function Page() {
  await requireReportsReadAll();
  return <CreditReportClient />;
}
