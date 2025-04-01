import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsers,
  updateUser,
  UsersParams,
  UserUpdateParams,
} from "@/services/api/users-api";

export const USERS_QUERY_KEY = ["users"];

export function useUsers(params?: UsersParams) {
  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: () => fetchUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number;
      data: UserUpdateParams;
    }) => updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  return {
    users,
    isLoading,
    isError,
    error,
    refetch,
    updateUser: (userId: number, data: UserUpdateParams) =>
      updateUserMutation.mutate({ userId, data }),
    isUpdating: updateUserMutation.isPending,
  };
}
