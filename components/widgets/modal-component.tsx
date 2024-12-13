import { Button } from "../ui/button";
import { CardTitle } from "../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import UploadImageWidget from "./UploadImageWidget";

const ModalOverlay = () => (
    <div className="fixed w-[100%] h-[100%] bg-black z-40 left-0 top-0 opacity-20"></div>
);


const ModalContent = ({ title, children, onCancel }: { title: string; children: React.ReactNode; onCancel: () => void }) => (
    <div className="fixed w-[100%] h-[100%] z-999 left-0 top-0 flex items-center justify-center">
        <div className="w-[350px] p-5 bg-white rounded-md">
            <CardTitle className="border-b-1 border-b-gray-200 pb-4 mb-4">{title}</CardTitle>
            {children}
            <div
                onClick={onCancel}
                className="cursor-pointer text-emerald-500 font-medium flex flex-1 gap-1 items-center justify-center border-1 border-emerald-500 p-1 rounded-md mt-4"
            >
                <span>Cancel</span>
            </div>
        </div>
    </div>
);
const ModalForm = ({
    form,
    onSubmit,
    error,
    success,
    isPending,
    imagePath,
    setImage,
    fieldName,
    placeholder,
    label,
}: {
    form: any;
    onSubmit: any;
    error: string |undefined;
    success: string | undefined;
    isPending: boolean;
    imagePath: string;
    setImage: (url: string) => void;
    fieldName: string;
    placeholder: string;
    label: string;
}) => (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="gap-1">
            <div>
                <FormError message={error} />
                <FormSuccess message={success} />
                <div className="mt-4 flex">
                    <UploadImageWidget imagePath={imagePath} displayStyle="default" displayImage={true} setImage={setImage} />
                    <div className="flex-1">
                        <FormField
                            control={form.control}
                            name={fieldName}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{label}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={placeholder} {...field} disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div className="flex mt-6 pt-4 border-t-1 border-t-gray-200 gap-10">
                    <Button type="submit" disabled={isPending} className="bg-emerald-500 flex-1">
                        Save
                    </Button>
                </div>
            </div>
        </form>
    </Form>
);
export {ModalOverlay, ModalForm, ModalContent };
