import apiClient from "./api-client";

interface LoginRequest {
  utorid: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface PasswordResetRequest {
  utorid: string;
}

interface PasswordResetResponse {
  expiresAt: string;
  resetToken: string;
}

interface ResetPasswordRequest {
  utorid: string;
  password: string;
}

export const login = async (
  credentials: LoginRequest
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(
    "/auth/tokens",
    credentials
  );
  return response.data;
};

export const signup = async (userData: any): Promise<any> => {
  const response = await apiClient.post("/auth/signup", userData);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const requestPasswordReset = async (
  request: PasswordResetRequest
): Promise<PasswordResetResponse> => {
  const response = await apiClient.post<PasswordResetResponse>(
    "/auth/resets",
    request
  );
  return response.data;
};

export const resetPassword = async (
  resetToken: string,
  request: ResetPasswordRequest
): Promise<void> => {
  await apiClient.post(`/auth/resets/${resetToken}`, request);
};
