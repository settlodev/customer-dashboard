"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreatedBusinessList from "./business_list";
import RegisterForm from "@/components/forms/register_form";
import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";

export default function BusinessRegistrationPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // To handle loading state

  // Fetch businesses on component mount
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const responseData = await getBusinessDropDown();
        setBusinesses(responseData);

        if (responseData.length > 0) {
          router.push(`/select-business`); // Redirect if there are businesses
        }
      } catch (error) {
        console.error("Error fetching businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [router]);

  // If still loading, you can return a loader
  if (loading) return <div>Loading...</div>;

  // Render the appropriate content after loading
  return (
    businesses.length > 0 ? (
      <CreatedBusinessList businesses={businesses} />
    ) : (
      <RegisterForm step="step2" />
    )
  );
}
