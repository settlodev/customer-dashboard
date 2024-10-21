"use client";
import CreatedBusinessList from "./business_list";

import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import RegisterForm from "@/components/forms/register_form";

export default function BusinessRegistrationPage() {
  const router = useRouter();
  const getBusinesses=async()=>{
    return await getBusinessDropDown();
  }

  const responseData = getBusinesses();

  if (responseData.length > 0) {
    //router.push(`/business-location?business=${businesses[0].id}`);
    router.push(`/select-business`);
    return null; //preventing the table
  }

    return (responseData.length > 0 ?
        <CreatedBusinessList businesses={responseData}/>:
        <RegisterForm step="step2" />
        /*<BusinessRegistrationForm />*/
    )
}
