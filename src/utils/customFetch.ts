import axios from "axios";
import { logoutUser } from "./logout";

export const API_URL = import.meta.env.VITE_API_URL;

const customFetch = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

customFetch.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await logoutUser();

      // Stop execution because we're leaving the page.
      return new Promise(() => { });
    }

    return Promise.reject(error);
  }
);

export default customFetch;