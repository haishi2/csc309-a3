import apiClient from "./api-client";
import { User } from "@/types/user.types";

interface TransferResponse {
  id: number;
  sender: string;
  recipient: string;
  type: string;
  sent: number;
  remark: string;
  createdBy: string;
}

interface RedemptionResponse {
  id: number;
  utorid: string;
  type: string;
  processedBy: string | null;
  amount: number;
  remark: string;
  createdBy: string;
}

export const createTransfer = async (
  recipientId: number,
  amount: number,
  remark?: string
): Promise<TransferResponse> => {
  const response = await apiClient.post<TransferResponse>(
    `/users/${recipientId}/transactions`,
    {
      type: "transfer",
      amount,
      remark,
    }
  );
  return response.data;
};

export const createRedemption = async (
  amount: number,
  remark?: string
): Promise<RedemptionResponse> => {
  const response = await apiClient.post<RedemptionResponse>(
    "/users/me/transactions",
    {
      type: "redemption",
      amount,
      remark,
    }
  );
  return response.data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  try {
    // The response is directly the user object, not wrapped in a "user" property
    const response = await apiClient.get<User>("/users/me");

    // Check if response data exists
    if (!response.data) {
      throw new Error("User data not found in response");
    }

    // Transform API response to match your User type if needed
    const userData: User = {
      ...response.data,
      // Map properties that have different names
      points: response.data.points,
      isActivated: response.data.verified,
      // Add any required fields that might be missing with defaults
      verified: response.data.verified,
      isSuspicious: false,
      updatedAt: response.data.updatedAt || response.data.createdAt,
    };

    return userData;
  } catch (error) {
    // Return a fallback user object instead of undefined
    console.error("Error fetching user data:", error);

    // throw the error (React Query will handle it)
    throw error;
  }
};

export const updateUserProfile = async (
  userData: Partial<User>
): Promise<User> => {
  // Similar transformation might be needed here
  const response = await apiClient.patch<User>("/users/me", userData);

  // Transform response to match your User interface
  return {
    ...response.data,
    points: response.data.points,
    isActivated: response.data.verified,
    verified: response.data.verified,
    isSuspicious: false,
    updatedAt: response.data.updatedAt || response.data.createdAt,
  };
};
