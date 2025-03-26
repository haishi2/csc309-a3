import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Event } from "@/types/event.types";
import { useState } from "react";

interface RewardPointsModalProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onRewardPoints: (points: number, utorid?: string) => Promise<void>;
  isLoading?: boolean;
}

export function RewardPointsModal({
  event,
  open,
  onClose,
  onRewardPoints,
  isLoading,
}: RewardPointsModalProps) {
  const [utorid, setUtorid] = useState("");
  const [points, setPoints] = useState<number>(event.pointsAwarded);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRewardPoints(points, utorid.trim() || undefined);
      setUtorid("");
      onClose();
    } catch (error) {
      console.error("Failed to reward points:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reward Points - {event.name}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter a username to reward points to a specific attendee, or leave
            empty to reward points to all confirmed attendees.
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Points to Award"
              type="number"
              value={points}
              onChange={(e) =>
                setPoints(Math.max(0, parseInt(e.target.value) || 0))
              }
              disabled={isLoading || isSubmitting}
              required
              size="small"
              inputProps={{ min: 0 }}
            />
            <Box display="flex" gap={1}>
              <TextField
                label="username (optional)"
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
                disabled={isLoading || isSubmitting}
                size="small"
                sx={{ width: "70%" }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || isSubmitting || points <= 0}
              >
                {isSubmitting ? "Rewarding..." : "Reward Points"}
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Event Attendees
        </Typography>
        <List>
          {event.guests?.map((guest) => (
            <ListItem key={guest.userId}>
              <ListItemText primary={guest.user?.username} />
            </ListItem>
          ))}
          {(!event.guests || event.guests.length === 0) && (
            <ListItem>
              <ListItemText
                primary="No confirmed attendees"
                sx={{ color: "text.secondary" }}
              />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
