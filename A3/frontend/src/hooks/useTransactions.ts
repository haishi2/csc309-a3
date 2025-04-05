import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api/api-client";
import type { TransactionResponse, Transaction } from "@/types";

export interface TransactionFilters {
  type?: string;
  relatedId?: number;
  promotionId?: number;
  amount?: number;
  operator?: "gte" | "lte";
  page?: number;
  limit?: number;
}

export const TRANSACTIONS_QUERY_KEY = ["transactions"];

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, filters],
    queryFn: async () => {
      const response = await apiClient.get<TransactionResponse>(
        "/users/me/transactions"
      );
      return response.data;
    },
  });
}

export function useCreateRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      remark,
    }: {
      amount: number;
      remark?: string;
    }) => {
      const response = await apiClient.post<Transaction>(
        "/users/me/transactions",
        {
          type: "redemption",
          amount,
          remark,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch transactions after successful creation
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
    },
  });
}
