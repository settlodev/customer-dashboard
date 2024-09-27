import {UUID} from "node:crypto";

export const endpoints=(location?: UUID, id?: UUID) => {
    return {
        "categories": {
            "get": {method: 'GET', endpoint: `/categories/${location}/${id}`},
            "list": {method: 'GET', endpoint: `/categories/${location}`},
            "search": {method: 'POST', endpoint: `/categories/${location}`},
            "create": {method: 'POST', endpoint: `/categories/${location}/create`},
            "update": {method: 'PUT', endpoint: `/categories/${location}`},
            "delete": {method: 'DELETE', endpoint: `/categories/${location}/${id}`},
        }
    }
}
