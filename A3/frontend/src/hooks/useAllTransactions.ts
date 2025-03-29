import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllTransactions,
  fetchTransaction,
  toggleSuspicious,
} from "@/services/api/transactions-api";
import { TransactionFilters } from "./useTransactions";

export const ALL_TRANSACTIONS_QUERY_KEY = ["all-transactions"];
export const TRANSACTION_QUERY_KEY = ["transaction"];

export function useAllTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...ALL_TRANSACTIONS_QUERY_KEY, filters],
    queryFn: () => fetchAllTransactions(filters),
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: [...TRANSACTION_QUERY_KEY, id],
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  });
}

export function useToggleSuspicious() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, suspicious }: { id: number; suspicious: boolean }) =>
      toggleSuspicious(id, suspicious),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEY });
    },
  });
}
