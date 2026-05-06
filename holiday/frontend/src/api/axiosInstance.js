import axios from "axios";
import { API_BASE_URL } from "../utils/env";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default axiosInstance;
