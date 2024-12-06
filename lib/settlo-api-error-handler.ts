import axios, { AxiosError } from "axios";

export const handleSettloApiError = async (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.log("axiosError.response:", axiosError.response)

        if (axiosError.response) {
            switch (axiosError.response.status) {
                // case 400:
                //     return {
                //         error: "Discount can not be in the past date.",
                //     };
                
                case 401:
                    return {
                        error: "Unauthorized, you are not allowed to perform this action.",
                    };
                case 403:

                    return {
                        error: "Error: You do not have sufficient permissions to perform this action.",
                    };
                case 404:
                    return {
                        error: "Sorry, we could not find a valid resource with your request, please try again.",
                    };
                case 409:
                    return {
                    error:"Delete first the stock variant, then delete the stock",
                }    
                case 601:
                    return {
                        error: "Email already registered",
                    };
                case 602:
                    return {
                        error: "Phone number already registered",
                    };
                case 603:
                    return {
                        error: "Login failed, wrong credentials",
                    };
                case 500:
                    return {
                        error: "There is error with the system, please try again later",
                    };
                default:
                    return {
                        error:
                            "Something went wrong while processing your request, please try again.",
                    };
            }
        } else {
            return {
                error: "Something went wrong while processing your request, please try again.",
            };
        }
    } else {
        return {
            error: "Something went wrong while processing your request, please try again.",
        };
    }
};

// export const resolveError = async (error: unknown) => {
//     const promise1 = new Promise((resolve, reject) => {
//         setTimeout(() => {
//           resolve(error);
//         }, 1000);
//       });
//       return await Promise.all([promise1]).then(values => values)   
// };


