
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
// import { FormError } from "./form-error";
// import { FormSuccess } from "./form-success";
// import { ChevronDownIcon, Pencil, PlusIcon } from "lucide-react";
// import { Input } from "../ui/input";
// import { Textarea } from "../ui/textarea";
// import { Separator } from "../ui/separator";
// import { SubmitButton } from "./submit-button";
// import UploadImageWidget from "./UploadImageWidget";
// import ProductCategorySelector from "./product-category-selector";
// import BrandSelector from "./product-brand-selector";
// import { Switch } from "../ui/switch";
// import ProductTaxSelector from "./product-tax-selector";
// import { FormVariantItem, Variant } from "@/types/variant/type";
// import CancelButton from "./cancel-button";
// import { Category } from "@/types/category/type";
// import { Department } from "@/types/department/type";
// import { Brand } from "@/types/brand/type";
// import ProductDepartmentSelector from "./product-department-selector";
// const ProductFormSection = ({
//     item, form, submitData, onInvalid, error,
//     success, isPending, categories, departments, brands, variants,
//     taxClasses, inventoryTrackingChanges, setImageUrl, removeVariant, onClickCategory,
//     onClickDepartment, editVariant, deleteVariant
// }: {
//     item: any; form: any; submitData: any;
//     onInvalid: any; error: string; success: string;
//     isPending: boolean; categories: Category[]; departments: Department[]; brands: Brand[]; variants: FormVariantItem[];
//     taxClasses: any; inventoryTrackingsChanges: (value: string) => void;
//     setImageUrl: (url: string) => void; removeVariant: (index: number) => void;
//     onClickCategory: () => void; onClickDepartment: () => void;
//     editVariant: (index: number) => void, deleteVariant: (index: number) => void
// }) => {

//     <Form {...form}>
//         <form
//             onSubmit={form.handleSubmit(submitData, onInvalid)}
//             className={`gap-1`}>
//             <div>
//                 <FormError message={error} />
//                 <FormSuccess message={success} />
//                 <div className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 border-0 border-emerald-100- flex">
//                     <h3 className="font-bold flex-1">General Information</h3>
//                     <span className="flex-end"><ChevronDownIcon /></span>
//                 </div>

//                 <div className="mt-4 flex">
//                     <UploadImageWidget imagePath={'products'} displayStyle={'default'}
//                         displayImage={true} setImage={setImageUrl} />
//                     <div className="flex-1">
//                         <FormField
//                             control={form.control}
//                             name="name"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Product Name</FormLabel>
//                                     <FormControl>
//                                         <Input
//                                             placeholder="Enter product name"
//                                             {...field}
//                                             disabled={isPending}
//                                             value={field.value || ""}
//                                         />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4 mt-2">
//                     <FormField
//                         control={form.control}
//                         name="category"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel className="w-full">
//                                     <div className="flex items-center">
//                                         <div className="flex-1">Category</div>
//                                         <div className="flex mt-2 items-center self-end">
//                                             <div onClick={() => onClickCategory()}
//                                                 className="cursor-pointer text-emerald-500 font-medium flex gap-1 items-center justify-center border-1 border-emerald-500 p-1 rounded-md">
//                                                 <span>Create</span> <PlusIcon size={16} />
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </FormLabel>
//                                 {categories && categories.length > 0 ?
//                                     <FormControl>
//                                         <ProductCategorySelector
//                                             value={field.value}
//                                             onChange={field.onChange}
//                                             onBlur={field.onBlur}
//                                             isRequired
//                                             isDisabled={isPending}
//                                             label="Category"
//                                             placeholder="Select category"
//                                             categories={categories}
//                                         />
//                                     </FormControl> :
//                                     <><p className="border-1 text-sm border-gray-100 rounded-md p-2 text-red-500">You dont have any category</p></>
//                                 }
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                     <FormField
//                         control={form.control}
//                         name="department"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>
//                                     <div className="flex items-center">
//                                         <div className="flex-1">Department</div>
//                                         <div className="flex mt-2 items-center self-end">
//                                             <div onClick={() => onClickDepartment()}
//                                                 className="cursor-pointer text-emerald-500 font-medium flex gap-1 items-center justify-center border-1 border-emerald-500 p-1 rounded-md">
//                                                 <span>Create</span> <PlusIcon size={16} />
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </FormLabel>
//                                 <FormControl>
//                                     {departments && departments.length > 0 ?
//                                         <ProductDepartmentSelector
//                                             value={field.value}
//                                             onChange={field.onChange}
//                                             onBlur={field.onBlur}
//                                             isRequired
//                                             isDisabled={isPending}
//                                             label="Department"
//                                             placeholder="Select department"
//                                             departments={departments}
//                                         /> : <>
//                                             <p className="border-1 text-sm border-gray-100 rounded-md p-2 text-red-500">You dont have any department</p>
//                                         </>
//                                     }
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                     <FormField
//                         control={form.control}
//                         name="brand"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Brand</FormLabel>
//                                 <FormControl>
//                                     <BrandSelector
//                                         value={field.value || ""}
//                                         onChange={field.onChange}
//                                         onBlur={field.onBlur}
//                                         isRequired
//                                         isDisabled={isPending}
//                                         label="Brand"
//                                         placeholder="Select brand"
//                                         brands={brands}
//                                     />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />

