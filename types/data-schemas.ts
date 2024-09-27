import {object, string} from "zod";


export const LoginSchema = object({
    username: string()
        .min(6, "Please enter a valid email address")
        .email("Please enter a valid email address"),
    password: string({ required_error: "Schema password" }).min(
        6,
        "Please enter a valid password",
    ),
});





