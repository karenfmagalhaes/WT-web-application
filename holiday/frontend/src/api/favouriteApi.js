import axiosInstance from "./axiosInstance";

export const getSavedHolidays = () => axiosInstance.get("/saved-holidays");
export const addSavedHoliday = (holidayId) =>
  axiosInstance.post("/saved-holidays", { holidayId });
export const deleteSavedHoliday = (savedId) =>
  axiosInstance.delete(`/saved-holiday/${savedId}`);
