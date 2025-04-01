import apiClient from "./api-client";
import { User } from "@/types/user.types";

export interface UsersParams {
  page?: number;
  limit?: number;
  name?: string;
  role?: string;
  verified?: boolean;
  activated?: boolean;
}

export interface UserUpdateParams {
  verified?: boolean;
  role?: string;
}

export const fetchUsers = async (params?: UsersParams) => {
  const response = await apiClient.get<{
    count: number;
    results: User[];
    totalPages: number;
    page: number;
    limit: number;
  }>("/users", { params });
  return response.data;
};

export const fetchUserById = async (id: number) => {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
};

export const updateUser = async (
  userId: number,
  userData: UserUpdateParams
) => {
  const response = await apiClient.patch<{
    id: number;
    utorid: string;
    name: string;
    verified?: boolean;
    role?: string;
  }>(`/users/${userId}`, userData);
  return response.data;
};
