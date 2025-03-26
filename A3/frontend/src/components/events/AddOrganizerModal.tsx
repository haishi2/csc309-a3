import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useState } from "react";
import { Event } from "@/types/event.types";

interface AddOrganizerModalProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onAddOrganizer: (utorid: string) => Promise<void>;
  onRemoveOrganizer: (userId: number) => Promise<void>;
  isLoading: boolean;
}

export function AddOrganizerModal({
  event,
  open,
  onClose,
  onAddOrganizer,
  onRemoveOrganizer,
  isLoading,
}: AddOrganizerModalProps) {
  const [utorid, setUtorid] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utorid.trim()) return;
    await onAddOrganizer(utorid.trim());
    setUtorid("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Organizers</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <Box display="flex" gap={1}>
            <TextField
              autoFocus
              margin="dense"
              label="Add Organizer by UTORid"
              fullWidth
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={!utorid.trim() || isLoading}
              sx={{ mt: 1 }}
            >
              Add
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Current Organizers
        </Typography>
        <List>
          {event.organizers?.map((organizer) => (
            <ListItem key={organizer.userId}>
              <ListItemText
                primary={organizer.user?.username || "Unknown User"}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => {
                    onRemoveOrganizer(organizer.userId);
                    onClose();
                  }}
                  disabled={isLoading}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
