"use client"

import React, {useState} from "react";
import {Sidebar} from "./sidebar.styles";
import {CompaniesDropdown} from "./companies-dropdown";
import {useSidebarContext} from "../layouts/layout-context";
import {BusinessPropsType} from "@/types/business/business-props-type";
import {menuItems} from "@/types/menu_items";
import Link from "next/link";
import {UsersIcon, ContactIcon, ChartNoAxesColumn, Package2, Info, ReceiptText, Settings} from "lucide-react";

export const SidebarWrapper = ({data}: {data: BusinessPropsType}) => {
  const {collapsed, setCollapsed} = useSidebarContext();
  const [visibleIndex, setVisibleIndex] = useState<number>(0);
  const myMenuItems = menuItems();

  const getIcon=(iconName: string)=>{
      const size:number = 18;
      //const color:string = '#7CF5FF';
      const color:string = '#A3FFD6';
      if(iconName === 'dashboard') {
          return <ChartNoAxesColumn size={size} color={color} />
      }else if(iconName === 'inventory') {
          return <Package2 size={size} color={color} />
      }else if(iconName === 'sales') {
          return <ReceiptText size={size} color={color} />
      }else if(iconName === 'customers') {
          return <ContactIcon size={size} color={color} />
      }else if(iconName === 'users') {
          return <UsersIcon size={size} color={color} />
      }else if(iconName === 'general') {
          return <Info size={size} color={color} />
      }else{
          return <Info size={size} color={color} />
      }
  }

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
              })} bg-gray-800 dark:bg-gray-800`}>

            <div className={`${Sidebar.Header()} border-b-1 border-b-gray-700 pb-4 ml-0 mr-0 pl-0 pr-0`}>
              <CompaniesDropdown data={data}/>
            </div>
            <div className={Sidebar.Body()}>
              <div className="h-full px-1 py-4 dark:bg-gray-800">
                  <ul className="space-y-2 font-medium">
                      {myMenuItems.map((label, labelIndex: number) => {
                          return <li key={labelIndex}>
                              <a href="#" className="flex items-center p-2 text-gray-100 rounded-lg dark:text-white hover:bg-gray-700 dark:hover:bg-gray-700 group" onClick={()=>setVisibleIndex(labelIndex)}>
                                  <span className="text-xs">{getIcon(label.icon)}</span>
                                  <span className="ml-2">{label.label}</span>
                              </a>

                              {(visibleIndex === labelIndex) &&
                                  <ul id={`label-${labelIndex}`}
                                      className="py-2 space-y-2">
                                      {label.items.map((item, index) => {
                                          return (<li key={index}
                                                      className="flex items-center w-full transition duration-75 rounded-lg hover:bg-gray-700">
                                              <Link href={item.link}
                                                    className="flex items-center py-1 px-2 text-gray-200 rounded-lg dark:text-white group">
                                                  <span className="ms-3 text-sm">{item.title}</span>
                                              </Link>
                                          </li>)
                                      })}
                                      <li className="flex pt-4 mt-4 space-y-2 font-medium border-b-1 border-b-gray-700 dark:border-gray-700 w-full"></li>
                                  </ul>}
                          </li>
                      })}
                  </ul>
                  <div className="absolute left-0 bottom-0 w-full">
                      <div className="flex pt-4 mt-4 mb-2 space-y-2 font-medium border-b-1 border-b-gray-700 dark:border-gray-700 w-full"></div>
                      <Link href="#"
                            className="pl-4 flex items-center p-0 text-gray-400 rounded-lg dark:text-white hover:bg-gray-700 dark:hover:bg-gray-700 group"
                            onClick={() => {
                            }}>
                          <Settings size={18}/>
                          <span className="ml-2">Settings</span>
                      </Link>
                      <div
                          className="flex pt-2 mt-0 mb-2 space-y-2 font-medium border-b-1 border-b-gray-700 dark:border-gray-700 w-full"></div>
                      <p className="text-xs text-gray-500 mt-2 p-2  mb-4 pl-4">&copy; {(new Date()).getFullYear()} Settlo
                          Technologies Ltd</p>
                  </div>
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
