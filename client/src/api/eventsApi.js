import axiosInstance from "./axiosInstance";

export const fetchEvents = (params) => axiosInstance.get("/events", { params });
export const createEvent = (data) => axiosInstance.post("/events", data);
export const updateEvent = (id, data) => axiosInstance.put(`/events/${id}`, data);
export const deleteEvent = (id) => axiosInstance.delete(`/events/${id}`);
export const updateEventDate = (id, data) => axiosInstance.patch(`/events/${id}/date`, data);
