import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import {uploadCallBackType} from "@/types/types";

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

export async function uploadImage(file: File, callback: (response: uploadCallBackType) => void) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });

    if (!response.ok) {
      return callback({ success: false, data: null });
    }

    const { url } = await response.json();
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    callback({ success: uploadResponse.ok, data: uploadResponse });
  } catch (error) {
    console.error('Upload failed:', error);
    callback({ success: false, data: null });
  }
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
