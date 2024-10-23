import {ImageIcon} from "lucide-react";
import React, {useState} from "react";
import {uploadImage} from "@/lib/utils";
import {toast} from "@/hooks/use-toast";
import Image from "next/image";
interface ImageUploadProps {
    setImage: (value: string) => void;
    display: boolean
}

function UploadImageWidget({setImage, display}: ImageUploadProps) {
    const [uploading, setUploading] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>('');

    const uploadMyImage = async (mFile: File) => {
        setUploading(true);
        await uploadImage(mFile, 'products', function (response) {
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
            setUploading(true);
        });
    }

    return <label
        className="cursor-pointer w-20 h-20 border-1 rounded-l bg-gray-100 mr-5 flex items-center justify-center flex-col">
        {(imageUrl && display) ?
            <Image alt="" width={0} height={0} src={imageUrl} className="object-cover w-full h-full" /> :
            <>
                <span><ImageIcon/></span>
                <span className="text-xs font-bold">Image</span>
                <input
                    className="hidden"
                    type="file"
                    name="file"
                    disabled={uploading}
                    onChange={async (e) => {
                        const files = e.target.files
                        if (files) {
                            await uploadMyImage(files[0])
                        }
                    }}
                    accept="image/png, image/jpeg, image/jpg"
                />
            </>
        }
    </label>
}

export default UploadImageWidget;
