import apiClient from "./api-client";
import { Event } from "@/types/event.types";
import { EventFormData, EventFormUpdate } from "@/components/events/EventForm";

export interface EventsParams {
  page?: number;
  limit?: number;
  name?: string;
  isPublished?: boolean;
}

export const fetchEvents = async (params?: EventsParams) => {
  const response = await apiClient.get<{ count: number; results: Event[] }>(
    "/events",
    { params }
  );
  return response.data;
};

export const fetchEventById = async (id: number) => {
  const response = await apiClient.get<Event>(`/events/${id}`);
  return response.data;
};

export const createEvent = async (data: EventFormData) => {
  const response = await apiClient.post<Event>("/events", data);
  return response.data;
};

export const updateEvent = async ({
  id,
  ...data
}: { id: number } & EventFormUpdate) => {
  const response = await apiClient.patch<Event>(`/events/${id}`, data);
  return response.data;
};

export const deleteEvent = async (id: number) => {
  await apiClient.delete(`/events/${id}`);
};

export const removeGuest = async (
  eventId: number,
  userId: number
): Promise<void> => {
  await apiClient.delete(`/events/${eventId}/guests/${userId}`);
};

export const addGuest = async (
  eventId: number,
  utorid: string
): Promise<void> => {
  await apiClient.post(`/events/${eventId}/guests`, { utorid });
};

export const addOrganizer = async (
  eventId: number,
  utorid: string
): Promise<void> => {
  await apiClient.post(`/events/${eventId}/organizers`, { utorid });
};

export const removeOrganizer = async (
  eventId: number,
  userId: number
): Promise<void> => {
  await apiClient.delete(`/events/${eventId}/organizers/${userId}`);
};

export const registerForEvent = async (eventId: number) => {
  await apiClient.post(`/events/${eventId}/guests/me`);
};

export const unregisterForEvent = async (eventId: number) => {
  await apiClient.delete(`/events/${eventId}/guests/me`);
};

export const rewardPoints = async (
  eventId: number,
  data: { utorid?: string; amount: number; type: string }
): Promise<void> => {
  console.log("made req");
  await apiClient.post(`/events/${eventId}/transactions`, data);
};
