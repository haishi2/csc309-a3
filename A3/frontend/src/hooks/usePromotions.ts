import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPromotions,
  fetchPromotionById,
  createPromotion as createPromotionApi,
  updatePromotion as updatePromotionApi,
  deletePromotion as deletePromotionApi,
  PromotionsParams,
} from "@/services/api/promotions-api";

export const PROMOTIONS_QUERY_KEY = ["promotions"];

export function usePromotions(params?: PromotionsParams) {
  const queryClient = useQueryClient();

  const {
    data: promotions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PROMOTIONS_QUERY_KEY, params],
    queryFn: () => fetchPromotions(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: createPromotionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMOTIONS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePromotionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMOTIONS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromotionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMOTIONS_QUERY_KEY });
    },
  });

  return {
    promotions,
    isLoading,
    isError,
    error,
    refetch,
    createPromotion: createMutation.mutate,
    updatePromotion: updateMutation.mutate,
    deletePromotion: deleteMutation.mutate,
    createPromotionAsync: createMutation.mutateAsync,
    updatePromotionAsync: updateMutation.mutateAsync,
    deletePromotionAsync: deleteMutation.mutateAsync,
  };
}

export function usePromotion(id: number | undefined) {
  return useQuery({
    queryKey: [...PROMOTIONS_QUERY_KEY, id],
    queryFn: () => (id ? fetchPromotionById(id) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
