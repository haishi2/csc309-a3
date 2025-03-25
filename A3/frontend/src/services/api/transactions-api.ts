import apiClient from "./api-client";

interface PurchaseResponse {
  id: number;
  utorid: string;
  type: string;
  spent: number;
  earned: number;
  remark: string;
  promotionIds: number[];
  createdBy: string;
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
