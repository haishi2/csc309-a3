import apiClient from './api-client';

interface LoginRequest {
    utorid: string;
    password: string;
}

interface LoginResponse {
    token: string;
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/tokens', credentials);
    return response.data;
};

export const signup = async (userData: any): Promise<any> => {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data;
};

export const logout = async (): Promise<void> => {
    // If your API has a logout endpoint
    await apiClient.post('/auth/logout');
};