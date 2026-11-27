
import { Router } from "express";
import {
  createHash,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

import Patient from "../models/Patient";
import { generateAuthToken } from "../utils/jwt";

const router = Router();

const OTP_EXPIRY_MINUTES = 5;

// ========================================
// SEND OTP
// Works for both new and existing patients
// ========================================

router.post("/send", async (req, res) => {
  try {
    const { mobile } = req.body;

    // Validate mobile number
    if (
      typeof mobile !== "string" ||
      !/^\d{10}$/.test(mobile)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Find existing patient
    const patient = await Patient.findOne({ mobile });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found. Please register first.",
      });
    }

    // Generate a secure six-digit OTP
    const otp = randomInt(100000, 1000000).toString();

    // Store OTP hash instead of original OTP
    patient.otpHash = createHash("sha256")
      .update(otp)
      .digest("hex");

    // Set OTP expiry time
    patient.otpExpiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    // Reset OTP attempts
    patient.otpAttempts = 0;

    await patient.save();

    // Development only: print OTP in terminal
    console.log(
      `[DEV OTP] Mobile: ${mobile}, OTP: ${otp}`
    );

    return res.status(200).json({
      success: true,
      message: "Development OTP generated successfully.",
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error("OTP generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate OTP.",
    });
  }
});

// ========================================
// VERIFY OTP
// Works for both registration and login
// ========================================

router.post("/verify", async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // Validate mobile and OTP
    if (
      typeof mobile !== "string" ||
      !/^\d{10}$/.test(mobile) ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid mobile number and six-digit OTP.",
      });
    }

    // Find patient and retrieve hidden OTP fields
    const patient = await Patient.findOne({ mobile }).select(
      "+otpHash +otpExpiresAt"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    // Check whether OTP exists
    if (!patient.otpHash || !patient.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Please request a new OTP.",
      });
    }

    // Check OTP expiry
    if (patient.otpExpiresAt.getTime() <= Date.now()) {
      patient.otpHash = undefined;
      patient.otpExpiresAt = undefined;
      patient.otpAttempts = 0;

      await patient.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Check maximum OTP attempts
    if (patient.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    // Generate hash for submitted OTP
    const submittedHash = createHash("sha256")
      .update(otp)
      .digest("hex");

    const storedHashBuffer = Buffer.from(
      patient.otpHash,
      "hex"
    );

    const submittedHashBuffer = Buffer.from(
      submittedHash,
      "hex"
    );

    // Compare OTP hashes safely
    const isOtpValid =
      storedHashBuffer.length === submittedHashBuffer.length &&
      timingSafeEqual(
        storedHashBuffer,
        submittedHashBuffer
      );

    if (!isOtpValid) {
      patient.otpAttempts += 1;

      if (patient.otpAttempts >= 5) {
        patient.otpHash = undefined;
        patient.otpExpiresAt = undefined;
      }

      await patient.save();

      return res.status(
        patient.otpAttempts >= 5 ? 429 : 400
      ).json({
        success: false,
        message:
          patient.otpAttempts >= 5
            ? "Too many attempts. Please request a new OTP."
            : "Incorrect OTP. Please try again.",
      });
    }

    // OTP verified successfully
    // For new patients, mark mobile as verified.
    // For existing patients, keep it verified.

    patient.isMobileVerified = true;

    // Clear OTP information after successful verification
    patient.otpHash = undefined;
    patient.otpExpiresAt = undefined;
    patient.otpAttempts = 0;

    await patient.save();

    // Generate a fresh JWT token
    const token = generateAuthToken(
      patient._id.toString()
    );

    return res.status(200).json({
      success: true,
      message: "Mobile number verified successfully.",
      token,
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP.",
    });
  }
});

export default router;
