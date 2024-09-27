export const endpoints=(location?: string, id?: string) => {
    return {
        "categories": {
            "get": {method: "GET", endpoint: `/categories/${location}/${id}`},
            "list": {method: "GET", endpoint: `/categories/${location}`},
            "search": {method: "POST", endpoint: `/categories/${location}`},
            "create": {method: "POST", endpoint: `/categories/${location}/create`},
            "update": {method: "PUT", endpoint: `/categories/${location}`},
            "delete": {method: "DELETE", endpoint: `/categories/${location}/${id}`},
        },
        "auth": {
            "login": {method: "POST", endpoint: '/auth/login'},
            "register": {method: "POST", endpoint: '/auth/register'}
        }
    }
}
