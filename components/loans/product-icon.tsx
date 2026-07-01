import { Boxes, Smartphone, Wallet, type LucideIcon } from "lucide-react";

import type { LoanProductKey } from "@/types/loans/type";

/** Product → icon. Reused by the cards, product picker and detail header. */
export const PRODUCT_ICONS: Record<LoanProductKey, LucideIcon> = {
  DEVICE_FINANCING: Smartphone,
  STOCK_LOAN: Boxes,
  WORKING_CAPITAL: Wallet,
};
