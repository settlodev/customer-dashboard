import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import {SelectBusiness} from "./business_list";

export default async function SelectBusinessPage() {
  const responseData = await getBusinessDropDown();
  return <SelectBusiness businesses={responseData} />
}