//                     <FormField
//                         control={form.control}
//                         name="trackInventory"
//                         render={({ field }) => (
//                             <FormItem
//                                 className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
//                                 <FormLabel className="flex-1">Track Inventory</FormLabel>
//                                 <FormControl className="self-end">
//                                     <Switch
//                                         checked={field.value}
//                                         onCheckedChange={(value) => {
//                                             field.onChange(value);
//                                             inventoryTrackingChanges(value);
//                                         }}
//                                         disabled={isPending}
//                                     />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />

//                     <FormField
//                         control={form.control}
//                         name="sellOnline"
//                         defaultValue={false}
//                         render={({ field }) => (
//                             <FormItem
//                                 className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
//                                 <FormLabel className="flex-1">Sell Online</FormLabel>
//                                 <FormControl className="self-end">
//                                     <Switch
//                                         checked={field.value}
//                                         onCheckedChange={field.onChange}
//                                         disabled={isPending}
//                                     />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                     <FormField
//                         control={form.control}
//                         name="taxIncluded"
//                         defaultValue={false}
//                         render={({ field }) => (
//                             <FormItem
//                                 className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
//                                 <FormLabel className="flex-1">Tax Included</FormLabel>
//                                 <FormControl className="self-end">
//                                     <Switch
//                                         checked={field.value}
//                                         onCheckedChange={field.onChange}
//                                         disabled={isPending}
//                                     />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4 mt-4">
//                     <FormField
//                         control={form.control}
//                         name="taxClass"
//                         defaultValue={taxClasses[0].name}
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Tax Class</FormLabel>
//                                 <FormControl>
//                                     <ProductTaxSelector
//                                         value={field.value || ""}
//                                         onChange={field.onChange}
//                                         onBlur={field.onBlur}
//                                         isRequired
//                                         isDisabled={isPending}
//                                         label="Tax Class"
//                                         placeholder="Select tax class"
//                                         data={taxClasses}
//                                     />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                     <FormField
//                         control={form.control}
//                         name="sku"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>SKU</FormLabel>
//                                 <FormControl>
//                                     <Input
//                                         placeholder="Enter SKU"
//                                         {...field}
//                                         disabled={isPending}
//                                         value={field.value || ''}
//                                     />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                 </div>
//                 <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4 mt-4">

//                     {item && (
//                         <FormField
//                             control={form.control}
//                             name="status"
//                             defaultValue={false}
//                             render={({ field }) => (
//                                 <FormItem
//                                     className="flex lg:mt-4 items-center justify-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
//                                     <FormLabel className="flex-1">Product Status</FormLabel>
//                                     <FormControl className="self-end">
//                                         <Switch
//                                             checked={field.value}
//                                             onCheckedChange={field.onChange}
//                                             disabled={isPending}
//                                         />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />
//                     )}
//                 </div>
//                 <div className="mt-4">
//                     <FormField
//                         control={form.control}
//                         name="description"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Description</FormLabel>
//                                 <FormControl>
//                                     <Textarea
//                                         placeholder="Enter product description"
//                                         {...field}
//                                         disabled={isPending}
//                                         className="resize-none bg-gray-50"
//                                         maxLength={200}
//                                         value={field.value || ""}
//                                     />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                 </div>

//                 <div
//                     className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 border-0 border-emerald-100- flex mt-4">
//                     <h3 className="font-bold flex-1">Product Variants</h3>
//                     <span className="flex-end"><ChevronDownIcon /></span>
//                 </div>

