import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api/api-client";
import type {
  TransactionResponse,
  TransactionFilters,
  Transaction,
} from "@/types/transaction.types";

export const TRANSACTIONS_QUERY_KEY = ["transactions"];

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add each filter to query params if it exists
      if (filters.type) params.append("type", filters.type);
      if (filters.relatedId) params.append("relatedId", filters.relatedId.toString());
      if (filters.promotionId) params.append("promotionId", filters.promotionId.toString());
      if (filters.amount) params.append("amount", filters.amount.toString());
      if (filters.operator) params.append("operator", filters.operator);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await apiClient.get<TransactionResponse>(
        `/users/me/transactions${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    },
  });
}

export function useCreateRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, remark }: { amount: number; remark?: string }) => {
      const response = await apiClient.post<Transaction>('/users/me/transactions', {
        type: 'redemption',
        amount,
        remark,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
    },
  });
}
