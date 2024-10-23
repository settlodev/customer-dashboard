import {ImageIcon} from "lucide-react";
import React, {useState} from "react";
import {uploadImage} from "@/lib/utils";
import {toast} from "@/hooks/use-toast";
import Image from "next/image";
interface ImageUploadProps {
    setImage: (value: string) => void;
    displayImage?: boolean | true;
    imagePath: string | 'products',
    displayStyle?: string | 'default',
    label?: string | 'Image',
    showLabel?: boolean|true,
}

function UploadImageWidget({setImage, displayImage, displayStyle, imagePath, label, showLabel}: ImageUploadProps) {
    const [uploading, setUploading] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>('');

    const uploadMyImage = async (mFile: File) => {
        setUploading(true);
        await uploadImage(mFile, imagePath, function (response) {
            console.log("response.data:", response.data);
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

    return (<label
        className={displayStyle === 'default' ? 'cursor-pointer w-20 h-20 border-1 rounded-l bg-gray-100 mr-5 flex items-center justify-center flex-col' : ''}>
        {uploading && <div className="spin-in w-[30px] h-[30px] border-2 border-emerald-300 rounded-full"></div>}
        {(imageUrl && displayImage) ?
            !uploading ?
                <Image alt="" width={150} height={150} src={imageUrl} className="object-cover w-[100%] h-[100%]"/>
                :<></>
            : <>
                {displayStyle === 'default' ?
                    !uploading && (<>
                        <span><ImageIcon/></span>
                        {showLabel && <span className="text-xs font-bold">{label}</span>}
                    </>)
                    : <></>
                }
            </>
        }
        <input
            className={displayStyle === 'default' ? "hidden" : 'flex'}
            type="file"
            name="file"
            disabled={uploading}
            onChange={async (e) => {
                const files = e.target.files
                if (files) {
                    await uploadMyImage(files[0])
                }
            }}
            accept="image/*"
        />

    </label>)
}

export default UploadImageWidget;
