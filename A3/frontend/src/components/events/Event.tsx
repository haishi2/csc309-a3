import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  CardActions,
  Chip,
  Button,
} from "@mui/material";
import { Event as EventType } from "@/types/event.types";
import { format, isFuture, isPast, isWithinInterval } from "date-fns";
import {
  Delete as DeleteIcon,
  Group as GroupIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { useUser } from "@/hooks/useUser";
import { Role } from "@/types/shared.types";
import { PlusIcon } from "lucide-react";

interface EventProps {
  event: EventType;
  onDelete?: (id: number) => void;
  onClick?: () => void;
  onManageGuests?: () => void;
  onManageOrganizers?: () => void;
  onRewardPoints?: () => void;
}

export function Event({
  event,
  onDelete,
  onClick,
  onManageGuests,
  onManageOrganizers,
  onRewardPoints,
}: EventProps) {
  const { user } = useUser();
  const isManager =
    user?.role.toUpperCase() === Role.MANAGER ||
    user?.role.toUpperCase() === Role.SUPERUSER;
  const isOrganizer = event.organizers?.some((o) => o.userId === user?.id);

  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (isFuture(startTime)) {
      return { label: "Not Started", color: "info" };
    } else if (isPast(endTime)) {
      return { label: "Ended", color: "error" };
    } else if (isWithinInterval(now, { start: startTime, end: endTime })) {
      return { label: "Active", color: "success" };
    }
    return { label: "Unknown", color: "default" };
  };

  const status = getEventStatus();

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1}
        >
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            {event.name}
          </Typography>
          <Chip
            label={status.label}
            color={status.color as "info" | "error" | "success" | "default"}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {event.description}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Location: {event.location}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Start: {format(new Date(event.startTime), "PPp")}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          End: {format(new Date(event.endTime), "PPp")}
        </Typography>

        {event.capacity && (
          <Typography variant="body2" color="text.secondary">
            Capacity: {event.numGuests} / {event.capacity}
          </Typography>
        )}
        {isManager ||
          (isOrganizer && (
            <Typography variant="body2" color="text.secondary">
              Points: {event.pointsRemain} / {event.points}
            </Typography>
          ))}

        {isManager && (
          <Chip
            label={event.isPublished ? "Published" : "Draft"}
            color={event.isPublished ? "success" : "default"}
            size="small"
          />
        )}
      </CardContent>

      <CardActions sx={{ mt: "auto", justifyContent: "flex-end" }}>
        {(isManager || isOrganizer) && onRewardPoints && (
          <Button
            size="small"
            startIcon={<StarIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onRewardPoints();
            }}
          ></Button>
        )}
        {(isManager || isOrganizer) && onManageGuests && (
          <Button
            size="small"
            startIcon={<GroupIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onManageGuests();
            }}
          ></Button>
        )}
        {onManageOrganizers && (
          <Button
            size="small"
            startIcon={<PlusIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onManageOrganizers();
            }}
          >
            {" "}
          </Button>
        )}
        {isManager && onDelete && (
          <IconButton
            className="action-button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id);
            }}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
}
