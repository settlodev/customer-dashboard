"use client"
import { Input, Link, Navbar, NavbarContent } from "@nextui-org/react";
import React from "react";
import { FeedbackIcon } from "../icons/navbar/feedback-icon";
import { GithubIcon } from "../icons/navbar/github-icon";
import { SupportIcon } from "../icons/navbar/support-icon";
import { SearchIcon } from "../icons/searchicon";
import { BurguerButton } from "./burguer-button";
import { NotificationsDropdown } from "./notifications-dropdown";
import { UserDropdown } from "./user-dropdown";
import {Session} from "next-auth";
interface Props {
  children: React.ReactNode;
  data: Session|null
}

export const NavbarWrapper = ({children, data}: Props) => {
    return (
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Navbar
                isBordered
                className="w-full"
                classNames={{
                    wrapper: "w-full max-w-full",
                }}
            >
                <NavbarContent className="md:hidden">
                    <BurguerButton/>
                </NavbarContent>
                <NavbarContent className="w-full max-md:hidden">
                    <p>Welcome</p>
                    {/*<Input
            startContent={<SearchIcon />}
            isClearable
            className="w-full"
            classNames={{
              input: "w-full",
              mainWrapper: "w-full",
            }}
            placeholder="Search..."
          />*/}
                </NavbarContent>
                <NavbarContent
                    justify="end"
                    className="w-fit data-[justify=end]:flex-grow-0">
                    {/*<div className="flex items-center gap-2 max-md:hidden">
            <FeedbackIcon />
            <span>Feedback?</span>
          </div>*/}

                    <NotificationsDropdown/>

                    <div className="max-md:hidden">
                        <SupportIcon/>
                    </div>

                    <NavbarContent>
                        <UserDropdown data={data}/>
                    </NavbarContent>
                </NavbarContent>
            </Navbar>
            {children}
        </div>
    );
};
