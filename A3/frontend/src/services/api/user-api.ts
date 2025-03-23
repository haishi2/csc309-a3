import apiClient from './api-client';
import { User } from '@/types/user.types';

export const fetchCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>('/users/me');
    
    if (!response.data) {
      throw new Error('User data not found in response');
    }
    
    const userData: User = {
      ...response.data,
      points: response.data.points,
      isActivated: response.data.verified,
      verified: response.data.verified,
      isSuspicious: false,
      updatedAt: response.data.updatedAt || response.data.createdAt,
    };
    
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me', userData);
  
  return {
    ...response.data,
    points: response.data.points,
    isActivated: response.data.verified,
    verified: response.data.verified,
    isSuspicious: false,
    updatedAt: response.data.updatedAt || response.data.createdAt,
  };
};