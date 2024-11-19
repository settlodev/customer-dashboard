import Image from "next/image";
import {Location} from "@/types/location/type";
import {refreshLocation} from "@/lib/actions/business/refresh";
import { toast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { Loader2Icon } from "lucide-react";

export function SelectLocation ({ locations }: { locations: Location[]}){
    const [isPending, startTransition] = useTransition();
    const setLocation = async(location: Location)=>{

        if(location.subscriptionStatus === "EXPIRED"){
            console.log("Selected Location:", location.subscriptionStatus);

            toast({
                variant: 'destructive',
                title: 'Subscription Expired',
                description: 'Your subscription has expired. Please renew your subscription to continue using the app.',
            });
            setTimeout(() => {
                document.location.href=`/subscription?location=${location.id}`;
            }, 3000);
        }
        else{
            await refreshLocation(location);
         document.location.href='/dashboard'
        }
    }

    return (<>
            {locations.length > 0 ?
                locations.map((myLocation: Location, index: number) => {
                    return <li className="pb-3 sm:pb-4 p-4 bg-white" key={index}>
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <div className="flex-shrink-0 w-10 h-10 p-1 rounded-full bg-emerald-400">
                                <Image className="rounded-full" src="/images/logo.png" alt="Settlo Logo"
                                       width={50} height={50}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-md font-bold text-gray-900 truncate dark:text-white">
                                    {myLocation.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                    {myLocation.city}
                                </p>
                            </div>
                            <div
                                className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                                            <button type="button"
                                    className="flex gap-2 rounded-full bg-emerald-500 pr-4 pl-4 py-2 text-white font-medium text-sm"
                                    onClick={() => startTransition(() => setLocation(myLocation))}>
                                {
                                    isPending ? <Loader2Icon className="w-6 h-6 animate-spin text-white dark:text-gray-500"/> : 'Select' // Show loader or text
                                }
                            </button>
                            </div>
                        </div>
                    </li>
                })
                : <p className="p-4 text-red-600">You have not added any locations for this business</p>
            }
        </>
    )
}
