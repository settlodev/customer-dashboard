import { getBusinessDropDown } from '@/lib/actions/business/get-current-business';
import RegisterForm from '@/components/forms/register_form';
import {redirect} from "next/navigation";

export default async function BusinessRegistrationPage() {
  const data = await getBusinessDropDown();

  if (data && data.length > 0) {
    redirect('/select-business');
  }

  return ( <RegisterForm step="step3"/> );
}
