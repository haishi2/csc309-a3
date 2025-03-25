import { useState, useEffect } from "react";
import { usePromotions } from "@/hooks/usePromotions";
import { Promotion as PromotionComponent } from "@/components/promotions/Promotion";
import { PromotionDetails } from "@/components/promotions/PromotionDetails";
import {
  PromotionForm,
  PromotionFormData,
} from "@/components/promotions/PromotionForm";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogContent,
  styled,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import { Promotion } from "@/types/promotion.types";
import { PromotionType, Role } from "@/types/shared.types";
import { useUser } from "@/hooks/useUser";

const StyledBox = styled(Box)(({ theme }) => ({
  maxWidth: 1200,
  margin: "0 auto",
  padding: theme.spacing(3),
}));

const ITEMS_PER_PAGE = 9;

type CreatePromotionData = Omit<
  Promotion,
  "id" | "createdAt" | "managerId" | "severity"
>;
type UpdatePromotionData = Partial<CreatePromotionData> & { id: number };

const transformFormData = (
  data: PromotionFormData
): Omit<Promotion, "id" | "createdAt" | "managerId" | "severity"> => {
  return {
    ...data,
    minSpending: data.minSpending ? Number(data.minSpending) : undefined,
    rate: data.rate ? Number(data.rate) : undefined,
    points: data.points ? Number(data.points) : undefined,
    type: data.type.toLowerCase() as PromotionType,
  };
};

export default function Promotions() {
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPromotion, setViewingPromotion] = useState<Promotion | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedNameFilter, setDebouncedNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (nameFilter) {
      const timer = setTimeout(() => {
        setDebouncedNameFilter(nameFilter);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [nameFilter]);

  const { user } = useUser();
  const isManager =
    user?.role.toUpperCase() === Role.MANAGER ||
    user?.role.toUpperCase() === Role.SUPERUSER;

  const {
    promotions,
    isLoading,
    isError,
    refetch,
    updatePromotion,
    createPromotion,
    deletePromotion,
  } = usePromotions({
    page,
    limit: ITEMS_PER_PAGE,
    name: debouncedNameFilter || undefined,
    type: typeFilter || undefined,
  });

  const handlePromotionClick = (promotion: Promotion) => {
    if (isManager) {
      setSelectedPromotionId(promotion.id);
    } else {
      setViewingPromotion(promotion);
    }
  };

  const handleCloseModal = () => {
    setSelectedPromotionId(null);
    setIsCreateModalOpen(false);
    setViewingPromotion(null);
  };

  const handleUpdate = async (data: PromotionFormData) => {
    if (selectedPromotionId) {
      const updateData: UpdatePromotionData = {
        ...transformFormData(data),
        id: selectedPromotionId,
      };
      await updatePromotion(updateData as Promotion);
      handleCloseModal();
    }
  };

  const handleCreate = async (data: PromotionFormData) => {
    const createData = transformFormData(data);
    await createPromotion(createData as Promotion);
    handleCloseModal();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      await deletePromotion(id);
      if (promotions?.results.length === 1 && page > 1) {
        setPage(page - 1);
      }
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = () => {
    setNameFilter(searchTerm);
    setPage(1);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Failed to load promotions
        </Typography>
        <Button variant="contained" onClick={() => refetch()}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <StyledBox>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4">Promotions</Typography>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Promotion
          </Button>
        )}
      </Box>

      {isManager && (
        <Box display="flex" gap={2} mb={4}>
          <Box display="flex" gap={1}>
            <TextField
              label="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{ minWidth: 100 }}
            >
              Search
            </Button>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="automatic">Automatic</MenuItem>
              <MenuItem value="one-time">One-time</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {promotions?.results?.length === 0 ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Typography variant="h6" color="text.secondary">
            No promotions found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {promotions?.results?.map((promotion: Promotion) => (
            <Grid item xs={12} sm={6} md={4} key={promotion.id}>
              <PromotionComponent
                promotion={promotion}
                onDelete={isManager ? handleDelete : undefined}
                onClick={() => handlePromotionClick(promotion)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {promotions && promotions.count && promotions.count > ITEMS_PER_PAGE && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={Math.ceil(promotions.count / ITEMS_PER_PAGE)}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      <Dialog
        open={!!selectedPromotionId}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <PromotionForm
            id={selectedPromotionId || undefined}
            onSubmit={handleUpdate}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <PromotionForm onSubmit={handleCreate} onCancel={handleCloseModal} />
        </DialogContent>
      </Dialog>

      {viewingPromotion && (
        <PromotionDetails
          promotion={viewingPromotion}
          open={!!viewingPromotion}
          onClose={handleCloseModal}
        />
      )}
    </StyledBox>
  );
}
