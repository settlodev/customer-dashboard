import {EndpointArgsTypes} from "@/types/endpoint-args-types";
const apiPrefix = '/api'
export const endpoints=(args?: EndpointArgsTypes) => {
    return {
        "categories": {
            "get": {method: "GET", endpoint: `${apiPrefix}/categories/${args?.location}/${args?.id}`},
            "list": {method: "GET", endpoint: `${apiPrefix}/categories/${args?.location}`},
            "search": {method: "POST", endpoint: `${apiPrefix}/categories/${args?.location}`},
            "create": {method: "POST", endpoint: `${apiPrefix}/categories/${args?.location}/create`},
            "update": {method: "PUT", endpoint: `${apiPrefix}/categories/${args?.location}`},
            "delete": {method: "DELETE", endpoint: `${apiPrefix}/categories/${args?.location}/${args?.id}`},
        },
        "business": {
            "get": {method: "GET", endpoint: `${apiPrefix}/businesses/${args?.location}/${args?.id}`},
            "list": {method: "GET", endpoint: `${apiPrefix}/businesses`},
            "search": {method: "POST", endpoint: `${apiPrefix}/businesses/${args?.location}`},
            "create": {method: "POST", endpoint: `${apiPrefix}/businesses/${args?.location}/create`},
            "update": {method: "PUT", endpoint: `${apiPrefix}/businesses/${args?.location}`},
            "delete": {method: "DELETE", endpoint: `${apiPrefix}/businesses/${args?.location}/${args?.id}`},
        },
        "users": {
            "get": {method: "GET", endpoint: `${apiPrefix}/users/${args?.location}/${args?.id}`},
            "list": {method: "GET", endpoint: `${apiPrefix}/users/${args?.location}`},
            "search": {method: "POST", endpoint: `${apiPrefix}/users/${args?.location}`},
            "create": {method: "POST", endpoint: `${apiPrefix}/users/${args?.location}/create`},
            "update": {method: "PUT", endpoint: `${apiPrefix}/users/${args?.location}`},
            "delete": {method: "DELETE", endpoint: `${apiPrefix}/users/${args?.location}/${args?.id}`},
        },
        "auth": {
            "login": {method: "POST", endpoint: `${apiPrefix}/auth/login`},
            "register": {method: "POST", endpoint: `${apiPrefix}/auth/register`},
            "verify": {method: "GET", endpoint: `${apiPrefix}/auth/verify-token/${args?.token}`}
        }
    }
}
