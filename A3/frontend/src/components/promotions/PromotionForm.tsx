import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { usePromotion, usePromotions } from "@/hooks/usePromotions";
import { PromotionType } from "@/types/shared.types";

export interface PromotionFormData {
  name: string;
  description: string;
  type: PromotionType;
  startTime: Date;
  endTime: Date;
  minSpending?: number;
  rate?: number;
  points?: number;
}

interface PromotionFormProps {
  id?: number;
  onSubmit: (data: PromotionFormData) => void;
  onCancel: () => void;
}

export function PromotionForm({ id, onSubmit, onCancel }: PromotionFormProps) {
  const { data: existingPromotion } = usePromotion(id);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PromotionFormData>({
    defaultValues: {
      name: "",
      description: "",
      type: PromotionType.AUTOMATIC,
      startTime: new Date(),
      endTime: new Date(),
    },
  });

  useEffect(() => {
    if (existingPromotion) {
      reset({
        name: existingPromotion.name,
        description: existingPromotion.description || "",
        type: existingPromotion.type.toUpperCase() as PromotionType,
        startTime: new Date(existingPromotion.startTime),
        endTime: new Date(existingPromotion.endTime),
        minSpending: existingPromotion.minSpending,
        rate: existingPromotion.rate,
        points: existingPromotion.points,
      });
    }
  }, [existingPromotion, reset]);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ maxWidth: 600, mx: "auto", mt: 4 }}
    >
      <Stack spacing={3}>
        <Controller
          name="name"
          control={control}
          rules={{ required: "Name is required" }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              value={field.value || ""}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          rules={{ required: "Description is required" }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              value={field.value || ""}
              multiline
              rows={3}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="type"
          control={control}
          rules={{ required: "Type is required" }}
          render={({ field }) => (
            <FormControl error={Boolean(errors.type)} fullWidth>
              <InputLabel>Type</InputLabel>
              <Select {...field} value={field.value || ""} label="Type">
                <MenuItem value={PromotionType.AUTOMATIC}>Automatic</MenuItem>
                <MenuItem value={PromotionType.ONE_TIME}>One-time</MenuItem>
              </Select>
              {errors.type && (
                <FormHelperText>{errors.type.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />

        <Controller
          name="startTime"
          control={control}
          rules={{
            required: "Start time is required",
            validate: (value) => {
              const now = new Date();
              now.setSeconds(0, 0);
              return value > now || "Start time must be in the future";
            },
          }}
          render={({ field }) => (
            <DateTimePicker
              {...field}
              label="Start Time"
              slotProps={{
                textField: {
                  error: Boolean(errors.startTime),
                  helperText: errors.startTime?.message,
                  fullWidth: true,
                },
              }}
            />
          )}
        />

        <Controller
          name="endTime"
          control={control}
          rules={{
            required: "End time is required",
            validate: (value, formValues) => {
              if (!value || !formValues.startTime) return true;
              return (
                value > formValues.startTime ||
                "End time must be after start time"
              );
            },
          }}
          render={({ field }) => (
            <DateTimePicker
              {...field}
              label="End Time"
              slotProps={{
                textField: {
                  error: Boolean(errors.endTime),
                  helperText: errors.endTime?.message,
                  fullWidth: true,
                },
              }}
            />
          )}
        />

        <Controller
          name="minSpending"
          control={control}
          rules={{
            min: { value: 0, message: "Minimum spend must be positive" },
            validate: (value) =>
              !value || !isNaN(Number(value)) || "Must be a valid number",
          }}
          render={({ field: { onChange, value, ...field } }) => (
            <TextField
              {...field}
              value={value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val === "" ? undefined : Number(val));
              }}
              label="Minimum Spend"
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
              error={Boolean(errors.minSpending)}
              helperText={errors.minSpending?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="rate"
          control={control}
          rules={{
            min: { value: 0, message: "Rate must be positive" },
            max: { value: 1, message: "Rate must be between 0 and 1" },
            validate: (value) =>
              !value || !isNaN(Number(value)) || "Must be a valid number",
          }}
          render={({ field: { onChange, value, ...field } }) => (
            <TextField
              {...field}
              value={value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val === "" ? undefined : Number(val));
              }}
              label="Rate"
              type="number"
              inputProps={{
                step: "0.01",
                min: "0",
                max: "1",
              }}
              error={Boolean(errors.rate)}
              helperText={errors.rate?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="points"
          control={control}
          rules={{
            min: { value: 0, message: "Points must be positive" },
            validate: (value) =>
              !value ||
              (!isNaN(Number(value)) && Number.isInteger(Number(value))) ||
              "Must be a valid integer",
          }}
          render={({ field: { onChange, value, ...field } }) => (
            <TextField
              {...field}
              value={value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val === "" ? undefined : Number(val));
              }}
              label="Points"
              type="number"
              inputProps={{ step: "1", min: "0" }}
              error={Boolean(errors.points)}
              helperText={errors.points?.message}
              fullWidth
            />
          )}
        />

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {id ? "Update" : "Create"} Promotion
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
