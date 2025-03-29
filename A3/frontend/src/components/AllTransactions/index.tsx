import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Pagination,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllTransactions } from "@/hooks/useAllTransactions";
import { TransactionType } from "@/types/shared.types";

const ITEMS_PER_PAGE = 10;

export default function AllTransactions() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    name: "",
    createdBy: "",
    type: "",
    suspicious: undefined as boolean | undefined,
    amount: "",
    operator: "gte" as "gte" | "lte",
  });

  const { data, isLoading, isError } = useAllTransactions({
    ...filters,
    amount: filters.amount ? parseInt(filters.amount) : undefined,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filters change
    }));
  };

  if (isLoading) return <CircularProgress />;
  if (isError)
    return <Alert severity="error">Failed to load transactions</Alert>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        All Transactions
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Search by Name/UTORid"
            value={filters.name}
            onChange={(e) => handleFilterChange("name", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Created By"
            value={filters.createdBy}
            onChange={(e) => handleFilterChange("createdBy", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Transaction Type</InputLabel>
            <Select
              value={filters.type}
              label="Transaction Type"
              onChange={(e) => handleFilterChange("type", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(TransactionType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Suspicious Status</InputLabel>
            <Select
              value={filters.suspicious === undefined ? "" : filters.suspicious}
              label="Suspicious Status"
              onChange={(e) =>
                handleFilterChange(
                  "suspicious",
                  e.target.value === "" ? undefined : e.target.value === "true"
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

      {/* Transactions List */}
      <Stack spacing={2}>
        {data?.results.map((transaction) => (
          <Card
            key={transaction.id}
            onClick={() => navigate(`/transactions/${transaction.id}`)}
            sx={{ cursor: "pointer" }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">
                  Transaction #{transaction.id} - {transaction.utorid}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={transaction.type}
                    color={transaction.suspicious ? "error" : "primary"}
                    variant={transaction.suspicious ? "filled" : "outlined"}
                  />
                  {transaction.suspicious && (
                    <Chip label="Suspicious" color="error" />
                  )}
                </Stack>
              </Box>

              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Amount: {transaction.amount > 0 ? "+" : ""}
                {transaction.amount} points
                {transaction.spent &&
                  ` (Spent: $${transaction.spent.toFixed(2)})`}
              </Typography>

              <Typography variant="caption" display="block">
                Created by: {transaction.createdBy}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Pagination */}
      {data && data.count > ITEMS_PER_PAGE && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <Pagination
            count={Math.ceil(data.count / ITEMS_PER_PAGE)}
            page={filters.page}
            onChange={(_, page) => handleFilterChange("page", page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
