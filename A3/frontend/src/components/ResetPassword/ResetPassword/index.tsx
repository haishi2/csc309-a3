import { useState } from "react";
import { requestPasswordReset, resetPassword } from "@/services/api/auth-api";
import { useNavigate } from "react-router-dom";
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

export const PasswordReset = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [utorid, setUtorid] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const steps = ["Request Reset", "Set New Password"];

  const validatePassword = (password: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return passwordRegex.test(password);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await requestPasswordReset({ utorid });
      setResetToken(response.resetToken);
      setActiveStep(1);
    } catch (err) {
      setError(
        "Failed to send reset request. Please check your UTORid and try again."
      );
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
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
      await resetPassword(resetToken, {
        utorid,
        password,
      });
      // Show success message and redirect
      navigate("/login");
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Invalid reset token");
      } else if (err.response?.status === 410) {
        setError("Reset token has expired");
      } else {
        setError("Failed to reset password. Please try again.");
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
        <Typography component="h1" variant="h5" sx={{ mb: 4 }}>
          Password Reset
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
            <Box component="form" onSubmit={handleRequestReset}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Enter your UTORid to request a password reset.
              </Typography>
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
                sx={{ mt: 3 }}
              >
                Request Reset
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handlePasswordReset}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Enter your new password below.
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
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
                Reset Password
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
