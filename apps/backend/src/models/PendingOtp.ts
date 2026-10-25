
import mongoose, { Schema } from "mongoose";

const pendingOtpSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const PendingOtp =
  mongoose.models.PendingOtp ||
  mongoose.model("PendingOtp", pendingOtpSchema);

export default PendingOtp;
