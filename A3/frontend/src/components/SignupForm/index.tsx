import { useState } from "react";
import { toast } from "sonner";
import apiClient from "@/services/api/api-client";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
} from "@mui/material";
import { useResetTokenStore } from "@/stores/reset-token-store";

interface UserRegistrationResponse {
  id: number;
  utorid: string;
  name: string;
  email: string;
  verified: boolean;
  expiresAt: string;
  resetToken: string;
}

export default function SignupForm() {
  const [error, setError] = useState("");
  const [registrationData, setRegistrationData] = useState({
    utorid: "",
    name: "",
    email: "",
  });
  const addToken = useResetTokenStore((state) => state.addToken);

  const validateEmail = (email: string) => {
    return email.endsWith("@mail.utoronto.ca");
  };

  const validateUtorid = (utorid: string) => {
    return /^[a-zA-Z0-9]{8}$/.test(utorid);
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateUtorid(registrationData.utorid)) {
      setError("UTORid must be exactly 8 alphanumeric characters");
      return;
    }

    if (!validateEmail(registrationData.email)) {
      setError("Please enter a valid University of Toronto email address");
      return;
    }

    if (registrationData.name.length < 1 || registrationData.name.length > 50) {
      setError("Name must be between 1 and 50 characters");
      return;
    }

    try {
      const response = await apiClient.post<UserRegistrationResponse>(
        "/users",
        registrationData
      );
      
      // Store the token in our store
      addToken(registrationData.utorid, response.data.resetToken);
      
      // Show success toast
      toast.success(`User ${registrationData.utorid} created successfully! They can now set their password.`);
      
      // Reset form
      setRegistrationData({
        utorid: "",
        name: "",
        email: "",
      });
      
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("A user with this UTORid already exists");
      } else {
        setError("Failed to register user. Please try again.");
      }
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
        <Typography component="h1" variant="h4" gutterBottom>
          Create New User Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, width: "100%" }}>
          <Box component="form" onSubmit={handleRegistration}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="utorid"
              label="UTORid"
              name="utorid"
              autoComplete="username"
              value={registrationData.utorid}
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  utorid: e.target.value,
                })
              }
              helperText="Must be exactly 8 alphanumeric characters"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              value={registrationData.name}
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  name: e.target.value,
                })
              }
              helperText="1-50 characters"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="UofT Email"
              name="email"
              autoComplete="email"
              value={registrationData.email}
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  email: e.target.value,
                })
              }
              helperText="Must end with @mail.utoronto.ca"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Create User
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
