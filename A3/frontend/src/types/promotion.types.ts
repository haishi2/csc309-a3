import type { User, Transaction } from "./index.ts";
import { PromotionType } from "./shared.types";

export interface Promotion {
    id: number;
    name: string;
    description?: string;
    type: PromotionType;
    startTime: Date;
    endTime: Date;
    minSpend?: number;
    rate?: number;
    points?: number;
    createdAt: Date;

    managerId: number;
    manager?: User;
    uses?: PromotionUse[];
}

export interface PromotionUse {
    id: number;
    userId: number;
    promotionId: number;
    transactionId: number;

    user?: User;
    promotion?: Promotion;
    transaction?: Transaction;
}
