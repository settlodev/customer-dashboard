"use server";

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import https from 'https';
import { handleSettloApiError } from "@/lib/settlo-api-error-handler";
import {getAuthToken} from "@/lib/auth-utils";

class ApiClient {
    private instance: AxiosInstance;
    private readonly baseURL: string;

    constructor() {

        this.baseURL = process.env.SERVICE_URL || "";

        // Remove this when we have our own certificate
        this.instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        this.instance.interceptors.request.use(async (config) => {
            if (!config.url?.startsWith("http")) {
                config.url = this.baseURL + config.url;
            }

            const token = await getAuthToken();

            if (token?.authToken) {
                config.headers["Authorization"] = `Bearer ${token.authToken}`;
            }

            /*if(!this.isAuthRoute) {
                config.headers["Authorization"] = `Bearer ${this.authToken}`;
            }*/

            config.headers["Content-Type"] = "application/json";

            return config;
        });
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.instance.get<T>(url, config);

            return response.data;
        } catch (error) {
            throw handleSettloApiError(error);
        }
    }

    public async post<T, U>(
        url: string,
        data: U,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        try {
            const response = await this.instance.post<T>(url, data, config);

            return response.data;
        } catch (error) {
            console.error(error);
            throw handleSettloApiError(error);
        }
    }

    public async put<T, U>(
        url: string,
        data: U,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        try {
            const response = await this.instance.put<T>(url, data, config);

            return response.data;
        } catch (error) {
            throw handleSettloApiError(error);
        }
    }

    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.instance.delete<T>(url, config);

            return response.data;
        } catch (error) {
            throw handleSettloApiError(error);
        }
    }
}

export default ApiClient;
