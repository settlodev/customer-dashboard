"use client";

import { createContext, useContext, ReactNode } from "react";
import { Space } from "@/types/space/type";

const BookableTablesContext = createContext<Space[]>([]);

export function BookableTablesProvider({
  tables,
  children,
}: {
  tables: Space[];
  children: ReactNode;
}) {
  return (
    <BookableTablesContext.Provider value={tables}>
      {children}
    </BookableTablesContext.Provider>
  );
}

export function useBookableTables(): Space[] {
  return useContext(BookableTablesContext);
}
