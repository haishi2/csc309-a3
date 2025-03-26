import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  removeGuest,
  addGuest,
  addOrganizer,
  removeOrganizer,
  registerForEvent,
  unregisterForEvent,
  rewardPoints,
  EventsParams,
} from "@/services/api/events-api";

export const EVENTS_QUERY_KEY = ["events"];

export function useEvents(params?: EventsParams) {
  const queryClient = useQueryClient();

  const {
    data: events,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...EVENTS_QUERY_KEY, params],
    queryFn: () => fetchEvents(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const removeGuestMutation = useMutation({
    mutationFn: ({ eventId, userId }: { eventId: number; userId: number }) =>
      removeGuest(eventId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const addGuestMutation = useMutation({
    mutationFn: ({ eventId, utorid }: { eventId: number; utorid: string }) =>
      addGuest(eventId, utorid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const addOrganizerMutation = useMutation({
    mutationFn: ({ eventId, utorid }: { eventId: number; utorid: string }) =>
      addOrganizer(eventId, utorid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const removeOrganizerMutation = useMutation({
    mutationFn: ({ eventId, userId }: { eventId: number; userId: number }) =>
      removeOrganizer(eventId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const registerForEventMutation = useMutation({
    mutationFn: ({ eventId }: { eventId: number }) => registerForEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const unregisterForEventMutation = useMutation({
    mutationFn: ({ eventId }: { eventId: number }) =>
      unregisterForEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  const rewardPointsMutation = useMutation({
    mutationFn: ({
      eventId,
      utorid,
      amount,
    }: {
      eventId: number;
      utorid?: string;
      amount: number;
    }) => rewardPoints(eventId, { utorid, amount, type: "event" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
  });

  return {
    events,
    isLoading,
    isError,
    error,
    refetch,
    createEvent: createMutation.mutate,
    updateEvent: updateMutation.mutate,
    deleteEvent: deleteMutation.mutate,
    removeGuest: (eventId: number, userId: number) =>
      removeGuestMutation.mutate({ eventId, userId }),
    addGuest: (eventId: number, utorid: string) =>
      addGuestMutation.mutate({ eventId, utorid }),
    addOrganizer: (eventId: number, utorid: string) =>
      addOrganizerMutation.mutate({ eventId, utorid }),
    removeOrganizer: (eventId: number, userId: number) =>
      removeOrganizerMutation.mutate({ eventId, userId }),
    registerForEvent: (eventId: number) =>
      registerForEventMutation.mutate({ eventId }),
    unregisterForEvent: (eventId: number) =>
      unregisterForEventMutation.mutate({ eventId }),
    rewardPoints: (eventId: number, amount: number, utorid?: string) =>
      rewardPointsMutation.mutate({ eventId, amount, utorid }),
  };
}

export function useEvent(id: number | undefined) {
  return useQuery({
    queryKey: [...EVENTS_QUERY_KEY, id],
    queryFn: () => (id ? fetchEventById(id) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
