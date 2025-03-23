import { useUser } from "@/hooks/useUser";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  CircularProgress,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const ProfileCard = styled(Card)(({ theme }) => ({
  maxWidth: 600,
  margin: "0 auto",
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
  boxShadow: "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px",
  ...theme.applyStyles("dark", {
    boxShadow: "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px",
  }),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(12),
  height: theme.spacing(12),
  marginBottom: theme.spacing(2),
}));

export default function UserProfile() {
  const { user, isLoading, isError, refetch } = useUser();

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

  if (isError || !user) {
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
          Failed to load user data
        </Typography>
        <Button variant="contained" onClick={() => refetch()}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <ProfileCard>
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <ProfileAvatar src={user.avatarUrl} alt={user.name}>
            {!user.avatarUrl && user.name.charAt(0).toUpperCase()}
          </ProfileAvatar>
          <Typography variant="h4" gutterBottom>
            {user.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            @{user.username}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1">{user.email}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Account Status
            </Typography>
            <Typography variant="body1">
              {user.isActivated ? "Active" : "Inactive"}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Role
            </Typography>
            <Typography variant="body1" sx={{ textTransform: "capitalize" }}>
              {user.role.toLowerCase()}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Points Balance
            </Typography>
            <Typography variant="body1">
              {user.points.toLocaleString()} points
            </Typography>
          </Box>

          {user.birthday && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Birthday
              </Typography>
              <Typography variant="body1">{user.birthday}</Typography>
            </Box>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary">
              Member Since
            </Typography>
            <Typography variant="body1">
              {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
          </Box>

          {user.lastLogin && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Last Login
              </Typography>
              <Typography variant="body1">
                {new Date(user.lastLogin).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </ProfileCard>
  );
}
