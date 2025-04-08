export interface Transaction {
  id: number;
  type: "purchase" | "adjustment" | "transfer" | "redemption" | "event";
  spent?: number;
  amount: number;
  promotionIds?: number[];
  remark?: string;
  createBy: string;
  createdBy: string;
  relatedId?: number;
  utorid: string;
  suspicious?: boolean;
  processedBy?: string | null;
}

export interface TransactionResponse {
  count: number;
  results: Transaction[];
}

export interface TransactionFilters {
  type?: string;
  relatedId?: number;
  promotionId?: number;
  amount?: number;
  operator?: "gte" | "lte";
  page?: number;
  limit?: number;
}
