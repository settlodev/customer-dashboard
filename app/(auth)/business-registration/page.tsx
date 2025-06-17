import { getBusinessDropDown } from '@/lib/actions/business/get-current-business';
import RegisterForm from '@/components/forms/register_form';
import { redirect } from "next/navigation";
import { Suspense } from 'react';
import Loading from '@/app/loading';

export default async function BusinessRegistrationPage() {
  try {
    const data = await getBusinessDropDown();

    // If data is null, redirect to login
    if (data === null) {
      redirect('/login');
    }

    // Check for businesses
    if (Array.isArray(data) && data.length > 0) {
      redirect('/select-business');
    }

    return (
      <Suspense fallback={<Loading />}>
        <RegisterForm step="step3" />
      </Suspense>
    );
  } catch (error) {

    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Error fetching business data:', error);
    // Redirect to login on error
    redirect('/login');
  }
}