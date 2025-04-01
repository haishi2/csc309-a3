import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  CardActions,
  Chip,
} from "@mui/material";
import { Promotion as PromotionType } from "@/types/promotion.types";
import { format, isFuture, isPast, isWithinInterval } from "date-fns";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useUser } from "@/hooks/useUser";
import { Role } from "@/types/shared.types";

interface PromotionProps {
  promotion: PromotionType;
  onDelete?: (id: number) => void;
  onClick?: () => void;
}

const formatPromotionType = (type: string) => {
  switch (type) {
    case "automatic":
      return "Automatic";
    case "one_time":
      return "One-time";
    default:
      return type;
  }
};

export function Promotion({ promotion, onDelete, onClick }: PromotionProps) {
  const { user } = useUser();
  const isManager =
    user?.role.toUpperCase() === Role.MANAGER ||
    user?.role.toUpperCase() === Role.SUPERUSER;

  const getPromotionStatus = () => {
    const now = new Date();
    const startTime = new Date(promotion.startTime);
    const endTime = new Date(promotion.endTime);

    if (isFuture(startTime)) {
      return { label: "Not Started", color: "info" };
    } else if (isPast(endTime)) {
      return { label: "Ended", color: "error" };
    } else if (isWithinInterval(now, { start: startTime, end: endTime })) {
      return { label: "Active", color: "success" };
    }
    return { label: "Unknown", color: "default" };
  };

  let status;
  if (isManager) {
    status = getPromotionStatus();
  } else {
    status = { label: "Active", color: "success" };
  }

  return (
    <Card
      //if user's click in on the delete button, do not trigger any other events
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".delete-button")) {
          e.stopPropagation();
          return;
        }
        //if user's click is not on the delete button, trigger provided onClick event
        onClick?.();
      }}
      sx={{
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        transition: "transform 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
        },
      }}
    >
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {promotion.name}
        </Typography>
        {/* box displaying the promotion details */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Type: {formatPromotionType(promotion.type)}
          </Typography>
          {isManager && (
            <Typography variant="body2">
              Start: {format(new Date(promotion.startTime), "PPp")}
            </Typography>
          )}
          <Typography variant="body2">
            End: {format(new Date(promotion.endTime), "PPp")}
          </Typography>
          {promotion.minSpending && (
            <Typography variant="body2">
              Minimum Spend: ${promotion.minSpending.toFixed(2)}
            </Typography>
          )}
          {promotion.rate && (
            <Typography variant="body2">
              Rate: {(promotion.rate * 100).toFixed(0)}%
            </Typography>
          )}
          {promotion.points && (
            <Typography variant="body2">Points: {promotion.points}</Typography>
          )}
        </Box>
        {isManager && onDelete && (
          <CardActions sx={{ position: "absolute", bottom: 4, right: 4 }}>
            <IconButton
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(promotion.id);
              }}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </CardActions>
        )}
      </CardContent>
      <Chip
        sx={{ position: "absolute", top: 16, right: 12 }}
        label={status.label}
        color={status.color as "info" | "error" | "success" | "default"}
        size="small"
      />
      {/* if user is a manager and onDelete is provided, display the delete button */}
    </Card>
  );
}
