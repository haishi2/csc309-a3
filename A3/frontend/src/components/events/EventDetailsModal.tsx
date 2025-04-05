import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { Event } from "@/types/event.types";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";

interface EventDetailsModalProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onRegister?: () => Promise<void>;
  onUnregister?: () => Promise<void>;
  isRegistered?: boolean;
  isLoading?: boolean;
}

export function EventDetailsModal({
  event,
  open,
  onClose,
  onRegister,
  onUnregister,
  isRegistered,
  isLoading,
}: EventDetailsModalProps) {
  const canRegister =
    !isRegistered && (!event.capacity || event.numGuests < event.capacity);

  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (isFuture(startTime)) {
      return "Not Started";
    } else if (isPast(endTime)) {
      return "Ended";
    } else if (isWithinInterval(now, { start: startTime, end: endTime })) {
      return "Active";
    }
    return "Unknown";
  };

  const status = getEventStatus();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{event.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            {event.description}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Description
          </Typography>
          <Typography variant="body1">{event.description}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Location
          </Typography>
          <Typography variant="body1">{event.location}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Date and Time
          </Typography>
          <Typography variant="body1">
            {format(new Date(event.startTime), "PPP p")} -{" "}
            {format(new Date(event.endTime), "PPP p")}
          </Typography>
        </Box>

        {event.points && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Points
            </Typography>
            <Typography variant="body1">
              {event.pointsAwarded} points per attendee
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {event.pointsRemain} points remaining
            </Typography>
          </Box>
        )}

        {event.capacity && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Capacity
            </Typography>
            <Typography variant="body1">
              {event.numGuests} / {event.capacity} guests
            </Typography>
          </Box>
        )}
        {(status === "Not Started" || status === "Active") && (
          <Box sx={{ mt: 3, display: "flex", gap: 1, alignItems: "center" }}>
            <Chip
              label={
                isRegistered ? "You are registered" : "You are not registered"
              }
              color="primary"
              size="small"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {canRegister &&
          onRegister &&
          (status === "Not Started" || status === "Active") && (
            <Button
              onClick={onRegister}
              disabled={isLoading}
              variant="contained"
              color="primary"
            >
              {isLoading ? "Registering..." : "Register for Event"}
            </Button>
          )}
        {isRegistered && onUnregister && (
          <Button
            onClick={onUnregister}
            disabled={isLoading}
            variant="contained"
            color="secondary"
          >
            {isLoading ? "Unregistering..." : "Unregister for Event"}
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
