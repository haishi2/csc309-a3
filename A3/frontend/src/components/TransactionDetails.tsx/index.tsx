import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useTransaction,
  useToggleSuspicious,
} from "@/hooks/useAllTransactions";
import { createRedemption } from "@/services/api/user-api";
import { toast } from "sonner";

export default function TransactionDetails() {
  const { id } = useParams<{ id: string }>();
  const transactionId = parseInt(id || "0");

  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [remark, setRemark] = useState("");

  const {
    data: transaction,
    isLoading,
    isError,
  } = useTransaction(transactionId);
  const toggleSuspiciousMutation = useToggleSuspicious();

  const handleToggleSuspicious = async () => {
    try {
      await toggleSuspiciousMutation.mutateAsync({
        id: transactionId,
        suspicious: !transaction?.suspicious,
      });
      toast.success(
        `Transaction marked as ${
          !transaction?.suspicious ? "suspicious" : "not suspicious"
        }`
      );
    } catch (error) {
      toast.error("Failed to update suspicious status");
    }
  };

  const handleCreateRedemption = async () => {
    try {
      const amount = parseInt(redemptionAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      await createRedemption(amount, remark);
      setIsRedeeming(false);
      setRedemptionAmount("");
      setRemark("");
      toast.success("Redemption request created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create redemption"
      );
    }
  };

  if (isLoading) return <CircularProgress />;
  if (isError)
    return <Alert severity="error">Failed to load transaction</Alert>;
  if (!transaction)
    return <Alert severity="error">Transaction not found</Alert>;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h5">
                Transaction #{transaction.id}
              </Typography>
              <Chip
                label={transaction.type}
                color={transaction.suspicious ? "error" : "primary"}
                variant={transaction.suspicious ? "filled" : "outlined"}
              />
            </Box>

            <Typography>UTORid: {transaction.utorid}</Typography>
            <Typography>
              Amount: {transaction.amount > 0 ? "+" : ""}
              {transaction.amount} points
              {transaction.spent &&
                ` (Spent: $${transaction.spent.toFixed(2)})`}
            </Typography>
            <Typography>Created by: {transaction.createdBy}</Typography>
            {transaction.remark && (
              <Typography>Remark: {transaction.remark}</Typography>
            )}

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color={transaction.suspicious ? "primary" : "error"}
                onClick={handleToggleSuspicious}
              >
                Mark as{" "}
                {transaction.suspicious ? "Not Suspicious" : "Suspicious"}
              </Button>
              <Button variant="contained" onClick={() => setIsRedeeming(true)}>
                Create Redemption
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Redemption Dialog */}
      <Dialog open={isRedeeming} onClose={() => setIsRedeeming(false)}>
        <DialogTitle>Create Redemption</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Amount"
              type="number"
              value={redemptionAmount}
              onChange={(e) => setRedemptionAmount(e.target.value)}
              fullWidth
            />
            <TextField
              label="Remark (optional)"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRedeeming(false)}>Cancel</Button>
          <Button onClick={handleCreateRedemption} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
