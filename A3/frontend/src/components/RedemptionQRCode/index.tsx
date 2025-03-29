import { Card, CardContent, Typography, Box } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

interface RedemptionQRCodeProps {
  transactionId: number;
  amount: number;
}

export function RedemptionQRCode({ transactionId, amount }: RedemptionQRCodeProps) {
  const qrData = JSON.stringify({
    type: "redemption",
    id: transactionId,
    amount,
  });

  return (
    <Card sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom textAlign="center">
          Redemption Request #{transactionId}
        </Typography>
        
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <QRCodeSVG value={qrData} size={256} />
        </Box>
        
        <Typography textAlign="center" color="text.secondary">
          Amount: {amount} points
        </Typography>
      </CardContent>
    </Card>
  );
} 