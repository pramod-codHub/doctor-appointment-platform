import { Router } from "express";
import Patient from "../models/Patient";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (
      typeof name !== "string" ||
      typeof mobile !== "string" ||
      !name.trim() ||
      !/^\d{10}$/.test(mobile)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid name and 10-digit mobile number",
      });
    }

    const existingPatient = await Patient.findOne({ mobile });

    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered",
      });
    }

    const patient = await Patient.create({
      name: name.trim(),
      mobile,
    });

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      patient: {
        id: patient._id,
        name: patient.name,
        mobile: patient.mobile,
      },
    });
  } catch (error) {
    console.error("Patient registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
    });
  }
});

export default router;