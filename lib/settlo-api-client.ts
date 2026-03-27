"use server";

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import https from "https";
import { handleSettloApiError } from "@/lib/settlo-api-error-handler";
import { getAuthToken, updateAuthToken, deleteAuthCookie } from "@/lib/auth-utils";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.SERVICE_URL || "";
const ACCOUNTS_SERVICE_URL = process.env.ACCOUNTS_SERVICE_URL || process.env.SERVICE_URL || "";

const sharedHttpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === "production",
});

class ApiClient {
  private instance: AxiosInstance;
  private readonly baseURL: string;
  public isPlain: boolean;
  private isRefreshing: boolean = false;

  constructor(useAuthService: boolean = false) {
    this.baseURL = useAuthService ? AUTH_SERVICE_URL : ACCOUNTS_SERVICE_URL;
    this.isPlain = false;

    this.instance = axios.create({
      httpsAgent: sharedHttpsAgent,
    });

    this.instance.interceptors.request.use(async (config) => {
      if (!config.url?.startsWith("http")) {
        config.url = this.baseURL + config.url;
      }

      if (this.isPlain) {
        (config as any)._isPlain = true;
      } else {
        const token = await getAuthToken();
        if (token?.accessToken) {
          config.headers["Authorization"] = `Bearer ${token.accessToken}`;
        }
      }

      if (!config.responseType || config.responseType !== "blob") {
        config.headers["Content-Type"] = "application/json";
      }

      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if ((originalRequest as any)?._isPlain) {
          return Promise.reject(error);
        }

        if (
          (status === 401 || status === 403) &&
          originalRequest &&
          !(originalRequest as any)._retry &&
          !this.isRefreshing &&
          !originalRequest.url?.includes("/auth/token-refresh") &&
          !originalRequest.url?.includes("/auth/login")
        ) {
          (originalRequest as any)._retry = true;
          this.isRefreshing = true;

          try {
            const token = await getAuthToken();
            if (!token?.refreshToken) {
              throw new Error("No refresh token available");
            }

            const refreshResponse = await axios.post(
              `${AUTH_SERVICE_URL}/auth/token-refresh`,
              { refreshToken: token.refreshToken },
              {
                headers: { "Content-Type": "application/json" },
                httpsAgent: sharedHttpsAgent,
              },
            );

            const newAccessToken = refreshResponse.data?.accessToken;
            const newRefreshToken = refreshResponse.data?.refreshToken || token.refreshToken;

            if (newAccessToken) {
              try {
                await updateAuthToken({
                  ...token,
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                });
              } catch {
                // Cookie update may fail outside Server Actions — safe to ignore
              }

              originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
              return this.instance(originalRequest);
            }

            throw new Error("No access token in refresh response");
          } catch (refreshError) {
            console.error("[API] Token refresh failed:", refreshError);
            try {
              await deleteAuthCookie();
            } catch {
              // Cookie deletion may fail outside Server Actions — safe to ignore
            }
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
