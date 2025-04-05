import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { Event as EventComponent } from "@/components/events/Event";
import {
  EventForm,
  EventFormData,
  EventFormUpdate,
} from "@/components/events/EventForm";
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
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import { Event } from "@/types/event.types";
import { Role } from "@/types/shared.types";
import { useUser } from "@/hooks/useUser";
import { EventGuestsModal } from "@/components/events/EventGuestsModal";
import { AddOrganizerModal } from "@/components/events/AddOrganizerModal";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { RewardPointsModal } from "@/components/events/RewardPointsModal";

const StyledBox = styled(Box)(({ theme }) => ({
  maxWidth: 1200,
  margin: "0 auto",
  padding: theme.spacing(3),
}));

const ITEMS_PER_PAGE = 9;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`events-tabpanel-${index}`}
      aria-labelledby={`events-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Events() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState("");
  const [startedFilter, setStartedFilter] = useState<string>("");
  const [endedFilter, setEndedFilter] = useState<string>("");
  const [showFullFilter, setShowFullFilter] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [publishedInput, setPublishedInput] = useState<string>("");
  const [locationInput, setLocationInput] = useState("");
  const [startedInput, setStartedInput] = useState<string>("");
  const [endedInput, setEndedInput] = useState<string>("");
  const [showFullInput, setShowFullInput] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedEventForGuests, setSelectedEventForGuests] =
    useState<Event | null>(null);
  const [isManagingGuests, setIsManagingGuests] = useState(false);
  const [selectedEventForOrganizers, setSelectedEventForOrganizers] =
    useState<Event | null>(null);
  const [isManagingOrganizers, setIsManagingOrganizers] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] =
    useState<Event | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [selectedEventForReward, setSelectedEventForReward] =
    useState<Event | null>(null);
  const [isRewardingPoints, setIsRewardingPoints] = useState(false);

  const { user } = useUser();
  const isManager =
    user?.role.toUpperCase() === Role.MANAGER ||
    user?.role.toUpperCase() === Role.SUPERUSER;

  const {
    events,
    isLoading,
    isError,
    refetch,
    updateEvent,
    createEvent,
    deleteEvent,
    removeGuest,
    addGuest,
    removeOrganizer,
    addOrganizer,
    registerForEvent,
    unregisterForEvent,
    rewardPoints,
  } = useEvents({
    page,
    limit: ITEMS_PER_PAGE,
    name: nameFilter || undefined,
    isPublished:
      publishedFilter === "published"
        ? true
        : publishedFilter === "draft"
        ? false
        : undefined,
    location: locationFilter || undefined,
    started:
      startedFilter === "started"
        ? true
        : startedFilter === "notStarted"
        ? false
        : undefined,
    ended:
      endedFilter === "ended"
        ? true
        : endedFilter === "notEnded"
        ? false
        : undefined,
    showFull: showFullFilter !== undefined ? showFullFilter : undefined,
  });

  const handleEventClick = (event: Event) => {
    if (!isManager && !event.organizers?.some((o) => o.userId === user?.id)) {
      setSelectedEventForDetails(event);
      setIsViewingDetails(true);
    } else {
      setSelectedEventId(event.id);
    }
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
    setIsCreateModalOpen(false);
  };

  const handleSubmit = async (data: EventFormData | EventFormUpdate) => {
    try {
      if (selectedEventId) {
        if (Object.keys(data).length <= 0) {
          setIsCreateModalOpen(false);
          setSelectedEventId(null);
          return;
        }
        await updateEvent({
          id: selectedEventId,
          ...data,
        });
      } else {
        await createEvent(data as EventFormData);
      }
      setIsCreateModalOpen(false);
      setSelectedEventId(null);
      refetch();
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      await deleteEvent(id);
      if (events?.results.length === 1 && page > 1) {
        setPage(page - 1);
      }
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApplyFilters();
    }
  };

  const handleClearFilters = () => {
    setNameFilter("");
    setPublishedFilter("");
    setLocationFilter("");
    setStartedFilter("");
    setEndedFilter("");
    setShowFullFilter(true);

    setSearchTerm("");
    setPublishedInput("");
    setLocationInput("");
    setStartedInput("");
    setEndedInput("");
    setShowFullInput(true);

    setPage(1);
    refetch();
  };

  const handleApplyFilters = () => {
    setNameFilter(searchTerm);
    setPublishedFilter(publishedInput);
    setLocationFilter(locationInput);
    setStartedFilter(startedInput);
    setEndedFilter(endedInput);
    setShowFullFilter(showFullInput);
    setPage(1);
    refetch();
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handleManageGuests = (event: Event) => {
    setSelectedEventForGuests(event);
    setIsManagingGuests(true);
  };

  const handleCloseGuestsModal = () => {
    setSelectedEventForGuests(null);
    setIsManagingGuests(false);
  };

  const handleRemoveGuest = async (userId: number) => {
    if (!selectedEventForGuests) return;
    try {
      await removeGuest(selectedEventForGuests.id, userId);
      refetch();
    } catch (error) {
      console.error("Failed to remove guest:", error);
    }
  };

  const handleAddGuest = async (utorid: string) => {
    if (!selectedEventForGuests) return;
    try {
      await addGuest(selectedEventForGuests.id, utorid);
      refetch();
    } catch (error) {
      console.error("Failed to add guest:", error);
    }
  };

  const handleManageOrganizers = (event: Event) => {
    setSelectedEventForOrganizers(event);
    setIsManagingOrganizers(true);
  };

  const handleCloseOrganizersModal = () => {
    setSelectedEventForOrganizers(null);
    setIsManagingOrganizers(false);
  };

  const handleRemoveOrganizer = async (userId: number) => {
    if (!selectedEventForOrganizers) return;
    try {
      await removeOrganizer(selectedEventForOrganizers.id, userId);
      refetch();
    } catch (error) {
      console.error("Failed to remove organizer:", error);
    }
  };

  const handleAddOrganizer = async (utorid: string) => {
    if (!selectedEventForOrganizers) return;
    try {
      await addOrganizer(selectedEventForOrganizers.id, utorid);
      refetch();
    } catch (error) {
      console.error("Failed to add organizer:", error);
    }
  };

  const handleCloseDetailsModal = () => {
    setSelectedEventForDetails(null);
    setIsViewingDetails(false);
  };

  const handleRegisterForEvent = async () => {
    if (!selectedEventForDetails) return;
    try {
      await registerForEvent(selectedEventForDetails.id);
      refetch();
      handleCloseDetailsModal();
    } catch (error) {
      console.error("Failed to register for event:", error);
    }
  };

  const handleUnregisterForEvent = async () => {
    if (!selectedEventForDetails) return;
    try {
      await unregisterForEvent(selectedEventForDetails.id);
      refetch();
      handleCloseDetailsModal();
    } catch (error) {
      console.error("Failed to unregister for event:", error);
    }
  };

  const handleOpenRewardPoints = (event: Event) => {
    setSelectedEventForReward(event);
    setIsRewardingPoints(true);
  };

  const handleRewardPoints = async (points: number, utorid?: string) => {
    if (!selectedEventForReward) return;
    try {
      await rewardPoints(selectedEventForReward.id, points, utorid);
      refetch();
    } catch (error) {
      console.error("Failed to reward points:", error);
    }
  };

  const handleCloseRewardModal = () => {
    setSelectedEventForReward(null);
    setIsRewardingPoints(false);
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
          Failed to load events
        </Typography>
        <Button variant="contained" onClick={() => refetch()}>
          Try Again
        </Button>
      </Box>
    );
  }

  const renderEventsList = (
    events: Event[] | undefined,
    showDelete: boolean
  ) => (
    <>
      {events?.length === 0 ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Typography variant="h6" color="text.secondary">
            No events found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events?.map((event: Event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <EventComponent
                event={event}
                onDelete={showDelete ? handleDelete : undefined}
                onClick={() => handleEventClick(event)}
                onManageGuests={() => handleManageGuests(event)}
                onManageOrganizers={
                  isManager ? () => handleManageOrganizers(event) : undefined
                }
                onRewardPoints={
                  isManager ||
                  event.organizers?.some((o) => o.userId === user?.id)
                    ? () => handleOpenRewardPoints(event)
                    : undefined
                }
              />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );

  return (
    <StyledBox>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4">Events</Typography>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Event
          </Button>
        )}
      </Box>

      <Box display="flex" gap={1}>
        <TextField
          label="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
        />
        {isManager && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={publishedInput}
              label="Status"
              onChange={(e) => {
                setPublishedInput(e.target.value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
            </Select>
          </FormControl>
        )}

        <TextField
          label="Location"
          value={locationInput}
          onChange={(e) => {
            setLocationInput(e.target.value);
          }}
          size="small"
          sx={{ minWidth: 150 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Started</InputLabel>
          <Select
            value={startedInput}
            label="Started"
            onChange={(e) => {
              setStartedInput(e.target.value);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="started">Started</MenuItem>
            <MenuItem value="notStarted">Not Started</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Ended</InputLabel>
          <Select
            value={endedInput}
            label="Ended"
            onChange={(e) => {
              setEndedInput(e.target.value);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="ended">Ended</MenuItem>
            <MenuItem value="notEnded">Not Ended</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={showFullInput}
              onChange={(e) => {
                setShowFullInput(e.target.checked);
              }}
            />
          }
          label="Show Full Events"
        />
        <Button
          variant="contained"
          onClick={handleApplyFilters}
          startIcon={<SearchIcon />}
          sx={{ minWidth: 100 }}
        >
          Apply Filters
        </Button>

        <Button
          variant="outlined"
          onClick={handleClearFilters}
          size="small"
          sx={{ minWidth: 120 }}
        >
          Clear Filters
        </Button>
      </Box>

      {!isManager && (
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Events" />
            <Tab label="My Events" />
          </Tabs>
        </Box>
      )}

      <TabPanel value={tabValue} index={0}>
        {renderEventsList(events?.results, isManager)}
      </TabPanel>

      {!isManager && (
        <TabPanel value={tabValue} index={1}>
          {renderEventsList(
            events?.results.filter((event) =>
              event.organizers?.some((o) => o.userId === user?.id)
            ),
            false
          )}
        </TabPanel>
      )}

      {events && events.count > 0 && events.count > ITEMS_PER_PAGE && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={Math.ceil(events.count / ITEMS_PER_PAGE)}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      <Dialog
        open={!!selectedEventId}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <EventForm
            id={selectedEventId || undefined}
            onSubmit={handleSubmit}
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
          <EventForm onSubmit={handleSubmit} onCancel={handleCloseModal} />
        </DialogContent>
      </Dialog>

      {selectedEventForGuests && (
        <EventGuestsModal
          event={selectedEventForGuests}
          open={isManagingGuests}
          onClose={handleCloseGuestsModal}
          onRemoveGuest={handleRemoveGuest}
          onAddGuest={handleAddGuest}
          isLoading={isLoading}
        />
      )}

      {selectedEventForOrganizers && (
        <AddOrganizerModal
          event={selectedEventForOrganizers}
          open={isManagingOrganizers}
          onClose={handleCloseOrganizersModal}
          onAddOrganizer={handleAddOrganizer}
          onRemoveOrganizer={handleRemoveOrganizer}
          isLoading={isLoading}
        />
      )}

      {selectedEventForDetails && (
        <EventDetailsModal
          event={selectedEventForDetails}
          open={isViewingDetails}
          onClose={handleCloseDetailsModal}
          onRegister={() => handleRegisterForEvent()}
          onUnregister={() => handleUnregisterForEvent()}
          isRegistered={selectedEventForDetails.isRegistered}
          isLoading={isLoading}
        />
      )}

      {selectedEventForReward && (
        <RewardPointsModal
          event={selectedEventForReward}
          open={isRewardingPoints}
          onClose={handleCloseRewardModal}
          onRewardPoints={handleRewardPoints}
          isLoading={isLoading}
        />
      )}
    </StyledBox>
  );
}
