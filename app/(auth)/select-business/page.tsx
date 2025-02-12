import { redirect } from 'next/navigation';
import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import BusinessSelector from "@/app/(auth)/select-business/business_list";

export default async function SelectBusinessPage() {
  const data = await getBusinessDropDown();

  if (data.length == 0) {
    redirect('/business-registration');
  }

  return ( <BusinessSelector businesses={data} /> );
}
