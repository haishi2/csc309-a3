import {
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Divider,
  Stack,
  TextField,
  Alert,
} from "@mui/material";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { createTransfer, createRedemption } from "@/services/api/user-api";
import { useUser, USER_QUERY_KEY } from "@/hooks/useUser";
import { ProfileCard, ProfileAvatar, QRCodeContainer } from "./index.styles";

export default function UserProfile() {
  const queryClient = useQueryClient();
  const { user, isLoading, isError, refetch } = useUser();
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [remark, setRemark] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionRemark, setRedemptionRemark] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const qrCodeData = `${user.id}`;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setIsTransferring(true);

    try {
      const amount = parseInt(transferAmount);
      const recipient = parseInt(recipientId);

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (isNaN(recipient) || recipient <= 0) {
        throw new Error("Please enter a valid recipient ID");
      }

      if (recipient === user.id) {
        throw new Error("You cannot transfer points to yourself");
      }

      if (amount > user.points) {
        throw new Error("Insufficient points balance");
      }

      await createTransfer(recipient, amount, remark);

      // Reset form
      setTransferAmount("");
      setRecipientId("");
      setRemark("");

      // Refresh user data to get updated points balance
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });

      toast.success("Transfer successful!", {
        description: `Successfully transferred ${amount} points`,
      });
    } catch (error) {
      setTransferError(
        error instanceof Error
          ? error.message
          : "Transfer failed. Please try again."
      );
    } finally {
      setIsTransferring(false);
    }
  };

  const handleRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsRedeeming(true);

    try {
      const amount = parseInt(redemptionAmount);

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (amount > user.points) {
        throw new Error("Insufficient points balance");
      }

      await createRedemption(amount, redemptionRemark);

      // Reset form
      setRedemptionAmount("");
      setRedemptionRemark("");

      // Refresh user data to get updated points balance
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });

      toast.success("Redemption request submitted!", {
        description: `Requested to redeem ${amount} points`,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Redemption request failed. Please try again."
      );
    } finally {
      setIsRedeeming(false);
    }
  };

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
        </Box>

        <Divider sx={{ my: 2 }} />

        <QRCodeContainer>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your Unique QR Code
          </Typography>
          <QRCodeSVG
            value={qrCodeData}
            size={200}
            level="H" // High error correction
            includeMargin
            bgColor="transparent"
            fgColor="currentColor"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Use this QR code to quickly identify yourself at events
          </Typography>
        </QRCodeContainer>

        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1">{user.email}</Typography>
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
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Transfer Points
          </Typography>

          {transferError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {transferError}
            </Alert>
          )}

          <form onSubmit={handleTransfer}>
            <Stack spacing={2}>
              <TextField
                label="Recipient ID"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                type="number"
                required
                fullWidth
                disabled={isTransferring}
                slotProps={{ htmlInput: { min: 1 } }}
              />

              <TextField
                label="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                type="number"
                required
                fullWidth
                disabled={isTransferring}
                slotProps={{ htmlInput: { min: 1, max: user.points } }}
                helperText={`Available balance: ${user.points} points`}
              />

              <TextField
                label="Remark (optional)"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                fullWidth
                disabled={isTransferring}
                multiline
                rows={2}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isTransferring}
                sx={{ mt: 2 }}
              >
                {isTransferring ? "Transferring..." : "Transfer Points"}
              </Button>
            </Stack>
          </form>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Redeem Points
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleRedemption}>
            <Stack spacing={2}>
              <TextField
                label="Amount to Redeem"
                value={redemptionAmount}
                onChange={(e) => setRedemptionAmount(e.target.value)}
                type="number"
                required
                fullWidth
                disabled={isRedeeming}
                slotProps={{ htmlInput: { min: 1, max: user.points } }}
                helperText={`Available balance: ${user.points} points`}
              />

              <TextField
                label="Remark (optional)"
                value={redemptionRemark}
                onChange={(e) => setRedemptionRemark(e.target.value)}
                fullWidth
                disabled={isRedeeming}
                multiline
                rows={2}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isRedeeming}
                sx={{ mt: 2 }}
              >
                {isRedeeming ? "Processing..." : "Submit Redemption Request"}
              </Button>
            </Stack>
          </form>
        </Box>
      </CardContent>
    </ProfileCard>
  );
}
