/**
 * Factory that creates a portal-specific Axios instance with a silent token-refresh
 * interceptor attached.
 *
 * All three portals share identical interceptor logic. The only difference is the
 * redirect destination after an unrecoverable 401.
 *
 * Usage:
 *   const api = createAxiosInstance("/login");          // admin
 *   const api = createAxiosInstance("/charity/login");  // charity
 *   const api = createAxiosInstance("/user/login");     // user
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

interface QueueEntry {
  resolve: (value?: unknown) => void;
  reject: (err: unknown) => void;
}

export function createAxiosInstance(loginRedirect: string): AxiosInstance {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
  });

  // Dedicated instance used only for the refresh call — never intercepted itself.
  const refreshClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
  });

  let isRefreshing = false;
  let queue: QueueEntry[] = [];

  function processQueue(error: unknown): void {
    queue.forEach((entry) =>
      error ? entry.reject(error) : entry.resolve()
    );
    queue = [];
  }

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Never retry the refresh endpoint itself — prevents infinite loops.
      if (originalRequest.url?.includes("/api/auth/refresh")) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        // If a refresh is already in-flight, queue this request to replay once done.
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            queue.push({ resolve, reject });
          }).then(() => instance(originalRequest));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await refreshClient.post("/api/auth/refresh");
          processQueue(null);
          return instance(originalRequest);
        } catch (err) {
          processQueue(err);
          window.location.href = loginRedirect;
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}
