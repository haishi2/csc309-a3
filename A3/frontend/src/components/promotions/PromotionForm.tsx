import { useEffect, useState } from "react";
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
import { usePromotion } from "@/hooks/usePromotions";
import { PromotionType } from "@/types/shared.types";
import { isEqual } from "date-fns";

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

export type PromotionFormUpdate = Partial<PromotionFormData>;

interface PromotionFormProps {
  id?: number;
  onSubmit: (data: PromotionFormData | PromotionFormUpdate) => Promise<void>;
  onCancel: () => void;
}

export function PromotionForm({ id, onSubmit, onCancel }: PromotionFormProps) {
  const { data: existingPromotion } = usePromotion(id);
  const [initialValues, setInitialValues] = useState<PromotionFormData>({
    name: "",
    description: "",
    type: PromotionType.AUTOMATIC,
    startTime: new Date(),
    endTime: new Date(),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
    watch,
  } = useForm<PromotionFormData>({
    defaultValues: initialValues,
  });

  const formValues = watch();

  useEffect(() => {
    if (existingPromotion) {
      const values = {
        name: existingPromotion.name,
        description: existingPromotion.description || "",
        type: existingPromotion.type
          .toUpperCase()
          .replace("_", "-") as PromotionType,
        startTime: new Date(existingPromotion.startTime),
        endTime: new Date(existingPromotion.endTime),
        minSpending: existingPromotion.minSpending,
        rate: existingPromotion.rate,
        points: existingPromotion.points,
      };
      reset(values);
      setInitialValues(values);
    }
  }, [existingPromotion, reset]);

  const handleFormSubmit = (data: PromotionFormData) => {
    if (!id) {
      onSubmit(data);
      return;
    }

    const changes: PromotionFormUpdate = {};
    const current = getValues();

    if (current.name !== initialValues.name) {
      changes.name = current.name;
    }
    if (current.description !== initialValues.description) {
      changes.description = current.description;
    }
    if (current.type !== initialValues.type) {
      changes.type = current.type;
    }
    if (!isEqual(current.startTime, initialValues.startTime)) {
      changes.startTime = current.startTime;
    }
    if (!isEqual(current.endTime, initialValues.endTime)) {
      changes.endTime = current.endTime;
    }
    if (current.minSpending !== initialValues.minSpending) {
      changes.minSpending = current.minSpending;
    }
    if (current.rate !== initialValues.rate) {
      changes.rate = current.rate;
    }
    if (current.points !== initialValues.points) {
      changes.points = current.points;
    }

    onSubmit(changes);
  };

  const isFieldChanged = (fieldName: keyof PromotionFormData): boolean => {
    if (!id) return true;

    const currentValue = formValues[fieldName];
    const initialValue = initialValues[fieldName];

    if (currentValue === undefined && initialValue === undefined) return false;
    if (currentValue === undefined || initialValue === undefined) return true;

    if (fieldName === "startTime" || fieldName === "endTime") {
      return !isEqual(currentValue as Date, initialValue as Date);
    }

    return currentValue !== initialValue;
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{ maxWidth: 600, mx: "auto", mt: 4 }}
    >
      <Stack spacing={3}>
        <Controller
          name="name"
          control={control}
          rules={{
            required: isFieldChanged("name") ? "Name is required" : undefined,
          }}
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
          rules={{
            required: isFieldChanged("description")
              ? "Description is required"
              : undefined,
          }}
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
          rules={{
            required: isFieldChanged("type") ? "Type is required" : undefined,
          }}
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
            required: isFieldChanged("startTime")
              ? "Start time is required"
              : undefined,
            validate: (value) => {
              if (!isFieldChanged("startTime")) return true;
              const now = new Date();
              now.setSeconds(0, 0);
              value.setSeconds(0, 0);
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
            required: isFieldChanged("endTime")
              ? "End time is required"
              : undefined,
            validate: (value, formValues) => {
              if (!isFieldChanged("endTime")) return true;
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
            min: isFieldChanged("minSpending")
              ? { value: 0, message: "Minimum spend must be positive" }
              : undefined,
            validate: (value) => {
              if (!isFieldChanged("minSpending")) return true;
              return (
                !value || !isNaN(Number(value)) || "Must be a valid number"
              );
            },
          }}
          render={({ field: { onChange, value, ...field } }) => (
            <TextField
              {...field}
              value={value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val === "" ? undefined : Number(val));
              }}
              label="Minimum Spend in Dollars"
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
            min: isFieldChanged("rate")
              ? { value: 0, message: "Rate must be positive" }
              : undefined,
            max: isFieldChanged("rate")
              ? { value: 1, message: "Rate must be between 0 and 1" }
              : undefined,
            validate: (value) => {
              if (!isFieldChanged("rate")) return true;
              return (
                !value || !isNaN(Number(value)) || "Must be a valid number"
              );
            },
          }}
          render={({ field: { onChange, value, ...field } }) => (
            <TextField
              {...field}
              value={value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val === "" ? undefined : Number(val));
              }}
              label="Rate (0-1)"
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
            min: isFieldChanged("points")
              ? { value: 0, message: "Points must be positive" }
              : undefined,
            validate: (value) => {
              if (!isFieldChanged("points")) return true;
              return (
                !value ||
                (!isNaN(Number(value)) && Number.isInteger(Number(value))) ||
                "Must be a valid integer"
              );
            },
          }}
          render={({ field: { onChange, value, ...field } }) => (
            <TextField
              {...field}
              value={value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val === "" ? undefined : Number(val));
              }}
              label="Points to reward"
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
