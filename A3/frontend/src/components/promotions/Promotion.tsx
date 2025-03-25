import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  CardActions,
} from "@mui/material";
import { Promotion as PromotionType } from "@/types/promotion.types";
import { format } from "date-fns";
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
    case "AUTOMATIC":
      return "Automatic";
    case "ONE_TIME":
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
  console.log(isManager);
  return (
    <Card
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".delete-button")) {
          e.stopPropagation();
          return;
        }
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
        {promotion.description && (
          <Typography color="text.secondary" gutterBottom>
            {promotion.description}
          </Typography>
        )}
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
      </CardContent>
      {isManager && onDelete && (
        <CardActions
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            padding: 0,
          }}
        >
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
    </Card>
  );
}
