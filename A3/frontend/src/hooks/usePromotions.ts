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

  //set up query for promotions with expiration time of 5 minutes
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

  //set up mutations for create, update, and delete
  const createMutation = useMutation({
    mutationFn: createPromotionApi,
    onSuccess: () => {
      //clear existing queries to force refetch
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

//set up query to get a single promotion by id
export function usePromotion(id: number | undefined) {
  return useQuery({
    queryKey: [...PROMOTIONS_QUERY_KEY, id],
    queryFn: () => (id ? fetchPromotionById(id) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
