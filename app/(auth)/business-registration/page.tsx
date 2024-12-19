'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreatedBusinessList from './business_list';
import { getBusinessDropDown } from '@/lib/actions/business/get-current-business';
import RegisterForm from '@/components/forms/register_form';
import { Business } from "@/types/business/type";

export default function BusinessRegistrationPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchBusinesses = async () => {
      try {
        const data = await getBusinessDropDown();
        if (isMounted) {
          setBusinesses(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load businesses');
          console.error('Error fetching businesses:', err);
          router.push('/login');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBusinesses();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return businesses.length > 0 ? (
    <CreatedBusinessList businesses={businesses} />
  ) : (
    <RegisterForm step="step3" />
  );
}