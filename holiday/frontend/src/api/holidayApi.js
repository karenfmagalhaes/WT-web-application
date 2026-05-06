import axiosInstance from "./axiosInstance";

export const getHolidays = (params) => axiosInstance.get("/holidays", { params });
export const getHolidayById = (id) => axiosInstance.get(`/holiday/${id}`);
export const createHoliday = (data) => axiosInstance.post("/holidays", data);
export const updateHoliday = (id, data) => axiosInstance.put(`/holiday/${id}`, data);
export const deleteHoliday = (id) => axiosInstance.delete(`/holiday/${id}`);
