import axios from "axios";
export const API_URL = import.meta.env.VITE_API_URL;
const customFetch = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default customFetch;
