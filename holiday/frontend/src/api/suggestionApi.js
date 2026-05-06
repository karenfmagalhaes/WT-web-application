import axiosInstance from "./axiosInstance";

export const getMySuggestions = () => axiosInstance.get("/suggestions");
export const addSuggestion = (data) => axiosInstance.post("/suggestions", data);
export const deleteSuggestion = (id) => axiosInstance.delete(`/suggestion/${id}`);
