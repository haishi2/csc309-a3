import apiClient from './api-client';
import { User } from '@/types/user.types';

export const fetchCurrentUser = async (): Promise<User> => {
  try {
    // The response is directly the user object, not wrapped in a "user" property
    const response = await apiClient.get<User>('/users/me');
    
    // Check if response data exists
    if (!response.data) {
      throw new Error('User data not found in response');
    }
    
    // Transform API response to match your User type if needed
    const userData: User = {
      ...response.data,
      // Map properties that have different names
      points: response.data.points || 0,
      isActivated: response.data.verified || false,
      // Add any required fields that might be missing with defaults
      verified: response.data.verified || false,
      isSuspicious: false,
      updatedAt: response.data.updatedAt || response.data.createdAt,
    };
    
    return userData;
  } catch (error) {
    // Return a fallback user object instead of undefined
    console.error('Error fetching user data:', error);
    
    // You can either throw the error (React Query will handle it)
    throw error;
    
    // Or return a default user object (less recommended approach)
    // return { id: 0, utorid: '', name: '', role: 'REGULAR' } as User;
  }
};

export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  // Similar transformation might be needed here
  const response = await apiClient.patch<User>('/users/me', userData);
  
  // Transform response to match your User interface
  return {
    ...response.data,
    points: response.data.points || 0,
    isActivated: response.data.verified || false,
    verified: response.data.verified || false,
    isSuspicious: false,
    updatedAt: response.data.updatedAt || response.data.createdAt,
  };
};