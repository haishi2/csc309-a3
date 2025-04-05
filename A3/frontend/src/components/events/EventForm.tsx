import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { useEvent } from "@/hooks/useEvents";
import { isEqual } from "date-fns";

export interface EventFormData {
  name: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  capacity?: number;
  points: number;
  isPublished: boolean;
}

export type EventFormUpdate = Partial<EventFormData>;

interface EventFormProps {
  id?: number;
  onSubmit: (data: EventFormData | EventFormUpdate) => void;
  onCancel: () => void;
}

export function EventForm({ id, onSubmit, onCancel }: EventFormProps) {
  const { data: existingEvent } = useEvent(id);

  const defaultValues: EventFormData = {
    name: "",
    description: "",
    location: "",
    startTime: new Date(),
    endTime: new Date(),
    capacity: undefined,
    points: 0,
    isPublished: false,
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
    watch,
  } = useForm<EventFormData>({
    defaultValues,
  });

  const [initialValues, setInitialValues] =
    useState<EventFormData>(defaultValues);
  const formValues = watch();

  useEffect(() => {
    if (existingEvent) {
      const values = {
        name: existingEvent.name,
        description: existingEvent.description,
        location: existingEvent.location,
        startTime: new Date(existingEvent.startTime),
        endTime: new Date(existingEvent.endTime),
        capacity: existingEvent.capacity,
        points: existingEvent.pointsRemain + existingEvent.pointsAwarded,
        isPublished: existingEvent.isPublished,
      };
      reset(values);
      setInitialValues(values);
    }
  }, [existingEvent, reset]);

  const handleFormSubmit = (data: EventFormData) => {
    if (!id) {
      onSubmit(data);
      return;
    }

    const changes: EventFormUpdate = {};
    const current = getValues();

    if (current.name !== initialValues.name) {
      changes.name = current.name;
    }
    if (current.description !== initialValues.description) {
      changes.description = current.description;
    }
    if (current.location !== initialValues.location) {
      changes.location = current.location;
    }
    if (!isEqual(current.startTime, initialValues.startTime)) {
      changes.startTime = current.startTime;
    }
    if (!isEqual(current.endTime, initialValues.endTime)) {
      changes.endTime = current.endTime;
    }
    if (current.capacity !== initialValues.capacity) {
      changes.capacity = current.capacity;
    }
    if (current.points !== initialValues.points) {
      changes.points = current.points;
    }
    if (current.isPublished !== initialValues.isPublished) {
      changes.isPublished = current.isPublished;
    }

    onSubmit(changes);
  };

  const isFieldChanged = (fieldName: keyof EventFormData): boolean => {
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
          name="location"
          control={control}
          rules={{
            required: isFieldChanged("location")
              ? "Location is required"
              : undefined,
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Location"
              value={field.value || ""}
              error={Boolean(errors.location)}
              helperText={errors.location?.message}
              fullWidth
            />
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
          name="capacity"
          control={control}
          rules={{
            min: isFieldChanged("capacity")
              ? { value: 0, message: "Capacity must be positive" }
              : undefined,
            validate: (value) => {
              if (!isFieldChanged("capacity")) return true;
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
              label="Capacity (optional)"
              type="number"
              inputProps={{ step: "1", min: "0" }}
              error={Boolean(errors.capacity)}
              helperText={errors.capacity?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="points"
          control={control}
          rules={{
            required: isFieldChanged("points")
              ? "Points is required"
              : undefined,
            min: isFieldChanged("points")
              ? { value: 0, message: "Points must be positive" }
              : undefined,
            validate: (value) => {
              if (!isFieldChanged("points")) return true;
              return (
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
              label="Points"
              type="number"
              inputProps={{ step: "1", min: "0" }}
              error={Boolean(errors.points)}
              helperText={errors.points?.message}
              fullWidth
            />
          )}
        />

        {id && !existingEvent?.isPublished && (
          <Controller
            name="isPublished"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label="Published"
              />
            )}
          />
        )}

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {id ? "Update" : "Create"} Event
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
