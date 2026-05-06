import axiosInstance from "./axiosInstance";

export const loginUser = (data) => axiosInstance.post("/login", data);
export const signupUser = (data) => axiosInstance.post("/register", data);
export const logoutUser = () => axiosInstance.post("/logout");
export const getMe = () => axiosInstance.get("/session");

//changed to match backend authRoutes
