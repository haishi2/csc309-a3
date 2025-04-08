import { useState } from "react";
import { usePromotions } from "@/hooks/usePromotions";
import { Promotion as PromotionComponent } from "@/components/promotions/Promotion";
import { PromotionDetails } from "@/components/promotions/PromotionDetails";
import {
  PromotionForm,
  PromotionFormData,
  PromotionFormUpdate,
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

//format the data from the form to the correct type for the backend
const transformFormData = (
  data: PromotionFormData | PromotionFormUpdate
): Partial<CreatePromotionData> => {
  const transformed: Partial<CreatePromotionData> = {};

  if ("name" in data && data.name) transformed.name = data.name;
  if ("description" in data && data.description)
    transformed.description = data.description;
  if ("type" in data && data.type)
    transformed.type = data.type.toLowerCase() as PromotionType;
  if ("startTime" in data && data.startTime)
    transformed.startTime = data.startTime;
  if ("endTime" in data && data.endTime) transformed.endTime = data.endTime;
  if ("minSpending" in data)
    transformed.minSpending = data.minSpending
      ? Number(data.minSpending)
      : undefined;
  if ("rate" in data)
    transformed.rate = data.rate ? Number(data.rate) : undefined;
  if ("points" in data)
    transformed.points = data.points ? Number(data.points) : undefined;

  return transformed;
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
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [startedFilter, setStartedFilter] = useState<string>("");
  const [endedFilter, setEndedFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeTerm, setTypeTerm] = useState<string>("");
  const [startedTerm, setStartedTerm] = useState<string>("");
  const [endedTerm, setEndedTerm] = useState<string>("");

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
    name: nameFilter || undefined,
    type: typeFilter || undefined,
    started: startedFilter || undefined,
    ended: endedFilter || undefined,
  });

  //handles user clicking on a promotion
  const handlePromotionClick = (promotion: Promotion) => {
    if (isManager) {
      setSelectedPromotionId(promotion.id);
    } else {
      setViewingPromotion(promotion);
    }
  };

  //reset state of the modal form and view on close
  const handleCloseModal = () => {
    setSelectedPromotionId(null);
    setIsCreateModalOpen(false);
    setViewingPromotion(null);
  };

  const handleSubmit = async (
    data: PromotionFormData | PromotionFormUpdate
  ) => {
    try {
      if (selectedPromotionId) {
        if (Object.keys(data).length <= 0) {
          setIsCreateModalOpen(false);
          setSelectedPromotionId(null);
          return;
        }
        const updateData: UpdatePromotionData = {
          ...transformFormData(data),
          id: selectedPromotionId,
        };
        await updatePromotion(updateData);
      } else {
        const createData = transformFormData(data) as CreatePromotionData;
        await createPromotion(createData as Promotion);
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error("Failed to save promotion:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      await deletePromotion(id);
      //if there is only one promotion left on the page before deletion and we are not on the first page, go to the previous page
      if (promotions?.results.length === 1 && page > 1) {
        setPage(page - 1);
      }
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearch = () => {
    setNameFilter(searchTerm);
    setTypeFilter(typeTerm);
    setStartedFilter(startedTerm);
    setEndedFilter(endedTerm);
    setPage(1);
  };

  //display loading spinner if data is still loading
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

  //display error message if data fails to load
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

      <Box display="flex" gap={2} mb={4}>
        <TextField
          label="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeTerm}
            label="Type"
            onChange={(e) => {
              setTypeTerm(e.target.value);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="automatic">Automatic</MenuItem>
            <MenuItem value="one-time">One-time</MenuItem>
          </Select>
        </FormControl>
        {isManager && (
          <>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Started</InputLabel>
              <Select
                value={startedTerm}
                label="Started"
                onChange={(e) => setStartedTerm(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="started">Started</MenuItem>
                <MenuItem value="notStarted">Not Started</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Ended</InputLabel>
              <Select
                value={endedTerm}
                label="Ended"
                onChange={(e) => setEndedTerm(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ended">Ended</MenuItem>
                <MenuItem value="notEnded">Not Ended</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
          sx={{ minWidth: 100 }}
        >
          Apply Filters
        </Button>
      </Box>

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

      {/* pagination controls */}
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

      {/* modal for updating promotions */}
      <Dialog
        open={!!selectedPromotionId}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <PromotionForm
            id={selectedPromotionId || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>

      {/* modal for creating promotions */}
      <Dialog
        open={isCreateModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <PromotionForm onSubmit={handleSubmit} onCancel={handleCloseModal} />
        </DialogContent>
      </Dialog>

      {/* modal for viewing promotion details */}
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
