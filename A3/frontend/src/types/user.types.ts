import type {
    Transaction,
    Transfer,
    Event,
    Organizer,
    RSVP,
    Promotion,
    PromotionUse,
} from "./index.ts";
import { Role } from "./shared.types";

export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    name: string;
    isActivated: boolean;
    role: Role;
    verifiedStudent: boolean;
    isSuspicious: boolean;
    pointsBalance: number;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    avatarUrl?: string;
    birthday?: string;

    transactions?: Transaction[];
    cashierTransactions?: Transaction[];
    receivedTransfers?: Transfer[];
    sentTransfers?: Transfer[];
    events?: Event[];
    organizedEvents?: Organizer[];
    rsvps?: RSVP[];
    promotions?: Promotion[];
    promotionUses?: PromotionUse[];
}
