"use client";

import { useRouter } from "next/navigation";

import { Business } from "@/types/business/type";


import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CreatedBusinessList = ({ businesses }: { businesses: Business[]}) => {

  const router = useRouter();

  if (businesses.length > 1) {
    //router.push(`/business-location?business=${businesses[0].id}`);
    router.push(`/select-business`);
    return null; //preventing the table
  }

  const handleRedirectToLocations = (business: Business) => {
    router.push(`/business-location?business=${business.id}`);
  };

  return (

        <Table>
            <TableCaption>
                A list of all businesses.
            </TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Business Type</TableHead>
                    <TableHead>Business Phone</TableHead>
                    <TableHead>Business Address</TableHead>
                    <TableHead>Business Country</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {businesses.map((business) => (
                    <TableRow key={business.id}>
                        <TableCell onClick={() => handleRedirectToLocations(business)} style={{ cursor: 'pointer' }}>{business.name}</TableCell>
                        <TableCell>{business.businessType}</TableCell>
                        <TableCell>{business.country}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>

  );
};

export default CreatedBusinessList;
