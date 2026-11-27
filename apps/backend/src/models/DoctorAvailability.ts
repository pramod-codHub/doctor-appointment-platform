
import mongoose, { Schema, Document } from "mongoose";

export interface IDoctorAvailability extends Document {
  doctor: mongoose.Types.ObjectId;
  clinic: mongoose.Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  breakStartTime?: string;
  breakEndTime?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorAvailabilitySchema = new Schema<IDoctorAvailability>(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },

    // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    // Use 24-hour format: HH:mm
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    slotDurationMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 240,
    },

    breakStartTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    breakEndTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate schedules for the same doctor,
// clinic, and weekday.
doctorAvailabilitySchema.index(
  { doctor: 1, clinic: 1, dayOfWeek: 1 },
  { unique: true }
);

const DoctorAvailability = mongoose.model<IDoctorAvailability>(
  "DoctorAvailability",
  doctorAvailabilitySchema
);

export default DoctorAvailability;
