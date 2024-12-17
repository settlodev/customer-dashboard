'use client';

import { useEffect, useState } from 'react';
import CreatedBusinessList from './business_list';
import { getBusinessDropDown } from '@/lib/actions/business/get-current-business';
import RegisterForm from '@/components/forms/register_form';
import {Business} from "@/types/business/type";
import {redirect} from "next/navigation";

export default function BusinessRegistrationPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const data = await getBusinessDropDown();
        setBusinesses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load businesses');
        console.error('Error fetching businesses:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    redirect('/login');
  }

  return businesses.length > 0 ? (
      <CreatedBusinessList businesses={businesses} />
  ) : (
      <RegisterForm step="step3" />
  );
}
