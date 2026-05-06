import axiosInstance from "./axiosInstance";

export const loginUser = (data) => axiosInstance.post("/login", data);
export const registerUser = (data) => axiosInstance.post("/register", data);
export const logoutUser = () => axiosInstance.post("/logout");
export const getSession = () => axiosInstance.get("/session");
export const getUserById = (id) => axiosInstance.get(`/user/${id}`);
export const updateUserProfile = (id, data) => axiosInstance.put(`/user/${id}`, data);
