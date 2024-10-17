"use client";


import { useRouter } from "next/navigation";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Location } from "@/types/location/type";
import { subscriptionStatus } from "@/types/enums";
import { useEffect } from "react";
import { useToast} from "@/hooks/use-toast";

const CreatedBusinessLocationList = ({ locations }: { locations: Location[]}) => {
  const router = useRouter();
  const { toast } = useToast();

   useEffect(() => {
    if (locations.length > 0) {
      if (locations[0].subscriptionStatus === subscriptionStatus.EXPIRED) {
        toast({
            variant: 'destructive',
            title: 'Subscription Expired',
            description: 'Your subscription has expired. Please renew your subscription to continue using the app.',

         });
         setTimeout(() => {
            router.push(`/subscription?location=${locations[0].id}`);
          }, 30000);
      } else {
        router.push(`/dashboard?location=${locations[0].id}`);
      }
    }
  }, [locations, router, toast]);

  const handleLocationClick = (location: Location) => {
    if (location.subscriptionStatus === subscriptionStatus.EXPIRED) {
        toast({
            variant: 'destructive',
            title: 'Subscription Expired',
            description: 'Your subscription has expired. Please renew your subscription to continue using the app.',

         });
         setTimeout(() => {
            router.push(`/subscription?location=${location.id}`);
        }, 30000);
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
