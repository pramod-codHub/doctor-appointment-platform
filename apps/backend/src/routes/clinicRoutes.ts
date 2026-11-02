
import { Router } from "express";
import Clinic from "../models/Clinic";

const router = Router();

// GET /api/clinics

router.get("/", async (req, res) => {
  try {
    // Read specialty from query parameters
    const specialty = req.query.specialty;

    // Validate specialty if provided
    if (
      specialty !== undefined &&
      (typeof specialty !== "string" || !specialty.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid specialty.",
      });
    }

    // Build MongoDB filter
    const filter: {
      isActive: boolean;
      specialties?: string;
    } = {
      isActive: true,
    };

    // Add specialty filter when provided
    if (typeof specialty === "string") {
      filter.specialties = specialty.trim();
    }

    // Fetch matching clinics
    const clinics = await Clinic.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Clinics fetched successfully.",
      count: clinics.length,
      clinics,
    });
  } catch (error) {
    console.error("Fetch clinics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch clinics.",
    });
  }
});



router.post("/", async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      pincode,
      phone,
      specialties,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !phone ||
      !Array.isArray(specialties) ||
      specialties.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required clinic details.",
      });
    }

    // Create clinic document
    const clinic = await Clinic.create({
      name,
      address,
      city,
      state,
      pincode,
      phone,
      specialties,
    });

    return res.status(201).json({
      success: true,
      message: "Clinic created successfully.",
      clinic,
    });
  } catch (error) {
    console.error("Create clinic error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create clinic.",
    });
  }
});


export default router;
