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
import {AuthToken} from "@/types/types";
import Image from "next/image";

export const UserDropdown = () => {
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


          <div className="rounded-full mt-2mb-2 overflow-hidden bg-emerald-400 p-2 m-2">
          <Image src='/images/logo.png' alt={'Logo'} width={50} height={10} />
          </div>
        </DropdownTrigger>
      </NavbarItem>
      <DropdownMenu className="bg-gray-50 rounded-2xl border-1 border-gray-200"
        aria-label='User menu actions'
        onAction={(actionKey) => console.log({ actionKey })}>
        <DropdownItem
          key='profile'
          className='flex flex-col justify-start w-full items-start'>
          <p>Hello User</p>
          <p>Your email</p>
        </DropdownItem>
        <DropdownItem className="border-b-1 border-b-gray-100 font-medium text-medium" key='settings'>My Profile</DropdownItem>
        <DropdownItem className="border-b-1 border-b-gray-100" key='configurations'>Notifications</DropdownItem>
        <DropdownItem key='help_and_feedback' className="border-b-1 border-b-gray-100">Help & Feedback</DropdownItem>
        <DropdownItem
          key='logout'
          color='danger'
          className='text-danger'
          onPress={handleLogout}>
          Log Out
        </DropdownItem>
        <DropdownItem key='switch'>
          <DarkModeSwitch />
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
