"use client";

import { useRouter } from "next/navigation";
import { Business } from "@/types/business/type";
import Image from "next/image";

import {useState} from "react";

export const SelectBusiness = ({ businesses }: { businesses: Business[]}) => {
  const router = useRouter();
  const [business, setBusiness] = useState(null);

  if (businesses.length === 0) {
    router.push(`/business-registration`);
    return null; //preventing the table
  }

  return (<div className="items-center flex justify-center">
          <div className="max-w-40">
          <ul className="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
              {businesses.map((business: Business, index: number) => {
                      return <li className="pb-3 sm:pb-4" key={index}>
                          <div className="flex items-center space-x-4 rtl:space-x-reverse">
                              <div className="flex-shrink-0">
                                  <Image className="w-8 h-8 rounded-full" src="/images/logo.png" alt="Settlo Logo" width={50} height={50}/>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                      {business.name}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                      email@flowbite.com
                                  </p>
                              </div>
                              <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                  Select
                              </div>
                          </div>
                      </li>
                  }
              )}
          </ul>
          </div>
      </div>
      /*<Table>
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
                      <TableCell onClick={() => handleRedirectToLocations(business)}
                                 style={{cursor: 'pointer'}}>{business.name}</TableCell>
                      <TableCell>{business.businessType}</TableCell>
                      <TableCell>{business.country}</TableCell>
                  </TableRow>
              ))}
          </TableBody>
      </Table>*/

)
    ;
};
