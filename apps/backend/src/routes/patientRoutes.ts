import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
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

router.get("/me", authenticateToken, async (_req, res) => {
  try {
    const patientId = res.locals.patientId;

    const patient = await Patient.findById(patientId).select(
      "-otpHash -otpExpiresAt"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient profile fetched successfully.",
      patient: {
        id: patient._id,
        name: patient.name,
        mobile: patient.mobile,
        isMobileVerified: patient.isMobileVerified,
        createdAt: patient.createdAt,
      },
    });
  } catch (error) {
    console.error("Fetch patient profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient profile.",
    });
  }
});

export default router;