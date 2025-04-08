import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useUser } from "@/hooks/useUser";
import { Role } from "@/types/shared.types";
import {
  Box,
  Typography,
  CircularProgress,
  styled,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Grid,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  VerifiedUser as VerifiedIcon,
  ManageAccounts as ManageAccountsIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { User } from "@/types/user.types";
import { UserUpdateParams } from "@/services/api/users-api";

const StyledBox = styled(Box)(({ theme }) => ({
  maxWidth: 1200,
  margin: "0 auto",
  padding: theme.spacing(3),
}));

const ITEMS_PER_PAGE = 9;

export default function Users() {
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(
    undefined
  );
  const [activatedFilter, setActivatedFilter] = useState<boolean | undefined>(
    undefined
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState<"name" | "lastLogin">("name");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const { user } = useUser();
  const isSuperuser = user?.role.toUpperCase() === Role.SUPERUSER;
  const isManager = user?.role.toUpperCase() === Role.MANAGER || isSuperuser;

  const { users, isLoading, isError, updateUser, isUpdating } = useUsers({
    page,
    limit: ITEMS_PER_PAGE,
    name: nameFilter || undefined,
    role: roleFilter || undefined,
    verified: verifiedFilter,
    activated: activatedFilter,
  });

  const sortedUsers = useMemo(() => {
    if (!users?.results) return [];

    return [...users.results].sort((a, b) => {
      if (orderBy === "name") {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return orderDir === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (orderBy === "lastLogin") {
        const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
        return orderDir === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [users?.results, orderBy, orderDir]);

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
    setPage(1);
  };

  const toggleSortDirection = (field: "name" | "lastLogin") => {
    if (orderBy === field) {
      setOrderDir(orderDir === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(field);
      setOrderDir("asc");
    }
  };

  const getSortIcon = (field: "name" | "lastLogin") => {
    if (orderBy !== field) return null;
    return orderDir === "asc" ? (
      <ArrowDownIcon fontSize="small" />
    ) : (
      <ArrowUpIcon fontSize="small" />
    );
  };

  const handleVerifyUser = (user: User) => {
    if (!isManager) return;

    const updateData: UserUpdateParams = { verified: true };

    updateUser(user.id, updateData);
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    setIsRoleDialogOpen(false);
    setSelectedUser(null);
    setSelectedRole("");
  };

  const handleRoleChange = () => {
    if (!selectedUser || !selectedRole) return;

    if (
      isSuperuser ||
      (isManager &&
        !["manager", "superuser"].includes(selectedRole.toLowerCase()))
    ) {
      const updateData: UserUpdateParams = { role: selectedRole };

      updateUser(selectedUser.id, updateData);
      closeRoleDialog();
    }
  };

  if (!isManager) {
    return (
      <StyledBox>
        <Typography variant="h5" color="error" align="center">
          You do not have permission to access this page.
        </Typography>
      </StyledBox>
    );
  }

  return (
    <StyledBox>
      <Typography variant="h4" component="h1" gutterBottom>
        Users Directory
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Search by name or UTORid"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch} edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.25}>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="regular">Regular</MenuItem>
              <MenuItem value="cashier">Cashier</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="superuser">Superuser</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2.25}>
          <FormControl fullWidth>
            <InputLabel>Verified Status</InputLabel>
            <Select
              value={
                verifiedFilter === undefined
                  ? "any"
                  : verifiedFilter
                  ? "yes"
                  : "no"
              }
              label="Verified Status"
              onChange={(e) => {
                if (e.target.value === "any") {
                  setVerifiedFilter(undefined);
                } else if (e.target.value === "yes") {
                  setVerifiedFilter(true);
                } else {
                  setVerifiedFilter(false);
                }
                setPage(1);
              }}
            >
              <MenuItem value="any">Any</MenuItem>
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2.25}>
          <FormControl fullWidth>
            <InputLabel>Activated Status</InputLabel>
            <Select
              value={
                activatedFilter === undefined
                  ? "any"
                  : activatedFilter
                  ? "yes"
                  : "no"
              }
              label="Activated Status"
              onChange={(e) => {
                if (e.target.value === "any") {
                  setActivatedFilter(undefined);
                } else if (e.target.value === "yes") {
                  setActivatedFilter(true);
                } else {
                  setActivatedFilter(false);
                }
                setPage(1);
              }}
            >
              <MenuItem value="any">Any</MenuItem>
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Typography color="error" align="center">
          Error loading users. Please try again.
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell
                    onClick={() => toggleSortDirection("name")}
                    sx={{ cursor: "pointer" }}
                  >
                    Name / UTORid {getSortIcon("name")}
                  </TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Verified</TableCell>
                  <TableCell>Activated</TableCell>
                  <TableCell>Points</TableCell>
                  <TableCell
                    onClick={() => toggleSortDirection("lastLogin")}
                    sx={{ cursor: "pointer" }}
                  >
                    Last Login {getSortIcon("lastLogin")}
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1">{u.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {u.utorid}
                      </Typography>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.verified ? "Yes" : "No"}</TableCell>
                    <TableCell>{u.isActivated ? "Yes" : "No"}</TableCell>
                    <TableCell>{u.points}</TableCell>
                    <TableCell>
                      {u.lastLogin
                        ? format(new Date(u.lastLogin), "MMM d, yyyy HH:mm")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {!u.verified && (
                        <Tooltip title="Verify User">
                          <IconButton
                            color="primary"
                            onClick={() => handleVerifyUser(u)}
                            disabled={isUpdating}
                          >
                            <VerifiedIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {u.utorid !== user?.utorid &&
                        (user?.role.toUpperCase() !== Role.MANAGER ||
                          u.role.toUpperCase() !== Role.SUPERUSER) && (
                          <Tooltip title="Change Role">
                            <IconButton
                              color="secondary"
                              onClick={() => openRoleDialog(u)}
                              disabled={isUpdating}
                            >
                              <ManageAccountsIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={users?.totalPages || 1}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onClose={closeRoleDialog}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {selectedUser && (
              <Typography gutterBottom>
                Change role for: <strong>{selectedUser.name}</strong> (
                {selectedUser.utorid})
              </Typography>
            )}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRole}
                label="Role"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="cashier">Cashier</MenuItem>
                {isSuperuser && <MenuItem value="manager">Manager</MenuItem>}
                {isSuperuser && (
                  <MenuItem value="superuser">Superuser</MenuItem>
                )}
              </Select>
            </FormControl>
            {isManager && !isSuperuser && selectedRole === "manager" && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Only superusers can assign manager or superuser roles.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoleDialog}>Cancel</Button>
          <Button
            onClick={handleRoleChange}
            variant="contained"
            color="primary"
            disabled={
              isUpdating || !selectedRole || selectedRole === selectedUser?.role
            }
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </StyledBox>
  );
}
