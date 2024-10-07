import Image from "next/image";
import {ChevronRightIcon} from "@nextui-org/shared-icons";
import {setCurrentLocation} from "@/lib/actions/business/get-current-business";
import {Location} from "@/types/location/type";

export function SelectLocation ({ locations }: { locations: Location[]}){
    const setLocation = async(location: Location)=>{
         await setCurrentLocation(location);
         document.location.href='/dashboard'
    }

    return (<>
            {locations.length > 0 ?
                locations.map((myLocation: Location, index: number) => {
                    return <li className="pb-3 sm:pb-4 p-4" key={index}>
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <div className="flex-shrink-0 w-10 h-10 p-1 rounded-full bg-emerald-400">
                                <Image className="rounded-full" src="/images/logo.png" alt="Settlo Logo"
                                       width={50} height={50}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate dark:text-white">
                                    {myLocation.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                    {myLocation.city}
                                </p>
                            </div>
                            <div
                                className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                <button type="button"
                                        className="flex gap-2 rounded-full bg-emerald-500 pr-2 pl-3 py-1 text-white font-medium text-sm"
                                        onClick={() => setLocation(myLocation)}>
                                    Select <ChevronRightIcon/>
                                </button>
                            </div>
                        </div>
                    </li>
                })
                : <>You have not added any locations for this business</>
            }
        </>
    )
}
