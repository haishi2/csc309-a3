import {
    Card,
    CardContent,
    Typography,
    Box,
    TextField,
    Button,
    Stack,
    Alert,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Chip,
  } from "@mui/material";
  import { useState } from "react";
  import { useUser } from "@/hooks/useUser";
  import { usePromotions } from "@/hooks/usePromotions";
  import { toast } from "sonner";
  import { createPurchase, processRedemption } from "@/services/api/transactions-api";
  
  interface PurchaseTransaction {
    utorid: string;
    type: "purchase";
    spent: number;
    promotionIds?: number[];
    remark?: string;
  }
  
  interface ProcessRedemptionForm {
    transactionId: string;
    remark: string;
  }
  
  export default function TransactionCard() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    // Get available promotions
    const { promotions } = usePromotions({
      limit: 100, // Adjust based on your needs
    });
  
    // Purchase Transaction Form State
    const [purchaseForm, setPurchaseForm] = useState({
      utorid: "",
      spent: "",
      promotionIds: [] as number[],
      remark: "",
    });
  
    // Process Redemption Form State
    const [processForm, setProcessForm] = useState<ProcessRedemptionForm>({
      transactionId: "",
      remark: "",
    });
  
    const handleCreatePurchase = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsProcessing(true);
  
      try {
        const spent = parseFloat(purchaseForm.spent);
  
        if (isNaN(spent) || spent <= 0) {
          throw new Error("Please enter a valid amount");
        }
  
        if (!purchaseForm.utorid) {
          throw new Error("Please enter a valid UTORid");
        }
  
        const transaction: PurchaseTransaction = {
          utorid: purchaseForm.utorid,
          type: "purchase",
          spent,
          ...(purchaseForm.promotionIds.length > 0 && {
            promotionIds: purchaseForm.promotionIds,
          }),
          ...(purchaseForm.remark && { remark: purchaseForm.remark }),
        };
  
        const result = await createPurchase(transaction);
  
        // Reset form
        setPurchaseForm({
          utorid: "",
          spent: "",
          promotionIds: [],
          remark: "",
        });
  
        toast.success("Purchase transaction created successfully!", {
          description: `Created transaction #${result.id} - ${result.earned} points earned`,
        });
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to create purchase transaction. Please try again.");
        }
      } finally {
        setIsProcessing(false);
      }
    };
  
    const handleProcessRedemption = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsProcessing(true);
  
      try {
        const transactionId = parseInt(processForm.transactionId);
  
        if (isNaN(transactionId) || transactionId <= 0) {
          throw new Error("Please enter a valid transaction ID");
        }
  
        const result = await processRedemption(
          transactionId,
          processForm.remark
        );
  
        // Reset form
        setProcessForm({
          transactionId: "",
          remark: "",
        });
  
        toast.success("Redemption processed successfully!", {
          description: `Processed transaction #${result.id} for ${result.amount} points`,
        });
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to process redemption. Please try again.");
        }
      } finally {
        setIsProcessing(false);
      }
    };
  
    return (
      <Card sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Create Purchase" />
            <Tab label="Process Redemption" />
          </Tabs>
  
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
  
          {activeTab === 0 ? (
            <form onSubmit={handleCreatePurchase}>
              <Stack spacing={2}>
                <TextField
                  label="UTORid"
                  value={purchaseForm.utorid}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, utorid: e.target.value })}
                  required
                  fullWidth
                  disabled={isProcessing}
                />
  
                <TextField
                  label="Amount Spent ($)"
                  value={purchaseForm.spent}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, spent: e.target.value })}
                  type="number"
                  required
                  fullWidth
                  disabled={isProcessing}
                  slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                />
  
                <Autocomplete
                  multiple
                  options={promotions?.results || []}
                  getOptionLabel={(option) => option.name}
                  value={(promotions?.results || []).filter(p => 
                    purchaseForm.promotionIds.includes(p.id)
                  )}
                  onChange={(_, newValue) => setPurchaseForm({
                    ...purchaseForm,
                    promotionIds: newValue.map(v => v.id)
                  })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Apply Promotions"
                      placeholder="Select promotions"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.name}
                        {...getTagProps({ index })}
                        key={option.id}
                      />
                    ))
                  }
                  disabled={isProcessing}
                />
  
                <TextField
                  label="Remark (optional)"
                  value={purchaseForm.remark}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, remark: e.target.value })}
                  fullWidth
                  disabled={isProcessing}
                  multiline
                  rows={2}
                />
  
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isProcessing}
                  sx={{ mt: 2 }}
                >
                  {isProcessing ? "Processing..." : "Create Purchase"}
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleProcessRedemption}>
              <Stack spacing={2}>
                <TextField
                  label="Transaction ID"
                  value={processForm.transactionId}
                  onChange={(e) => setProcessForm({ ...processForm, transactionId: e.target.value })}
                  type="number"
                  required
                  fullWidth
                  disabled={isProcessing}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
  
                <TextField
                  label="Remark (optional)"
                  value={processForm.remark}
                  onChange={(e) => setProcessForm({ ...processForm, remark: e.target.value })}
                  fullWidth
                  disabled={isProcessing}
                  multiline
                  rows={2}
                />
  
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isProcessing}
                  sx={{ mt: 2 }}
                >
                  {isProcessing ? "Processing..." : "Process Redemption"}
                </Button>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }