import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api/api-client";
import type {
  TransactionResponse,
  Transaction,
} from "@/types/transaction.types";

export interface AllTransactionFilters {
  name?: string;
  createdBy?: string;
  suspicious?: boolean;
  promotionId?: number;
  type?: string;
  relatedId?: number;
  amount?: number;
  operator?: "gte" | "lte";
  page?: number;
  limit?: number;
}

export const ALL_TRANSACTIONS_QUERY_KEY = ["all-transactions"];
export const TRANSACTION_DETAIL_KEY = ["transaction"];

// Get all transactions (for managers)
export function useAllTransactions(filters: AllTransactionFilters = {}) {
  return useQuery({
    queryKey: [...ALL_TRANSACTIONS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<TransactionResponse>(
        `/transactions${params.toString() ? `?${params.toString()}` : ""}`
      );
      return response.data;
    },
  });
}

// Get single transaction
export function useTransaction(transactionId: number) {
  return useQuery({
    queryKey: [...TRANSACTION_DETAIL_KEY, transactionId],
    queryFn: async () => {
      const response = await apiClient.get<Transaction>(
        `/transactions/${transactionId}`
      );
      return response.data;
    },
    enabled: !!transactionId,
  });
}

// Toggle suspicious status
export function useToggleSuspicious() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      suspicious,
    }: {
      id: number;
      suspicious: boolean;
    }) => {
      const response = await apiClient.patch<Transaction>(
        `/transactions/${id}/suspicious`,
        { suspicious }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the individual transaction
      queryClient.invalidateQueries({ queryKey: ALL_TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...TRANSACTION_DETAIL_KEY, variables.id],
      });
    },
  });
}
