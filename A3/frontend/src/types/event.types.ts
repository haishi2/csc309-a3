import type { User } from "./index.ts";

export interface Event {
    id: number;
    name: string;
    description: string;
    location: string;
    startTime: Date;
    endTime: Date;
    capacity?: number;
    totalPoints: number;
    pointsRemain: number;
    pointsAwarded: number;
    isPublished: boolean;
    numGuests: number;
    createdAt: Date;

    managerId: number;
    manager?: User;

    organizers?: Organizer[];
    guests?: RSVP[];
}

export interface Organizer {
    id: number;
    eventId: number;
    userId: number;

    event?: Event;
    user?: User;
}

export interface RSVP {
    id: number;
    eventId: number;
    userId: number;
    confirmed: boolean;

    event?: Event;
    user?: User;
}
