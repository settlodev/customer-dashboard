"use server";

import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import https from 'https';
import { handleSettloApiError } from "@/lib/settlo-api-error-handler";
import {getAuthToken} from "@/lib/auth-utils";

class ApiClient {
    private instance: AxiosInstance;
    private readonly baseURL: string;
    public isPlain: boolean;

    constructor() {

        this.baseURL = process.env.SERVICE_URL || "";
        this.isPlain = false;

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
            //console.log("API Client token:", token?.authToken);
            if (token?.authToken) {
                if(!this.isPlain) {
                    config.headers["Authorization"] = `Bearer ${token?.authToken}`;
                }
            }

            config.headers["Content-Type"] = "application/json";

            return config;
        });
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.instance.get<T>(url, config);
            return response.data;
        } catch (error) {
            throw await handleSettloApiError(error);
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
            console.error("Error in post:", error);
            throw await handleSettloApiError(error);
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
            throw await handleSettloApiError(error);
        }
    }

    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.instance.delete<T>(url, config);

            return response.data;
        } catch (error) {
            throw await handleSettloApiError(error);
        }
    }
}

export default ApiClient;
