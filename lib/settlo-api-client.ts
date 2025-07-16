"use server";

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import https from "https";
import { handleSettloApiError } from "@/lib/settlo-api-error-handler";
import { getAuthToken } from "@/lib/auth-utils";

class ApiClient {
  private instance: AxiosInstance;
  private readonly baseURL: string;
  public isPlain: boolean;

  constructor() {
    this.baseURL = process.env.SERVICE_URL || "";
    this.isPlain = false;

    this.instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: true,
      }),
    });

    this.instance.interceptors.request.use(async (config) => {
      if (!config.url?.startsWith("http")) {
        config.url = this.baseURL + config.url;
      }

      const token = await getAuthToken();
      if (token?.authToken) {
        if (!this.isPlain) {
          config.headers["Authorization"] = `Bearer ${token?.authToken}`;
        }
      }

      if (!config.responseType || config.responseType !== "blob") {
        config.headers["Content-Type"] = "application/json";
      }

      return config;
    });
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.get<T>(url, config);

      if (config?.responseType === "blob") {
        return response as unknown as T;
      }

      return response.data;
    } catch (error) {
      throw await handleSettloApiError(error);
    }
  }

  public async downloadFile(url: string): Promise<{
    data: Blob;
    filename: string;
  }> {
    try {
      const response = await this.instance.get(url, {
        responseType: "blob",
        headers: {
          Accept: "application/octet-stream, text/csv",
        },
      });

      let filename = "download.csv";
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      return {
        data: response.data,
        filename,
      };
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
