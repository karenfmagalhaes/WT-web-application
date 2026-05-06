import axiosInstance from "./axiosInstance";

export const getAdminSuggestions = (status) =>
  axiosInstance.get("/admin/suggestions", { params: status ? { status } : {} });

export const approveSuggestion = (id) =>
  axiosInstance.put(`/admin/suggestion/${id}/approve`);

export const rejectSuggestion = (id) =>
  axiosInstance.put(`/admin/suggestion/${id}/reject`);

export const deleteAdminSuggestion = (id) =>
  axiosInstance.delete(`/admin/suggestion/${id}`);

export const getAdminUsers = () => axiosInstance.get("/admin/users");

export const deleteAdminUser = (id) =>
  axiosInstance.delete(`/admin/user/${id}`);

export const updateUserRole = (id, role) =>
  axiosInstance.put(`/admin/user/${id}/role`, { role });
