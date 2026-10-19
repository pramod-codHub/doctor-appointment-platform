import mongoose, { Schema, Document } from "mongoose";

export interface IPatient extends Document {
  name: string;
  mobile: string;
}

const patientSchema = new Schema<IPatient>(
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
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model<IPatient>(
  "Patient",
  patientSchema
);

export default Patient;