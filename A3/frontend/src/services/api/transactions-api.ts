import apiClient from "./api-client";
import type { Transaction, TransactionResponse } from "@/types";

interface PurchaseResponse {
  id: number;
  utorid: string;
  type: string;
  spent: number;
  earned: number;
  remark: string;
  promotionIds: number[];
  createBy: string;
}

interface PurchaseTransaction {
  utorid: string;
  type: "purchase";
  spent: number;
  promotionIds?: number[];
  remark?: string;
}

interface ProcessRedemptionResponse {
  id: number;
  utorid: string;
  type: string;
  processedBy: string;
  amount: number;
  remark: string;
  createdBy: string;
}

interface TransactionFilters {
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

export const createPurchase = async (
  transaction: PurchaseTransaction
): Promise<PurchaseResponse> => {
  const response = await apiClient.post<PurchaseResponse>(
    "/transactions",
    transaction
  );
  return response.data;
};

export const processRedemption = async (
  transactionId: number,
  remark?: string
): Promise<ProcessRedemptionResponse> => {
  const response = await apiClient.post<ProcessRedemptionResponse>(
    `/transactions/${transactionId}/process`,
    { remark }
  );
  return response.data;
};

export const fetchAllTransactions = async (
  filters: TransactionFilters = {}
) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await apiClient.get<TransactionResponse>(
    `/transactions?${params.toString()}`
  );
  return response.data;
};

export const fetchTransaction = async (id: number) => {
  const response = await apiClient.get<Transaction>(`/transactions/${id}`);
  return response.data;
};

export const toggleSuspicious = async (id: number, suspicious: boolean) => {
  const response = await apiClient.patch<Transaction>(
    `/transactions/${id}/suspicious`,
    { suspicious }
  );
  return response.data;
};
