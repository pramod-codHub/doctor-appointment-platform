
import { Router } from "express";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import Patient from "../models/Patient";
import { generateAuthToken } from "../utils/jwt";

const router = Router();

const OTP_EXPIRY_MINUTES = 5;

router.post("/send", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (
      typeof mobile !== "string" ||
      !/^\d{10}$/.test(mobile)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    const patient = await Patient.findOne({ mobile });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found. Please register first.",
      });
    }

    if (patient.isMobileVerified) {
      return res.status(400).json({
        success: false,
        message: "This mobile number is already verified.",
      });
    }

    // Generate a cryptographically secure six-digit OTP.
    const otp = randomInt(100000, 1000000).toString();

    // Store a hash, not the original OTP.
    patient.otpHash = createHash("sha256")
      .update(otp)
      .digest("hex");

    patient.otpExpiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    patient.otpAttempts = 0;

    await patient.save();

    // Development only: never log OTPs in production.
    console.log(`[DEV OTP] Mobile: ${mobile}, OTP: ${otp}`);

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


router.post("/verify", async (req, res) => {
  try {
    const { mobile, otp } = req.body;

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

    const patient = await Patient.findOne({ mobile }).select(
      "+otpHash +otpExpiresAt"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    if (patient.isMobileVerified) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is already verified.",
      });
    }

    if (!patient.otpHash || !patient.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Please request a new OTP.",
      });
    }

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

    if (patient.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    const submittedHash = createHash("sha256")
      .update(otp)
      .digest("hex");

    const storedHashBuffer = Buffer.from(patient.otpHash, "hex");
    const submittedHashBuffer = Buffer.from(submittedHash, "hex");

    const isOtpValid =
      storedHashBuffer.length === submittedHashBuffer.length &&
      timingSafeEqual(storedHashBuffer, submittedHashBuffer);

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

    patient.isMobileVerified = true;
    patient.otpHash = undefined;
    patient.otpExpiresAt = undefined;
    patient.otpAttempts = 0;

    await patient.save();
    const token = generateAuthToken(patient._id.toString());

    return res.status(200).json({
      success: true,
      message: "Mobile number verified successfully.",
      token
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
