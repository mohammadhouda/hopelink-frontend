import axios from "axios";

const userApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

interface FailedRequest {
  resolve: (value?: unknown) => void;
  reject: (err: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

userApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url?.includes("/api/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => userApi(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await authApi.post("/api/auth/refresh", {}, { withCredentials: true });
        processQueue(null);
        return userApi(originalRequest);
      } catch (err) {
        processQueue(err);
        window.location.href = "/user/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default userApi;
