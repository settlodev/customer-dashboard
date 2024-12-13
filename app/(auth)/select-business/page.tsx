import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import BusinessSelector from "@/app/(auth)/select-business/business_list";

export default async function SelectBusinessPage() {
  const responseData = await getBusinessDropDown();
  return <BusinessSelector businesses={responseData} />
}
