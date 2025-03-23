import type { User } from "./index.ts";

export interface Transfer {
    id: number;
    senderId: number;
    receiverId: number;
    points: number;
    createdAt: Date;

    sender?: User;
    receiver?: User;
}
