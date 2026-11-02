

import mongoose from "mongoose";
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


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clinic ID.",
      });
    }

    // Find active clinic by ID
    const clinic = await Clinic.findOne({
      _id: id,
      isActive: true,
    });

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Clinic details fetched successfully.",
      clinic,
    });
  } catch (error) {
    console.error("Fetch clinic details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch clinic details.",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate clinic ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clinic ID.",
      });
    }

    // 2. Extract update fields
    const {
      name,
      address,
      city,
      state,
      pincode,
      phone,
      specialties,
    } = req.body;

    // 3. Validate specialties if provided
    if (
      specialties !== undefined &&
      (!Array.isArray(specialties) ||
        specialties.length === 0 ||
        specialties.some(
          (item) => typeof item !== "string" || !item.trim()
        ))
    ) {
      return res.status(400).json({
        success: false,
        message: "Specialties must be a non-empty array of strings.",
      });
    }

    // 4. Build update object using only allowed fields
    const updates: Record<string, unknown> = {};

    const fields = {
      name,
      address,
      city,
      state,
      pincode,
      phone,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        if (typeof value !== "string" || !value.trim()) {
          return res.status(400).json({
            success: false,
            message: `${key} must be a non-empty string.`,
          });
        }

        updates[key] = value.trim();
      }
    }

    if (specialties !== undefined) {
      updates.specialties = specialties.map(
        (item: string) => item.trim()
      );
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update.",
      });
    }

    // 5. Update clinic
    const updatedClinic = await Clinic.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedClinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Clinic updated successfully.",
      clinic: updatedClinic,
    });
  } catch (error) {
    console.error("Update clinic error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update clinic.",
    });
  }
});

router.patch("/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clinic ID.",
      });
    }

    // 2. Find active clinic and deactivate it
    const clinic = await Clinic.findOneAndUpdate(
      {
        _id: id,
        isActive: true,
      },
      {
        $set: { isActive: false },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // 3. Check whether clinic exists
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Active clinic not found.",
      });
    }

    // 4. Return updated clinic
    return res.status(200).json({
      success: true,
      message: "Clinic deactivated successfully.",
      clinic,
    });
  } catch (error) {
    console.error("Deactivate clinic error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate clinic.",
    });
  }
});



export default router;
