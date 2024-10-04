"use client";


import { useRouter } from "next/navigation";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Location } from "@/types/location/type";
import { subscriptionStatus } from "@/types/enums";

const CreatedBusinessLocationList = ({ locations }: { locations: Location[]}) => {
  const router = useRouter();

  if (locations.length === 1) {
    if(locations[0].subscriptionStatus === subscriptionStatus.TRIAL){
        router.push(`/subscription?location=${locations[0].id}`);
        return null; //preventing the table
    }
    router.push(`/dashboard?location=${locations[0].id}`);
    return null; //preventing the table
  }

  const handleLocationClick = (location: Location) => {
    if (location.subscriptionStatus === subscriptionStatus.TRIAL) {
      router.push(`/subscription?location=${location.id}`);
    }
    else{
        router.push(`/dashboard?location=${location.id}`);
    }
  };

  return (

        <Table>
            <TableCaption>
                A list of registered businesses location.
            </TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Location Address</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {locations.map((location) => (
                    <TableRow key={location.id}>
                        <TableCell onClick={() => handleLocationClick(location)} style={{ cursor: 'pointer' }}>{location.name}</TableCell>
                        <TableCell>{location.address}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
   
  );
};

export default CreatedBusinessLocationList;
