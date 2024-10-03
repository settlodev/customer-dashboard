"use client"
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  NavbarItem,
} from "@nextui-org/react";
import React, { useCallback } from "react";
import { DarkModeSwitch } from "./darkmodeswitch";
import { useRouter } from "next/navigation";
import { deleteAuthCookie } from "@/lib/auth-utils";
import Image from "next/image";
import {Session} from "next-auth";

export const UserDropdown = async ({data}:{data: Session|null}) => {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await deleteAuthCookie();
    router.replace("/login");
  }, [router]);

  return (
      <Dropdown>
        <NavbarItem>
          <DropdownTrigger>
            {/*{userData.picture?
            <Avatar
              as='button'
              color='secondary'
              size='md'
              src={userData.picture}
            />: <Image  src='/images/logo.png' alt={'Logo'} width={50} height={50} className="rounded-full" />
          }*/}


            <div className="rounded-full mt-2mb-2 overflow-hidden bg-emerald-400 p-1 m-2">
              <Image src='/images/logo.png' alt={'Logo'} width={45} height={45}/>
            </div>
          </DropdownTrigger>
        </NavbarItem>
        <DropdownMenu className="bg-gray-50 rounded-xl border-1 border-gray-200"
                      aria-label='User menu actions'
                      onAction={(actionKey) => console.log({actionKey})}>
          <DropdownItem
              key='profile'
              className='w-full p-0'>
            <div className="font-bold text-medium border-b-1 border-b-gray-200 pb-2 mb-2 w-full p-2">
              <p>Hello {data?.user.firstName}</p>
              <p className="text-xs font-medium">{data?.user.email}</p>
            </div>
          </DropdownItem>
          <DropdownItem className="border-b-1 border-b-gray-150 font-medium text-sm rounded-none" key='1'>My Profile</DropdownItem>
          <DropdownItem className="border-b-1 border-b-gray-150 text-sm rounded-none" key='2'>Notifications</DropdownItem>
          <DropdownItem className="border-b-1 border-b-gray-150 text-sm rounded-none" key='3'>Help & Feedback</DropdownItem>
          <DropdownItem
              key='logout'
              color='secondary'
              className='text-gray-800 text-sm font-bold border-b-1 border-b-gray-150 rounded-none'
              onPress={handleLogout}>
            Log Out
          </DropdownItem>
          <DropdownItem key='switch'>
            <DarkModeSwitch/>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
  );
};
