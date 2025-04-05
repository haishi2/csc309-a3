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
} from "@mui/material";
import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionType } from "@/types/shared.types";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

const typeColors = {
  [TransactionType.PURCHASE]: "success",
  [TransactionType.REDEMPTION]: "warning",
  [TransactionType.TRANSFER]: "info",
  [TransactionType.ADJUSTMENT]: "error",
  [TransactionType.EVENT]: "primary",
} as const;

export default function TransactionHistory() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [amountFilter, setAmountFilter] = useState<string>("");
  const [operator, setOperator] = useState<"gte" | "lte">("gte");

  const { data, isLoading, isError } = useTransactions({
    page,
    limit: ITEMS_PER_PAGE,
    type: typeFilter || undefined,
    amount: amountFilter ? parseInt(amountFilter) : undefined,
    operator: amountFilter ? operator : undefined,
  });

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (isError) {
    return <Alert severity="error">Failed to load transactions</Alert>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Transaction History
      </Typography>

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
              {Object.values(TransactionType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
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
        {data?.results.map((transaction) => (
          <Card key={transaction.id}>
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
                  label={transaction.type.toLowerCase()}
                  color={typeColors[transaction.type]}
                  variant="filled"
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography color="text.secondary">
                  {transaction.type === TransactionType.PURCHASE ? (
                    <>Spent: ${transaction.spent?.toFixed(2)}</>
                  ) : transaction.type === TransactionType.TRANSFER ? (
                    <>
                      Transfer {transaction.points > 0 ? "from" : "to"}:{" "}
                      {transaction.user?.username}
                    </>
                  ) : (
                    <>
                      Points: {transaction.points > 0 ? "+" : ""}
                      {transaction.points}
                    </>
                  )}
                </Typography>

                {transaction.remark && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Remark: {transaction.remark}
                  </Typography>
                )}

                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  utorid: {transaction.utorid}
                </Typography>

                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Created:{" "}
                  {transaction.createdAt
                    ? format(new Date(transaction.createdAt), "PPp")
                    : "N/A"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Pagination */}
      {data && data.count > ITEMS_PER_PAGE && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <Pagination
            count={Math.ceil(data.count / ITEMS_PER_PAGE)}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
