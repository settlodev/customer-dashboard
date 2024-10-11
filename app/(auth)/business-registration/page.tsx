import BusinessRegistrationForm from "@/components/forms/business_registration_form";
import CreatedBusinessList from "./business_list";

import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";


export default async function BusinessRegistrationPage() {
  
  const responseData = await getBusinessDropDown();

    return (responseData.length > 0 ?
        <CreatedBusinessList businesses={responseData}/>:
        <BusinessRegistrationForm />

    )
}
