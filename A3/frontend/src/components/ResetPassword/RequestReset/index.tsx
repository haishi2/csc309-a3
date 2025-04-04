import { useState } from "react";
import { requestPasswordReset } from "@/services/api/auth-api";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

export const RequestReset = () => {
  const [utorid, setUtorid] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPasswordReset({ utorid });
      setSuccess(true);
      setError("");
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
      setSuccess(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mt: 2, width: "100%" }}>
            If an account exists with this UTORid, you will receive a password
            reset email shortly.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: "100%" }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 3, width: "100%" }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="utorid"
            label="UTORid"
            name="utorid"
            autoComplete="username"
            autoFocus
            value={utorid}
            onChange={(e) => setUtorid(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Send Reset Email
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
