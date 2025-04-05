import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  Button,
  Dialog,
} from "@mui/material";
import { useState } from "react";
import { useTransactions, useCreateRedemption } from "@/hooks/useTransactions";
import { toast } from "sonner";
import type { Transaction } from "@/types/transaction.types";

const ITEMS_PER_PAGE = 10;

const typeColors: Record<
  string,
  "success" | "warning" | "info" | "error" | "primary"
> = {
  purchase: "success",
  redemption: "warning",
  transfer: "info",
  adjustment: "error",
  event: "primary",
};

const transactionTypes = [
  "purchase",
  "redemption",
  "transfer",
  "adjustment",
  "event",
];

export default function TransactionHistory() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [amountFilter, setAmountFilter] = useState<string>("");
  const [operator, setOperator] = useState<"gte" | "lte">("gte");
  const [isCreatingRedemption, setIsCreatingRedemption] = useState(false);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionRemark, setRedemptionRemark] = useState("");

  const { data, isLoading, isError } = useTransactions({
    page,
    limit: ITEMS_PER_PAGE,
    type: typeFilter || undefined,
    amount: amountFilter ? parseInt(amountFilter) : undefined,
    operator: amountFilter ? operator : undefined,
  });

  const createRedemption = useCreateRedemption();

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleCreateRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseInt(redemptionAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      await createRedemption.mutateAsync({
        amount,
        remark: redemptionRemark || undefined,
      });

      setIsCreatingRedemption(false);
      setRedemptionAmount("");
      setRedemptionRemark("");
      toast.success("Redemption request created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create redemption"
      );
    }
  };

  const renderTransactionDetails = (transaction: Transaction) => {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="text.secondary">
          Amount: {transaction.amount > 0 ? "+" : ""}
          {transaction.amount} points
          {transaction.spent !== undefined &&
            ` (Spent: $${transaction.spent.toFixed(2)})`}
        </Typography>

        {transaction.relatedId !== undefined && (
          <Typography color="text.secondary">
            Related Transaction: #{transaction.relatedId}
          </Typography>
        )}

        {transaction.promotionIds && transaction.promotionIds.length > 0 && (
          <Typography color="text.secondary">
            Promotions Applied: {transaction.promotionIds.join(", ")}
          </Typography>
        )}

        {transaction.remark && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Remark: {transaction.remark}
          </Typography>
        )}

        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Created by: {transaction.createdBy}
        </Typography>
      </Box>
    );
  };

  if (isLoading) return <CircularProgress />;
  if (isError)
    return <Alert severity="error">Failed to load transactions</Alert>;
  if (!data) return <Alert severity="info">No transactions found</Alert>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4">Transaction History</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsCreatingRedemption(true)}
        >
          Create Redemption
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Transaction Type</InputLabel>
            <Select
              value={typeFilter}
              label="Transaction Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {transactionTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Amount Filter</InputLabel>
            <Select
              value={operator}
              label="Amount Filter"
              onChange={(e) => setOperator(e.target.value as "gte" | "lte")}
            >
              <MenuItem value="gte">Greater than or equal</MenuItem>
              <MenuItem value="lte">Less than or equal</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Points Amount"
            type="number"
            value={amountFilter}
            onChange={(e) => setAmountFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">pts</InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Transaction Cards */}
      <Stack spacing={2}>
        {data.results.map((transaction) => (
          <Card
            key={transaction.id}
            sx={{
              borderLeft: 6,
              borderColor: `${typeColors[transaction.type]}.main`,
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">
                  Transaction #{transaction.id}
                </Typography>
                <Chip
                  label={transaction.type}
                  color={typeColors[transaction.type] || "default"}
                  variant="filled"
                />
              </Box>
              {renderTransactionDetails(transaction)}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Pagination */}
      {data.count > ITEMS_PER_PAGE && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <Pagination
            count={Math.ceil(data.count / ITEMS_PER_PAGE)}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Create Redemption Dialog */}
      <Dialog
        open={isCreatingRedemption}
        onClose={() => setIsCreatingRedemption(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create Redemption Request
          </Typography>

          <form onSubmit={handleCreateRedemption}>
            <Stack spacing={2}>
              <TextField
                label="Amount"
                type="number"
                value={redemptionAmount}
                onChange={(e) => setRedemptionAmount(e.target.value)}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">pts</InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Remark (optional)"
                value={redemptionRemark}
                onChange={(e) => setRedemptionRemark(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />

              <Box display="flex" justifyContent="flex-end" gap={1}>
                <Button onClick={() => setIsCreatingRedemption(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={createRedemption.isPending}
                >
                  {createRedemption.isPending ? "Creating..." : "Create"}
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Dialog>
    </Box>
  );
}
