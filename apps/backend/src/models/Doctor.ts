import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  mobile: string;
  email?: string;
  specialty: string;
  qualification: string;
  experience: number;

  clinics: {
    clinic: mongoose.Types.ObjectId;
    consultationFee: number;
  }[];

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    specialty: {
      type: String,
      required: true,
      trim: true,
    },

    qualification: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
    },

    clinics: [
      {
        clinic: {
          type: Schema.Types.ObjectId,
          ref: "Clinic",
          required: true,
        },

        consultationFee: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);

export default Doctor;