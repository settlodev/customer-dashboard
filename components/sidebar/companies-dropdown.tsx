import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@nextui-org/react";
import React from "react";
import { AcmeIcon } from "../icons/acme-icon";
import { BottomIcon } from "../icons/sidebar/bottom-icon";
import Image from "next/image";
import {BusinessPropsType} from "@/types/business/business-props-type";
import {Business} from "@/types/business/type";
import {refreshBusiness} from "@/lib/actions/business/refresh";

export const CompaniesDropdown = ({data}:{data: BusinessPropsType}) => {
  const {business, businessList} = data;
  const onRefreshBusiness = async (data: Business) => {
    await refreshBusiness(data);
  };

  console.log("business")
  return (
    <Dropdown
      classNames={{
        base: "w-full min-w-[260px]",
      }}
    >
      <DropdownTrigger className="cursor-pointer">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full overflow-hidden bg-emerald-400 items-center justify-center flex">
            <Image src={business.logo?business.logo:'/images/logo.png'} alt={'Logo'} width={30} height={30} />
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold m-0 text-default-900 text-md -mb-4 whitespace-nowrap">
              {business.name}
            </h3>
            <span className="text-xs font-medium text-default-500">
              {/*{company.location}*/}
            </span>
          </div>
          <BottomIcon />
        </div>
      </DropdownTrigger>
      <DropdownMenu
          className="bg-gray-50 rounded-xl px-2 py-2 border-1 border-gray-100"
        aria-label="Avatar Actions">
        <DropdownSection title="Switch Business">
          {businessList && businessList.length > 0 ?
              businessList.map((biz: Business, i)=>{
                return <DropdownItem onClick={()=>onRefreshBusiness(biz)}
                      key={i}
                      startContent={
                        <div className="p-1 rounded-full overflow-hidden bg-emerald-400 items-center justify-center flex">
                          <Image src={biz.logo ? biz.logo : '/images/logo.png'} alt={'Logo'} width={30} height={30}/>
                        </div>
                      }
                      description={biz.countryName}
                      classNames={{
                      base: "py-4",
                      title: "text-base font-semibold",
                    }}>
                  {biz.name}
                </DropdownItem>
              })
          :<></>
          }

        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
};
