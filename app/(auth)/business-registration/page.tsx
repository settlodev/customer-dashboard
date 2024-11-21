import CreatedBusinessList from "./business_list";

import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import RegisterForm from "@/components/forms/register_form";

export default async function BusinessRegistrationPage() {

  const responseData = await getBusinessDropDown();

    return (responseData.length > 0 ?
        <CreatedBusinessList businesses={responseData}/>:
        <RegisterForm step="step3" />
    )
}
