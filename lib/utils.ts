import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseStringify = (value: unknown) => JSON.parse(JSON.stringify(value));


export function formatNumber(value: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

export const formatDateForZod = (date: Date | undefined): string => {
  if (!date) return ""; 
  return format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'"); 
}

export const formatDateTime = (date: Date | string | undefined): { dateTime: string; dateDay: string; timeOnly: string; dateOnly: string } => {
  if (!date) return { dateTime: "", dateDay: "", timeOnly: "", dateOnly: "" };

  const dateValue = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateValue.getTime())) {
    return { dateTime: "Invalid date", dateDay: "Invalid date", timeOnly: "Invalid date", dateOnly: "Invalid date" };
  }

  const formattedDate = format(dateValue, "yyyy-MM-dd"); 
  const formattedTime = format(dateValue, "HH:mm:ss"); 
  const formattedDateOnly = format(dateValue, "yyyy-MM-dd"); 

  return {
    dateTime: `${formattedDate} ${formattedTime}`,
    dateDay: formattedDate,
    timeOnly: formattedTime,
    dateOnly: formattedDateOnly,
  };
}

// export const formatDateTime = (date: Date | string | undefined): { dateTime: string; dateDay: string; timeOnly: string; dateOnly: string } => {
//   if (!date) return { dateTime: "", dateDay: "", timeOnly: "", dateOnly: "" };

//   const dateValue = typeof date === "string" ? new Date(date) : date;

//   if (isNaN(dateValue.getTime())) {
//     return { dateTime: "Invalid date", dateDay: "Invalid date", timeOnly: "Invalid date", dateOnly: "Invalid date" };
//   }

//   const formattedDate = format(dateValue, "yyyy-MM-dd"); 
//   const formattedTime = format(dateValue, "HH:mm:ss"); 
//   const formattedDateOnly = format(dateValue, "yyyy-MM-dd"); 

//   return {
//     dateTime: `${formattedDate} ${formattedTime}`,
//     dateDay: formattedDate,
//     timeOnly: formattedTime,
//     dateOnly: formattedDateOnly,
//   };
// }
