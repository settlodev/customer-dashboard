import {ImageIcon} from "lucide-react";
import React, {useState} from "react";
import {uploadImage} from "@/lib/utils";
import {toast} from "@/hooks/use-toast";
import Image from "next/image";
interface ImageUploadProps {
    setImage: (value: string) => void;
    displayImage: boolean;
    displayStyle: string | 'default'
}

function UploadImageWidget({setImage, displayImage, displayStyle}: ImageUploadProps) {
    const [uploading, setUploading] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>('');

    const uploadMyImage = async (mFile: File) => {
        setUploading(true);
        await uploadImage(mFile, 'products', function (response) {
            console.log("response:", response);
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

    return <label className={displayStyle==='default'?'cursor-pointer w-20 h-20 border-1 rounded-l bg-gray-100 mr-5 flex items-center justify-center flex-col':''}>
        {(imageUrl && displayImage) ?
            <Image alt="" width={0} height={0} src={imageUrl} className="object-cover w-full h-full" /> :
            <>
                {displayStyle === 'default'?
                    uploading?
                        <div className="spin-in w-[30px] h-[30px] border-2 border-emerald-300 rounded-full"></div>:
                <>
                    <span><ImageIcon/></span>
                    <span className="text-xs font-bold">Image</span>
                </>
                :<></>
                }
                <input
                    className={displayStyle==='default'?"hidden":'flex'}
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
