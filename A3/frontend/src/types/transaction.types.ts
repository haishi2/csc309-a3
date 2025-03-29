import type { User, PromotionUse } from "./index.ts";
import { TransactionType, TransactionStatus } from "./shared.types";

export interface Transaction {
  id: number;
  userId: number;
  user?: User;
  type: TransactionType;
  points: number;
  status: TransactionStatus;
  needsVerification: boolean;
  processedBy?: number;
  processor?: User;
  relatedId?: number;
  spent?: number;
  remark?: string;
  createdAt: Date;
  promotionUses?: PromotionUse[];
  utorid: string;
  amount: number;
  createdBy: string;
  suspicious: boolean;
}

export interface TransactionResponse {
  count: number;
  results: Transaction[];
}