//                 {variants.length > 0 ?
//                     <div className="border-t-1 border-t-gray-100 p-5">
//                         <h3 className="font-bold pb-2">Variants</h3>
//                         <div className="border-emerald-500 border-0 rounded-md pt-2 pb-2 pl-0 pr-0">
//                             {variants.map((variant: FormVariantItem, index) => {
//                                 return (
//                                     <div
//                                         className="flex border-1 border-emerald-200 mt-0 items-center pt-0 pb-0 pl-0 mb-1"
//                                         key={index}

//                                     >
//                                         <p className="flex items-center text-gray-500 self-start pl-4 pr-4 font-bold text-xs border-r-1 border-r-emerald-200 h-14 mr-4">
//                                             <span>{index + 1}</span></p>
//                                         <div className="flex-1 flex-col gap-2 pt-1 pb-1">
//                                             <p className="text-md font-medium">{variant.name}</p>
//                                             <p className="text-xs font-medium">PRICE: {variant.price}</p>
//                                         </div>
//                                         <Pencil onClick={() => editVariant(variant)} size={14} className="h-12 w-12 flex items-center pl-4 pr-4 bg-emerald-50  border-l-1 border-l-emerald-200 cursor-pointer " />
//                                         {item ? (
//                                             <p
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     deleteVariant(variant);
//                                                 }}
//                                                 className="flex items-center text-red-700 self-end pl-4 pr-4 font-bold bg-emerald-50 text-xs border-l-1 border-l-emerald-200 h-14 cursor-pointer"
//                                             >
//                                                 <span>Delete</span>
//                                             </p>
//                                         ) : (
//                                             <p
//                                                 onClick={() => removeVariant(index)}
//                                                 className="flex items-center text-red-700 self-end pl-4 pr-4 font-bold bg-emerald-50 text-xs border-l-1 border-l-emerald-200 h-14 cursor-pointer"
//                                             >
//                                                 <span>Remove</span>
//                                             </p>
//                                         )}
//                                     </div>
//                                 )
//                             })}
//                         </div>
//                     </div> : <><p className="pt-3 pb-5 text-sm">No variants added</p>
//                         {variants.length === 0 &&
//                             <p className="text-danger-500 text-sm">Add at least one variant then
//                                 click save</p>}
//                     </>
//                 }


//             </div>

//             <div className="flex items-center space-x-4 mt-4 border-t-1 border-t-gray-200 pt-5">
//                 <CancelButton />
//                 <Separator orientation="vertical" />
//                 <SubmitButton
//                     isPending={isPending || variants.length === 0}
//                     label={item ? "Update product" : "Save Product"}
//                 />
//             </div>
//         </form>
//     </Form>

// };

// export { ProductFormSection }


// // const ProductFormSection = ({
// //     item,
// //     form,
// //     submitData,
// //     onInvalid,
// //     error,
// //     success,
// //     isPending,
// //     categories,
// //     departments,
// //     brands,
// //     variants,
// //     taxClasses,
// //     inventoryTrackingChanges,
// //     setImageUrl,
// //     removeVariant,
// //     onClickCategory,
// //     onClickDepartment,
// //     editVariant,
// //     deleteVariant,
// //   }: {
// //     item: any;
// //     form: any;
// //     submitData: any;
// //     onInvalid: any;
// //     error: string;
// //     success: string;
// //     isPending: boolean;
// //     categories: Category[];
// //     departments: Department[];
// //     brands: Brand[];
// //     variants: FormVariantItem[];
// //     taxClasses: any;
// //     inventoryTrackingChanges: (value: string) => void;
// //     setImageUrl: (url: string) => void;
// //     removeVariant: (index: number) => void;
// //     onClickCategory: () => void;
// //     onClickDepartment: () => void;
// //     editVariant: (index: number) => void;
// //     deleteVariant: (index: number) => void;
// //   }) => {
// //     const renderField = (name: string, label: string, Component: any, props: any = {}) => (
// //       <FormField
// //         control={form.control}
// //         name={name}
// //         render={({ field }) => (
// //           <FormItem>
// //             <FormLabel>{label}</FormLabel>
// //             <FormControl>
// //               <Component {...props} {...field} disabled={isPending} />
// //             </FormControl>
// //             <FormMessage />
// //           </FormItem>
// //         )}
// //       />
// //     );

// //     const renderVariants = () => (
// //       <div className="mt-4">
// //         <div className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 flex">
// //           <h3 className="font-bold flex-1">Product Variants</h3>
// //           <span className="flex-end">
// //             <ChevronDownIcon />
// //           </span>
// //         </div>

