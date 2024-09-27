import {EndpointArgsTypes} from "@/types/endpoint-args-types";

export const endpoints=(args?: EndpointArgsTypes) => {
    return {
        "categories": {
            "get": {method: "GET", endpoint: `/categories/${args?.location}/${args?.id}`},
            "list": {method: "GET", endpoint: `/categories/${args?.location}`},
            "search": {method: "POST", endpoint: `/categories/${args?.location}`},
            "create": {method: "POST", endpoint: `/categories/${args?.location}/create`},
            "update": {method: "PUT", endpoint: `/categories/${args?.location}`},
            "delete": {method: "DELETE", endpoint: `/categories/${args?.location}/${args?.id}`},
        },
        "business": {
            "get": {method: "GET", endpoint: `/businesses/${args?.location}/${args?.id}`},
            "list": {method: "GET", endpoint: `/businesses/${args?.location}`},
            "search": {method: "POST", endpoint: `/businesses/${args?.location}`},
            "create": {method: "POST", endpoint: `/businesses/${args?.location}/create`},
            "update": {method: "PUT", endpoint: `/businesses/${args?.location}`},
            "delete": {method: "DELETE", endpoint: `/businesses/${args?.location}/${args?.id}`},
        },
        "users": {
            "get": {method: "GET", endpoint: `/users/${args?.location}/${args?.id}`},
            "list": {method: "GET", endpoint: `/users/${args?.location}`},
            "search": {method: "POST", endpoint: `/users/${args?.location}`},
            "create": {method: "POST", endpoint: `/users/${args?.location}/create`},
            "update": {method: "PUT", endpoint: `/users/${args?.location}`},
            "delete": {method: "DELETE", endpoint: `/users/${args?.location}/${args?.id}`},
        },
        "auth": {
            "login": {method: "POST", endpoint: '/auth/login'},
            "register": {method: "POST", endpoint: '/auth/register'},
            "verify": {method: "GET", endpoint: `/auth/verify-token/${args?.token}`}
        }
    }
}
