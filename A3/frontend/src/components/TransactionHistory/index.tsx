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
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
} from "@mui/material";
import { useState } from "react";
import { useTransactions, useCreateRedemption } from "@/hooks/useTransactions";
import { toast } from "sonner";
import type { Transaction } from "@/types/transaction.types";
import { useUser } from "@/hooks/useUser";
import { Role } from "@/types/shared.types";
import {
  useAllTransactions,
  useTransaction,
  useToggleSuspicious,
} from "@/hooks/useAllTransactions";

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
  const { user } = useUser();
  const isManager =
    user?.role.toUpperCase() === Role.MANAGER || user?.role.toUpperCase() === Role.SUPERUSER;

  const [activeTab, setActiveTab] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(
    null
  );

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [amountFilter, setAmountFilter] = useState<string>("");
  const [operator, setOperator] = useState<"gte" | "lte">("gte");
  const [isCreatingRedemption, setIsCreatingRedemption] = useState(false);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionRemark, setRedemptionRemark] = useState("");

  // Manager-only filters
  const [nameFilter, setNameFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [suspiciousFilter, setSuspiciousFilter] = useState<boolean | undefined>(
    undefined
  );

  // Use different hooks based on user role
  const {
    data: managerData,
    isLoading: managerLoading,
    isError: managerError,
  } = useAllTransactions(
    isManager
      ? {
          page,
          limit: ITEMS_PER_PAGE,
          name: nameFilter || undefined,
          createdBy: createdByFilter || undefined,
          suspicious: suspiciousFilter,
          type: typeFilter || undefined,
          amount: amountFilter ? parseInt(amountFilter) : undefined,
          operator: amountFilter ? operator : undefined,
        }
      : undefined
  );

  const {
    data: userTransactions,
    isLoading: userLoading,
    isError: userError,
  } = useTransactions(
    !isManager
      ? {
          page,
          limit: ITEMS_PER_PAGE,
          type: typeFilter || undefined,
          amount: amountFilter ? parseInt(amountFilter) : undefined,
          operator: amountFilter ? operator : undefined,
        }
      : undefined
  );

  const { data: selectedTransactionData, isLoading: transactionLoading } =
    useTransaction(selectedTransaction || 0);

  const toggleSuspiciousMutation = useToggleSuspicious();

  // Use appropriate data based on role
  const data = isManager ? managerData : userTransactions;
  const isLoading = isManager ? managerLoading : userLoading;
  const isError = isManager ? managerError : userError;

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

  const handleToggleSuspicious = async (id: number, currentStatus: boolean) => {
    try {
      await toggleSuspiciousMutation.mutateAsync({
        id,
        suspicious: !currentStatus,
      });
      toast.success(
        `Transaction marked as ${
          !currentStatus ? "suspicious" : "not suspicious"
        }`
      );
    } catch (error) {
      toast.error("Failed to update suspicious status");
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
      {isManager && (
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ mb: 3 }}
        >
          <Tab label="My Transactions" />
          <Tab label="All Transactions" />
        </Tabs>
      )}

      {/* Manager-only filters */}
      {isManager && activeTab === 1 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search by Name/UTORid"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Created By"
              value={createdByFilter}
              onChange={(e) => setCreatedByFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Suspicious Status</InputLabel>
              <Select
                value={
                  suspiciousFilter === undefined
                    ? ""
                    : suspiciousFilter.toString()
                }
                label="Suspicious Status"
                onChange={(e) =>
                  setSuspiciousFilter(
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true"
                  )
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Suspicious</MenuItem>
                <MenuItem value="false">Not Suspicious</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}

      {/* Regular filters */}
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
              cursor: isManager ? "pointer" : "default",
            }}
            onClick={
              isManager
                ? () => setSelectedTransaction(transaction.id)
                : undefined
            }
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">
                  Transaction #{transaction.id}
                  {isManager && ` - ${transaction.utorid}`}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={transaction.type}
                    color={typeColors[transaction.type] || "default"}
                    variant="filled"
                  />
                  {isManager && (
                    <Chip
                      label={transaction.suspicious ? "Suspicious" : "Verified"}
                      color={transaction.suspicious ? "error" : "success"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSuspicious(
                          transaction.id,
                          transaction.suspicious || false
                        );
                      }}
                    />
                  )}
                </Stack>
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

      {/* Transaction Detail Dialog */}
      {(isManager) && (
        <Dialog
          open={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          maxWidth="md"
          fullWidth
        >
          {transactionLoading ? (
            <DialogContent>
              <CircularProgress />
            </DialogContent>
          ) : selectedTransactionData ? (
            <>
              <DialogTitle>
                Transaction #{selectedTransactionData.id} -{" "}
                {selectedTransactionData.utorid}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2}>
                  <Typography>Type: {selectedTransactionData.type}</Typography>
                  <Typography>
                    Amount: {selectedTransactionData.amount} points
                    {selectedTransactionData.spent !== undefined &&
                      ` (Spent: $${selectedTransactionData.spent.toFixed(2)})`}
                  </Typography>
                  {selectedTransactionData.relatedId && (
                    <Typography>
                      Related Transaction: #{selectedTransactionData.relatedId}
                    </Typography>
                  )}
                  <Typography>
                    Created by: {selectedTransactionData.createdBy}
                  </Typography>
                  {selectedTransactionData.remark && (
                    <Typography>
                      Remark: {selectedTransactionData.remark}
                    </Typography>
                  )}
                  <Box>
                    <Button
                      variant="contained"
                      color={
                        selectedTransactionData.suspicious ? "primary" : "error"
                      }
                      onClick={() =>
                        handleToggleSuspicious(
                          selectedTransactionData.id,
                          selectedTransactionData.suspicious || false
                        )
                      }
                    >
                      Mark as{" "}
                      {selectedTransactionData.suspicious
                        ? "Not Suspicious"
                        : "Suspicious"}
                    </Button>
                  </Box>
                </Stack>
              </DialogContent>
            </>
          ) : (
            <DialogContent>
              <Alert severity="error">Transaction not found</Alert>
            </DialogContent>
          )}
        </Dialog>
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
