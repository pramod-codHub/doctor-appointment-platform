
import mongoose, { Schema, Document } from "mongoose";

export type AppointmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  clinic: mongoose.Types.ObjectId;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

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

    // Date format: YYYY-MM-DD
    appointmentDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    // Time format: HH:mm
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

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// A doctor cannot have two active appointments
// for the same clinic, date, and starting time.
// Rejected and cancelled appointments release the slot.
appointmentSchema.index(
  {
    doctor: 1,
    clinic: 1,
    appointmentDate: 1,
    startTime: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "approved"] },
    },
  }
);

const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  appointmentSchema
);

export default Appointment;