// //         {variants.length > 0 ? (
// //           <div className="border-t-1 border-t-gray-100 p-5">
// //             <h3 className="font-bold pb-2">Variants</h3>
// //             <div className="border-emerald-500 rounded-md pt-2 pb-2">
// //               {variants.map((variant, index) => (
// //                 <div
// //                   key={index}
// //                   className="flex items-center border-1 border-emerald-200 p-2 mb-1"
// //                 >
// //                   <p className="flex items-center text-gray-500 pl-4 pr-4 font-bold text-xs border-r-1 border-r-emerald-200 h-14 mr-4">
// //                     {index + 1}
// //                   </p>
// //                   <div className="flex-1">
// //                     <p className="text-md font-medium">{variant.name}</p>
// //                     <p className="text-xs font-medium">PRICE: {variant.price}</p>
// //                   </div>
// //                   <Pencil
// //                     onClick={() => editVariant(index)}
// //                     size={14}
// //                     className="h-12 w-12 pl-4 pr-4 bg-emerald-50 border-l-1 border-l-emerald-200 cursor-pointer"
// //                   />
// //                   <p
// //                     onClick={() => (item ? deleteVariant(index) : removeVariant(index))}
// //                     className="text-red-700 pl-4 pr-4 font-bold bg-emerald-50 text-xs border-l-1 border-l-emerald-200 h-14 cursor-pointer"
// //                   >
// //                     {item ? "Delete" : "Remove"}
// //                   </p>
// //                 </div>
// //               ))}
// //             </div>
// //           </div>
// //         ) : (
// //           <p className="text-danger-500 text-sm mt-3">
// //             Add at least one variant, then click save.
// //           </p>
// //         )}
// //       </div>
// //     );

// //     return (
// //       <Form {...form}>
// //         <form
// //           onSubmit={form.handleSubmit(submitData, onInvalid)}
// //           className="space-y-4"
// //         >
// //           {/* General Information */}
// //           <div className="bg-gray-200 p-2 flex">
// //             <h3 className="font-bold flex-1">General Information</h3>
// //             <span className="flex-end">
// //               <ChevronDownIcon />
// //             </span>
// //           </div>

// //           <div className="mt-4 flex">
// //             <UploadImageWidget
// //               imagePath="products"
// //               displayStyle="default"
// //               displayImage
// //               setImage={setImageUrl}
// //             />
// //             <div className="flex-1">
// //               {renderField("name", "Product Name", Input, {
// //                 placeholder: "Enter product name",
// //               })}
// //             </div>
// //           </div>

// //           {/* Categories, Departments, and Brand Selectors */}
// //           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
// //             {renderField("category", "Category", ProductCategorySelector, {
// //               placeholder: "Select category",
// //               categories,
// //               onClickCreate: onClickCategory,
// //             })}
// //             {renderField("department", "Department", ProductDepartmentSelector, {
// //               placeholder: "Select department",
// //               departments,
// //               onClickCreate: onClickDepartment,
// //             })}
// //             {renderField("brand", "Brand", BrandSelector, {
// //               placeholder: "Select brand",
// //               brands,
// //             })}
// //           </div>

// //           {/* Inventory Tracking and Toggles */}
// //           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
// //             {renderField("trackInventory", "Track Inventory", Switch, {
// //               onCheckedChange: inventoryTrackingChanges,
// //             })}
// //             {renderField("sellOnline", "Sell Online", Switch)}
// //             {renderField("taxIncluded", "Tax Included", Switch)}
// //           </div>

// //           {/* Tax Class and SKU */}
// //           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
// //             {renderField("taxClass", "Tax Class", ProductTaxSelector, {
// //               placeholder: "Select tax class",
// //               data: taxClasses,
// //             })}
// //             {renderField("sku", "SKU", Input, { placeholder: "Enter SKU" })}
// //           </div>

// //           {/* Description */}
// //           {renderField("description", "Description", Textarea, {
// //             placeholder: "Enter product description",
// //             className: "resize-none bg-gray-50",
// //           })}

// //           {/* Variants */}
// //           {renderVariants()}

// //           {/* Action Buttons */}
// //           <div className="flex items-center space-x-4 border-t-1 border-t-gray-200 pt-5">
// //             <CancelButton />
// //             <Separator orientation="vertical" />
// //             <SubmitButton
// //               isPending={isPending || variants.length === 0}
// //               label={item ? "Update Product" : "Save Product"}
// //             />
// //           </div>
// //         </form>
// //       </Form>
// //     );
// //   };

// //   export { ProductFormSection };
