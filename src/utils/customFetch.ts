import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { logoutUser } from "./logout";

export const API_URL = import.meta.env.VITE_API_URL;

const customFetch = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// A 401 from these means "bad credentials" / "no session" — never worth a
// refresh-and-retry (refreshing on /auth/refresh itself would loop).
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/login/google",
  "/auth/signup",
  "/auth/refresh",
  "/auth/logout",
];

const isAuthEndpoint = (url?: string) =>
  !!url && AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Single in-flight refresh promise so concurrent 401s (e.g. several requests
// firing right as the access token expires) share one refresh call instead
// of each rotating the refresh token against each other.
let refreshPromise: Promise<void> | null = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = customFetch
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

customFetch.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      !isAuthEndpoint(config.url)
    ) {
      config._retry = true;

      try {
        await refreshAccessToken();
        return customFetch(config);
      } catch (refreshError) {
        await logoutUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default customFetch;
