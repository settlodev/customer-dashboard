// "use server";
//
// import {LoginSchema} from "@/types/data-schemas";
// import {z} from "zod";
// import {LoginResponse} from "@/types/types";
// import {parseStringify} from "@/lib/utils";
// import ApiClient from "@/lib/settlo-api-client";
// import {endpoints} from "@/types/endpoints";
// import {cookies} from "next/headers";
//
// export const login = async (
//     credentials: z.infer<typeof LoginSchema>,
// ): Promise<LoginResponse> => {
//     const validatedData = LoginSchema.safeParse(credentials);
//
//     console.log("credentials are:", credentials);
//     if (!validatedData) {
//         return parseStringify({
//             type: "error",
//             password: credentials.password,
//             email: credentials.email
//         });
//     }else{
//         try {
//             const apiClient = new ApiClient();
//
//             const myEndpoints = endpoints();
//             //console.log("credentials are:", validatedData.data);
//
//             const data:LoginResponse = await apiClient.post(myEndpoints.auth.login.endpoint, validatedData.data);
//
//             console.log("The user data after authentication are:", data);
//
//             if(data) {
//                 const myCookies = cookies();
//                 myCookies.set('authToken', data.authToken);
//                 myCookies.set('userData', JSON.stringify(data));
//             }
//
//             return parseStringify({
//                 type: "success",
//                 data: data
//             });
//         } catch (error) {
//             throw error;
//         }
//     }
// }
//
// export const getAuthenticatedUser = async (): Promise<LoginResponse> => {
//     //return current user object
//     try {
//         const apiClient = new ApiClient();
//
//         const myEndpoints = endpoints();
//         //console.log("credentials are:", validatedData.data);
//
//         const data:LoginResponse = await apiClient.get(myEndpoints.auth.login.endpoint);
//
//         if(data) {
//             const myCookies = cookies();
//             myCookies.set('authToken', data.authToken);
//             myCookies.set('businessId', data.businessId);
//             myCookies.set('firstName', data.firstName);
//             myCookies.set('lastName', data.lastName);
//             myCookies.set('email', data.email);
//
//             myCookies.set('userData', JSON.stringify(data));
//         }
//
//         return parseStringify({
//             type: "success",
//             data: data
//         });
//     } catch (error) {
//         throw error;
//     }
// };
