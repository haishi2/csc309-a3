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
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<TransactionResponse>(
        `/users/me/transactions${
          params.toString() ? `?${params.toString()}` : ""
        }`
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
          promotionIds: [],
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
    },
  });
}
