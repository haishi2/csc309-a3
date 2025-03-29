import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/api-client";
import type { TransactionResponse } from "@/types";

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
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<TransactionResponse>(
        `/users/me/transactions?${params.toString()}`
      );
      return response.data;
    },
  });
}
