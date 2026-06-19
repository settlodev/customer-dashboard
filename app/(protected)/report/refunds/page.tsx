import { requireReportsReadAll } from "@/lib/auth-utils";
import RefundReportClient from "./refunds-client";

export default async function Page() {
  await requireReportsReadAll();
  return <RefundReportClient />;
}
