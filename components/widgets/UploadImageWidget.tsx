import { ImageIcon } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import { toast } from "@/hooks/use-toast";
import { useUpload } from "@/lib/uploads/use-upload";
import type { UploadPurpose } from "@/lib/uploads/types";

interface ImageUploadProps {
  setImage: (value: string) => void;
  displayImage?: boolean;
  /**
   * Preferred: explicit purpose tied to the owning entity (e.g.
   * {@code BRAND_LOGO}). When omitted, {@code imagePath} is mapped
   * onto a purpose via {@link purposeFromImagePath} so historic
   * call sites keep working.
   */
  purpose?: UploadPurpose;
  imagePath?: string;
  displayStyle?: "default" | "custom";
  label?: string;
  showLabel?: boolean;
  image?: string | null;
  className?: string;
}

const PATH_TO_PURPOSE: Record<string, UploadPurpose> = {
  business: "BUSINESS_LOGO",
  "business/logos": "BUSINESS_LOGO",
  location: "LOCATION_LOGO",
  locations: "LOCATION_LOGO",
  profiles: "PROFILE_PICTURE",
  profile: "PROFILE_PICTURE",
  products: "PRODUCT_IMAGE",
  product: "PRODUCT_IMAGE",
  stock: "STOCK_IMAGE",
  brands: "BRAND_LOGO",
  brand: "BRAND_LOGO",
  categories: "CATEGORY_IMAGE",
  category: "CATEGORY_IMAGE",
  departments: "DEPARTMENT_IMAGE",
  department: "DEPARTMENT_IMAGE",
  collections: "PRODUCT_COLLECTION_IMAGE",
  collection: "PRODUCT_COLLECTION_IMAGE",
  receipts: "RECEIPT_HEADER",
  receipt: "RECEIPT_HEADER",
};

export function purposeFromImagePath(path: string): UploadPurpose | null {
  const direct = PATH_TO_PURPOSE[path.toLowerCase()];
  if (direct) return direct;
  const segment = path.split("/")[0]?.toLowerCase();
  if (segment && PATH_TO_PURPOSE[segment]) return PATH_TO_PURPOSE[segment];
  return null;
}

function UploadImageWidget({
  setImage,
  displayImage = true,
  displayStyle = "default",
  purpose,
  imagePath = "products",
  label = "Upload image",
  showLabel = true,
  image = null,
  className = "",
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>(image || "");
  const { upload, isUploading, progress } = useUpload();

  const isValidImageUrl = (value: string) =>
    !!value &&
    (value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/"));

  const uploadMyImage = async (file: File) => {
    const resolvedPurpose = purpose ?? purposeFromImagePath(imagePath);
    if (!resolvedPurpose) {
      toast({
        variant: "destructive",
        title: "Upload misconfigured",
        description: `No purpose registered for "${imagePath}". Pass purpose= explicitly.`,
      });
      return;
    }
    try {
      const result = await upload({ file, purpose: resolvedPurpose });
      setImageUrl(result.url);
      setImage(result.url);
    } catch (error) {
      setImageUrl("");
      setImage("");
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description:
          error instanceof Error
            ? error.message
            : "There was an issue uploading the image",
      });
    }
  };

  const defaultStyles = `
        relative
        cursor-pointer
        w-full
        aspect-square
        rounded-lg
        bg-muted
        hover:bg-muted/80
        transition-colors
        duration-200
        flex
        items-center
        justify-center
        flex-col
        overflow-hidden
        ${className}
    `;

  return (
    <label className={displayStyle === "default" ? defaultStyles : className}>
      {isUploading && (
        <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center flex-col gap-2 z-10">
          <div className="w-8 h-8 border-2 border-primary rounded-full animate-spin border-t-transparent" />
          {progress && (
            <span className="text-xs font-medium text-foreground/80">
              {progress.percent}%
            </span>
          )}
        </div>
      )}

      {isValidImageUrl(imageUrl) && displayImage ? (
        <div className="w-full h-full relative">
          <Image alt={label} src={imageUrl} fill className="object-cover" />
        </div>
      ) : (
        <>
          {displayStyle === "default" && !isUploading && (
            <div className="flex flex-col items-center gap-2 p-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              {showLabel && (
                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>
              )}
            </div>
          )}
        </>
      )}

      <input
        className="hidden"
        type="file"
        name="file"
        disabled={isUploading}
        onChange={async (e) => {
          const files = e.target.files;
          if (files && files[0]) {
            await uploadMyImage(files[0]);
          }
        }}
        accept="image/*"
      />
    </label>
  );
}

export default UploadImageWidget;
