import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { Promotion as PromotionComponent } from "./Promotion";
import { Promotion } from "@/types/promotion.types";

interface PromotionDetailsProps {
  promotion: Promotion;
  open: boolean;
  onClose: () => void;
}

export function PromotionDetails({
  promotion,
  open,
  onClose,
}: PromotionDetailsProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Promotion Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <PromotionComponent promotion={promotion} />
      </DialogContent>
    </Dialog>
  );
}
