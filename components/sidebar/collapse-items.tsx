"use client";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import React from "react";

interface Props {
  icon: React.ReactNode;
  title: string;
  items: string[];
  isOpen: boolean | null
}

export const CollapseItems = ({ icon, items, title, isOpen=false }: Props) => {
  return (
    <div className="flex gap-4 h-full items-center cursor-pointer">
      <Accordion type="multiple" className="px-0" defaultValue={isOpen ? ["collapse-item"] : []}>
        <AccordionItem value="collapse-item" className="border-none">
          <AccordionTrigger
            className="py-0 min-h-[44px] hover:bg-default-100 rounded-xl active:scale-[0.98] transition-transform px-3.5 hover:no-underline"
          >
            <div className="flex flex-row gap-2 text-base">
              <span>{icon}</span>
              <span>{title}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-12">
              {items.map((item, index) => (
                <span
                  key={index}
                  className="w-full flex text-default-500 hover:text-default-900 transition-colors"
                >
                  {item}
                </span>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
