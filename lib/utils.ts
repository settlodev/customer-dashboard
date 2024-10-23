import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import {uploadCallBackType} from "@/types/types";
import { createClient } from '@supabase/supabase-js'
import {v4} from "uuid";
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

export async function uploadImage(file: File, path: string, callback: (response: uploadCallBackType) => void) {
  const url = "https://fhuvexerkaysoazmmlal.supabase.co";
  const secret = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXZleGVya2F5c29hem1tbGFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjcyNzI5MiwiZXhwIjoyMDQyMzAzMjkyfQ.Lzt4PidEk8jvtdV2O1cXfefCe1_LzMbc2zwCYGtZPWk";
  const supabase = createClient(url, secret);

  let extension='jpg';
  if(file.type === 'image/png'){
    extension = 'png'
  }

  //await supabase.storage.createBucket("Images", {public: true});
  const sbObject = supabase.storage.from("Images");
  const imageName = `${path}/${v4()}.${extension}`;
  const { error } = await sbObject.upload(imageName, file, {
        cacheControl: '3600',
        upsert: false
      });

  const { data } = sbObject.getPublicUrl(imageName);

  if(error){
    return callback({ success: false, data: "Error uploading image" });
  }
  return callback({ success: true, data: data.publicUrl});
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
