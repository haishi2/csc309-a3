import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, updateUserProfile } from '@/services/api/user-api';
import { useAuthStore } from '@/stores/auth-store';

export const USER_QUERY_KEY = ['user'];

export function useUser() {
    const queryClient = useQueryClient();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const {
        data: user,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: fetchCurrentUser,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1, // limit retries to prevent excessive API calls
        refetchOnWindowFocus: false,
    });

    const updateProfile = useMutation({
        mutationFn: updateUserProfile,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(USER_QUERY_KEY, updatedUser);
            return updatedUser;
        },
    });

    return {
        user,
        isLoading,
        isError,
        error,
        refetch,
        updateProfile: updateProfile.mutate,
        isUpdating: updateProfile.isPending,
    };
}