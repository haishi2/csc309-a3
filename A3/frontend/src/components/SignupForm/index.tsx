import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Role } from "@/types/shared.types";
import apiClient from "@/services/api/api-client";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from "@mui/material";

interface UserRegistrationResponse {
  id: number;
  utorid: string;
  name: string;
  email: string;
  verified: boolean;
  expiresAt: string;
  resetToken: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [registrationData, setRegistrationData] = useState({
    utorid: "",
    name: "",
    email: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const steps = ["User Registration", "Set Password"];

  const validateEmail = (email: string) => {
    return email.endsWith("@mail.utoronto.ca");
  };

  const validatePassword = (password: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return passwordRegex.test(password);
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
      setResetToken(response.data.resetToken);
      setActiveStep(1);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("A user with this UTORid already exists");
      } else {
        setError("Failed to register user. Please try again.");
      }
    }
  };

  const handlePasswordSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be 8-20 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    }

    try {
      await apiClient.post(`/auth/resets/${resetToken}`, {
        utorid: registrationData.utorid,
        password: password,
      });

      // Show success message and redirect to login
      navigate("/auth", {
        state: {
          message: "Account created successfully! You can now log in.",
        },
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Invalid reset token");
      } else if (err.response?.status === 410) {
        setError("Reset token has expired");
      } else {
        setError("Failed to set password. Please try again.");
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

        <Stepper activeStep={activeStep} sx={{ width: "100%", mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, width: "100%" }}>
          {activeStep === 0 ? (
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
                helperText="Must be a valid @mail.utoronto.ca email"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
              >
                Register User
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handlePasswordSet}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="8-20 characters, including uppercase, lowercase, number, and special character"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
              >
                Set Password
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
