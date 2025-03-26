import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useState } from "react";
import { Event } from "@/types/event.types";
import { Role } from "@/types/shared.types";
import { useUser } from "@/hooks/useUser";

interface EventGuestsModalProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onRemoveGuest: (userId: number) => void;
  onAddGuest: (utorid: string) => void;
  isLoading?: boolean;
}

export function EventGuestsModal({
  event,
  open,
  onClose,
  onRemoveGuest,
  onAddGuest,
  isLoading = false,
}: EventGuestsModalProps) {
  const [newGuestUtorid, setNewGuestUtorid] = useState("");
  const { user } = useUser();
  const isManager =
    user?.role.toUpperCase() === Role.MANAGER ||
    user?.role.toUpperCase() === Role.SUPERUSER;

  const handleAddGuest = () => {
    if (newGuestUtorid.trim()) {
      onAddGuest(newGuestUtorid.trim());
      setNewGuestUtorid("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Event Guests</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Add New Guest
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              label="UTORid"
              value={newGuestUtorid}
              onChange={(e) => setNewGuestUtorid(e.target.value)}
              size="small"
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleAddGuest}
              disabled={!newGuestUtorid.trim() || isLoading}
            >
              Add
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Current Guests ({event.guests?.length || 0})
        </Typography>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : event.guests?.length === 0 ? (
          <Typography color="text.secondary">No guests yet</Typography>
        ) : (
          <List>
            {event.guests?.map((guest) => (
              <ListItem key={guest.id}>
                <ListItemText primary={guest.user?.username} />
                {isManager && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        onRemoveGuest(guest.userId);
                        onClose();
                      }}
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
