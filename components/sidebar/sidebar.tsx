"use client"

import React from "react";
import {Sidebar} from "./sidebar.styles";
import {CompaniesDropdown} from "./companies-dropdown";
import {useSidebarContext} from "../layouts/layout-context";
import {BusinessPropsType} from "@/types/business/business-props-type";
import {menuItems} from "@/types/menu_items";
import Link from "next/link";

export const SidebarWrapper = ({data}: {data: BusinessPropsType}) => {
  const {collapsed, setCollapsed} = useSidebarContext();
  const myMenuItems = menuItems();
  const {business} = data;
  if(business) {
    return (
        <aside className="h-screen z-[20] sticky top-0 transition-transform -translate-x-full sm:translate-x-0">
          {collapsed ? (
              <div className={Sidebar.Overlay()} onClick={setCollapsed}/>
          ) : null}
          <div
              className={`${Sidebar({
                collapsed: collapsed,
              })} bg-white dark:bg-gray-800`}>
            <div className={Sidebar.Header()}>
              <CompaniesDropdown data={data}/>
            </div>
            <div className={Sidebar.Body()}>
              <div className="h-full px-0 py-4 overflow-y-auto">
                <ul className="space-y-0 font-medium">
                  {myMenuItems.map((label, labelIndex: number)=> {
                          return <li key={labelIndex}>
                              <button type="button"
                                      className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                      aria-controls={`label-${labelIndex}`}
                                      data-collapse-toggle={`label-${labelIndex}`}>
                                  <svg
                                      className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                                      aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                                      fill="currentColor"
                                      viewBox="0 0 22 21">
                                      <path
                                          d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
                                      <path
                                          d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
                                  </svg>

                                  <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap font-bold text-sm">{label.label}</span>
                                  {/*<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                                       fill="none"
                                       viewBox="0 0 10 6">
                                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                            stroke-width="2" d="m1 1 4 4 4-4"/>
                                  </svg>*/}
                              </button>

                              <ul id={`label-${labelIndex}`} className="hidden- py-2 pt-2 mt-2 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                                  {label.items.map((item, index) => {
                                      return (<li key={index}>
                                          <Link href={item.link} className="flex items-center py-1 px-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                              {/*<svg
                                                  className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                                                  aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                                                  fill="currentColor"
                                                  viewBox="0 0 22 21">
                                                  <path
                                                      d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
                                                  <path
                                                      d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
                                              </svg>*/}
                                              <span className="ms-3 text-sm">{item.title}</span>
                                          </Link>
                                      </li>)
                                  })}
                              </ul>
                          </li>

                  })}
                </ul>
              </div>
            </div>
          </div>

            {/*<div
              className={Sidebar({
                collapsed: collapsed,
              })}>
            <div className={Sidebar.Header()}>
              <CompaniesDropdown data={data}/>
            </div>
            <div className="flex flex-col justify-between h-full">
              <div className={Sidebar.Body()}>

                <SidebarMenu title="Dashbboard">
                  <SidebarItem
                      isActive={pathname === "/summary"}
                      title="Summary"
                      icon={<HomeIcon/>}
                      href="/summary"
                  />
                  <SidebarItem
                      isActive={pathname === "/top-selling"}
                      title="Top selling items"
                      icon={<BarChartIcon/>}
                      href="/top-selling"
                  />
                  <SidebarItem
                      isActive={pathname === "/staff-report"}
                      title="Staff report"
                      icon={<PieChartIcon/>}
                      href="/staff-report"
                  />
                </SidebarMenu>

                <SidebarMenu title="Inventory">
                  <SidebarItem
                      isActive={pathname === "/products"}
                      title="Products"
                      icon={<ChevronRightIcon/>}
                      href="/products"
                  />
                  <SidebarItem
                      isActive={pathname === "/suppliers"}
                      title="Suppliers"
                      icon={<ChevronRightIcon/>}
                      href="/suppliers"
                  />
                  <SidebarItem
                      isActive={pathname === "/categories"}
                      title="Categories"
                      icon={<ChevronRightIcon/>}
                      href="/categories"
                  />

                </SidebarMenu>

                <SidebarMenu title="Sales">
                  <SidebarItem
                      isActive={pathname === "/orders"}
                      title="Completed Orders"
                      icon={<ChevronRightIcon/>}
                      href='/orders'
                  />
                  <SidebarItem
                      isActive={pathname === "/tickets"}
                      title="Tickets"
                      icon={<ChevronRightIcon/>}
                      href='/tickets'
                  />
                </SidebarMenu>
                <SidebarMenu title="Customers">

                  <SidebarItem
                      isActive={pathname === "/customers"}
                      title="Customers"
                      icon={<ChevronRightIcon/>}
                      href='/customers'
                  />
                  <SidebarItem
                      isActive={pathname === "/discounts"}
                      title="Discounts"
                      icon={<ChevronRightIcon/>}
                      href='/discounts'
                  />
                  <SidebarItem
                      isActive={pathname === "/sms"}
                      title="SMS marketing"
                      icon={<ChevronRightIcon/>}
                      href='/sms'
                  />
                </SidebarMenu>
                <SidebarMenu title="Users">
                  <SidebarItem
                      isActive={pathname === "/roles"}
                      title="Roles"
                      icon={<ChevronRightIcon/>}
                      href='/roles'
                  />
                  <SidebarItem
                      isActive={pathname === "/users"}
                      title="Users"
                      icon={<ChevronRightIcon/>}
                      href='/users'
                  />
                </SidebarMenu>
                <SidebarMenu title="General">
                  <SidebarItem
                      isActive={pathname === "/countries"}
                      title="Countries"
                      icon={<ChevronRightIcon/>}
                      href='/countries'
                  />
                  <SidebarItem
                      isActive={pathname === "/departments"}
                      title="Departments"
                      icon={<ChevronRightIcon/>}
                      href='/departments'
                  />

                  <SidebarItem
                      isActive={pathname === "/business"}
                      title="Business"
                      icon={<ChevronRightIcon/>}
                      href='/business'
                  />
                  <SidebarItem
                      isActive={pathname === "/expenses"}
                      title="Expenses"
                      icon={<ChevronRightIcon/>}
                      href='/expenses'
                  />
                  <SidebarItem
                      isActive={pathname === "/tables"}
                      title="Tables & Spaces"
                      icon={<ChevronRightIcon/>}
                      href='/tables'
                  />
                  <SidebarItem
                      isActive={pathname === "/kds"}
                      title="KDS"
                      icon={<ChevronRightIcon/>}
                      href='/kds'
                  />

                </SidebarMenu>

              </div>

              <div className={Sidebar.Footer()}>
                <p className="text-xs">&copy; {(new Date()).getFullYear()} Settlo Tech Ltd</p>
              </div>
            </div>
          </div>*/}
        </aside>
  );
  } else {
    return <></>
  }
};
