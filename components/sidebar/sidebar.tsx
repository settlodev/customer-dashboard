"use client"

import React from "react";
import { Sidebar } from "./sidebar.styles";
import { Avatar, Tooltip } from "@nextui-org/react";
import { CompaniesDropdown } from "./companies-dropdown";
import { PaymentsIcon } from "../icons/sidebar/payments-icon";
import { BalanceIcon } from "../icons/sidebar/balance-icon";
import { AccountsIcon } from "../icons/sidebar/accounts-icon";
import { CustomersIcon } from "../icons/sidebar/customers-icon";
import { ProductsIcon } from "../icons/sidebar/products-icon";
import { ReportsIcon } from "../icons/sidebar/reports-icon";
import { DevIcon } from "../icons/sidebar/dev-icon";
import { ViewIcon } from "../icons/sidebar/view-icon";
import { SettingsIcon } from "../icons/sidebar/settings-icon";
import { CollapseItems } from "./collapse-items";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";
import { FilterIcon } from "../icons/sidebar/filter-icon";
import { useSidebarContext } from "../layouts/layout-context";
import { ChangeLogIcon } from "../icons/sidebar/changelog-icon";
import { usePathname } from "next/navigation";
import {BarChartIcon, PieChartIcon, HomeIcon, ChevronRightIcon} from "@radix-ui/react-icons";
import {Business} from "@/types/business/type";
import {parseStringify} from "@/lib/utils";

export const SidebarWrapper = ({business}: { business: Business }) => {
  const pathname = usePathname();
  const {collapsed, setCollapsed} = useSidebarContext();

  if(business) {
    console.log("Biz is 3:", JSON.parse(business));
  }
  return (
      <aside className="h-screen z-[20] sticky top-0">
        {collapsed ? (
            <div className={Sidebar.Overlay()} onClick={setCollapsed}/>
        ) : null}
        <div
            className={Sidebar({
              collapsed: collapsed,
            })}>
          <div className={Sidebar.Header()}>
            <CompaniesDropdown/>
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
                {/*<CollapseItems
                icon={<BalanceIcon />}
                items={["Banks Accounts", "Credit Cards", "Loans"]}
                title="Balances"
                isOpen={false} />*/}

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
        </div>
      </aside>
  );
};
