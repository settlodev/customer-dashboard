"use server";

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import https from "https";
import { handleSettloApiError } from "@/lib/settlo-api-error-handler";
import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";

class ApiClient {
  private instance: AxiosInstance;
  private readonly baseURL: string;
  public isPlain: boolean;
  private isRefreshing: boolean = false;

  constructor() {
    this.baseURL = process.env.SERVICE_URL || "";
    this.isPlain = false;

    this.instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: true,
      }),
    });

    // Request interceptor — attach auth token
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

    // Response interceptor — silent token refresh on 401
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !(originalRequest as any)._retry &&
          !this.isRefreshing &&
          !originalRequest.url?.includes("/api/auth/refresh-token") &&
          !originalRequest.url?.includes("/api/auth/login")
        ) {
          (originalRequest as any)._retry = true;
          this.isRefreshing = true;

          try {
            const token = await getAuthToken();
            if (!token?.refreshToken) {
              throw new Error("No refresh token available");
            }

            // Call the refresh endpoint directly (bypass interceptors to avoid loop)
            const refreshResponse = await axios.post(
              `${this.baseURL}/api/auth/refresh-token`,
              { refreshToken: token.refreshToken },
              {
                headers: { "Content-Type": "application/json" },
                httpsAgent: new https.Agent({ rejectUnauthorized: true }),
              },
            );

            const newAccessToken = refreshResponse.data?.authToken || refreshResponse.data?.accessToken || refreshResponse.data?.token;
            const newRefreshToken = refreshResponse.data?.refreshToken || token.refreshToken;

            if (newAccessToken) {
              // Update stored tokens
              await updateAuthToken({
                ...token,
                authToken: newAccessToken,
                refreshToken: newRefreshToken,
              });

              // Retry original request with new token
              originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            console.error("[API] Token refresh failed:", refreshError);
            // Let the original 401 propagate — error handler will redirect to login
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
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

  public async patch<T, U>(
    url: string,
    data: U,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.instance.patch<T>(url, data, config);

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
