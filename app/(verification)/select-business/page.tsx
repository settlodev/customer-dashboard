import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import {SelectBusiness} from "@/app/(verification)/select-business/business_list";

export default async function SelectBusinessPage() {
  const responseData = await getBusinessDropDown();
  return <SelectBusiness businesses={responseData} />
}
