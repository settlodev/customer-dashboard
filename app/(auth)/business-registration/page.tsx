
import RegisterForm from '@/components/forms/register_form';
import { Suspense } from 'react';
import Loading from '@/app/loading';

export default async function BusinessRegistrationPage() {
    return (
        <Suspense fallback={<Loading />}>
            <RegisterForm step="step3" />
        </Suspense>
    );
}