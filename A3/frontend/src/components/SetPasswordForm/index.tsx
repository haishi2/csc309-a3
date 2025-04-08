import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
  Divider,
} from "@mui/material";
import { useResetTokenStore } from "@/stores/reset-token-store";

export default function SetPasswordForm() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [utorid, setUtorid] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const getToken = useResetTokenStore((state) => state.getToken);
  const removeToken = useResetTokenStore((state) => state.removeToken);

  const validatePassword = (password: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,20}$/;
    return passwordRegex.test(password);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Retrieve the token for this utorid
    const resetToken = getToken(utorid);
    
    if (!resetToken) {
      setError("No reset token found for this UTORid. Please contact an administrator.");
      return;
    }

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
        utorid,
        password,
      });

      // Remove the token after successful use
      removeToken(utorid);
      
      // Show success message and redirect to login
      toast.success("Password set successfully! You can now log in.");
      navigate("/auth");
      
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Invalid reset token");
      } else if (err.response?.status === 410) {
        setError("Reset token has expired");
        // Remove expired token
        removeToken(utorid);
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
          Set Your Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, width: "100%" }}>
          <Box component="form" onSubmit={handleSetPassword}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="utorid"
              label="UTORid"
              name="utorid"
              autoComplete="username"
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              helperText="Enter your UTORid to retrieve your reset token"
            />
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
              helperText="8-20 characters with at least one uppercase, one lowercase, one number, and one special character"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Set Password
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }}>
            <Typography sx={{ color: "text.secondary" }}>or</Typography>
          </Divider>
          
          <Box sx={{ textAlign: "center" }}>
            <Button
              component={RouterLink}
              to="/auth"
              variant="outlined"
              fullWidth
            >
              Back to Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 