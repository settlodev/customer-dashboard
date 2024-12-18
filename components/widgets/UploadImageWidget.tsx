import { ImageIcon } from "lucide-react";
import React, { useState } from "react";
import { uploadImage } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

interface ImageUploadProps {
    setImage: (value: string) => void;
    displayImage?: boolean;
    imagePath: string;
    displayStyle?: 'default' | 'custom';
    label?: string;
    showLabel?: boolean;
    image?: string | null;
    className?: string;
}

function UploadImageWidget({
                               setImage,
                               displayImage = true,
                               displayStyle = 'default',
                               imagePath = 'products',
                               label = 'Upload image',
                               showLabel = true,
                               image = null,
                               className = ''
                           }: ImageUploadProps) {
    const [uploading, setUploading] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>(image || '');

    const uploadMyImage = async (mFile: File) => {
        setUploading(true);
        await uploadImage(mFile, imagePath, function (response) {
            if (response.success) {
                setImageUrl(response.data);
                setImage(response.data);
            } else {
                setImageUrl('');
                setImage('');
                toast({
                    variant: "destructive",
                    title: "Uh oh! something went wrong",
                    description: "There was an issue uploading image",
                });
            }
            setUploading(false);
        });
    }

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
        <label className={displayStyle === 'default' ? defaultStyles : className}>
            {uploading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary rounded-full animate-spin border-t-transparent" />
                </div>
            )}

            {(imageUrl && displayImage) ? (
                !uploading ? (
                    <div className="w-full h-full relative">
                        <Image
                            alt={label}
                            src={imageUrl}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : null
            ) : (
                <>
                    {displayStyle === 'default' && !uploading && (
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
                disabled={uploading}
                onChange={async (e) => {
                    const files = e.target.files;
                    if (files) {
                        await uploadMyImage(files[0]);
                    }
                }}
                accept="image/*"
            />
        </label>
    );
}

export default UploadImageWidget;
