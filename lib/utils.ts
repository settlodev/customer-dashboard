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

/**
 * Safely extract a human-readable error message from an API error.
 *
 * The Settlo API can return `message` as:
 *  - a string:  "Something went wrong"
 *  - an array:  [{ field: "reservationTime", message: "must not be null" }, ...]
 *  - an object: { field: "...", message: "..." }
 *
 * This function normalises all shapes into a single string.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "Something went wrong while processing your request, please try again",
): string {
  if (!error) return fallback;

  // If the error is already a string, return it
  if (typeof error === "string") return error;

  // If it's an array of {field, message} objects (validation errors)
  if (Array.isArray(error)) {
    const messages = error
      .map((e) => {
        if (typeof e === "string") return e;
        if (e && typeof e === "object" && "message" in e) {
          const field = "field" in e ? String(e.field) : "";
          const msg = String(e.message);
          return field ? `${field}: ${msg}` : msg;
        }
        return null;
      })
      .filter(Boolean);
    return messages.length > 0 ? messages.join(", ") : fallback;
  }

  // If it's an object with a message property
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as { message: unknown }).message;
    // message itself could be an array (nested case)
    return extractErrorMessage(msg, fallback);
  }

  return fallback;
}


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


export const getBuildInfo = () => {
  return {
    buildId: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
    buildNumber: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
        ? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF
        : 'local',
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'
  };
};


