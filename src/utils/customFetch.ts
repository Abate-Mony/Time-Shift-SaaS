import axios from "axios";
import { logoutUser } from "./logout";

export const API_URL = import.meta.env.VITE_API_URL;

const customFetch = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const protectedRoutes = [
  "/users/current-user",
  "/auth/refresh",
];

customFetch.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url;

    if (
      error.response?.status === 401 &&
      protectedRoutes.includes(url)
    ) {
      await logoutUser();
      return;
    }''

    return Promise.reject(error);
  }
);

export default customFetch;