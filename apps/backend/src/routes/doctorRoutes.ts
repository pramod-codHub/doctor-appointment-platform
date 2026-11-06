import express from "express";
import mongoose from "mongoose";
import Doctor from "../models/Doctor";
import Clinic from "../models/Clinic";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      specialty,
      qualification,
      experience,
      clinics,
    } = req.body;

    // 1. Validate required fields
    if (
      !name?.trim() ||
      !mobile?.trim() ||
      !specialty?.trim() ||
      !qualification?.trim() ||
      experience === undefined ||
      !Array.isArray(clinics) ||
      clinics.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required doctor details.",
      });
    }

    // 2. Validate mobile number
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number.",
      });
    }

    // 3. Validate experience
    if (
      typeof experience !== "number" ||
      !Number.isFinite(experience) ||
      experience < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a valid non-negative number.",
      });
    }

    // 4. Check whether doctor already exists
    const existingDoctor = await Doctor.findOne({ mobile });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "Doctor with this mobile number already exists.",
      });
    }

    // 5. Validate clinic IDs and consultation fees
    for (const item of clinics) {
      if (
        !mongoose.Types.ObjectId.isValid(item.clinic) ||
        typeof item.consultationFee !== "number" ||
        !Number.isFinite(item.consultationFee) ||
        item.consultationFee < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid clinic ID or consultation fee.",
        });
      }
    }

    // 6. Check whether all clinics exist and are active
    const clinicIds = clinics.map((item) => item.clinic);

    const activeClinics = await Clinic.find({
      _id: { $in: clinicIds },
      isActive: true,
    });

    if (activeClinics.length !== new Set(clinicIds.map(String)).size) {
      return res.status(400).json({
        success: false,
        message: "One or more clinics are invalid or inactive.",
      });
    }

    // 7. Create doctor
    const doctor = await Doctor.create({
      name: name.trim(),
      mobile,
      email,
      specialty: specialty.trim(),
      qualification: qualification.trim(),
      experience,
      clinics,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully.",
      doctor,
    });
  } catch (error) {
    console.error("Create doctor error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register doctor.",
    });
  }
});

router.get("/clinic/:clinicId", async (req, res) => {
  try {
    const { clinicId } = req.params;

    // 1. Validate clinic ID
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clinic ID.",
      });
    }

    // 2. Check whether clinic exists and is active
    const clinic = await Clinic.findOne({
      _id: clinicId,
      isActive: true,
    });

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Active clinic not found.",
      });
    }

    // 3. Find active doctors associated with this clinic
    const doctors = await Doctor.find({
      isActive: true,
      "clinics.clinic": clinicId,
    }).populate(
      "clinics.clinic",
      "name address city state"
    );

    // 4. Return doctors
    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully.",
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Fetch doctors by clinic error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctors.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const specialty = req.query.specialty;

    // 1. Validate specialty query
    if (
      specialty !== undefined &&
      (typeof specialty !== "string" || !specialty.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid specialty.",
      });
    }

    // 2. Build filter
    const filter: {
      isActive: boolean;
      specialty?: string;
    } = {
      isActive: true,
    };

    if (typeof specialty === "string") {
      filter.specialty = specialty.trim();
    }

    // 3. Fetch doctors
    const doctors = await Doctor.find(filter)
      .populate("clinics.clinic", "name address city state")
      .sort({ createdAt: -1 });

    // 4. Return response
    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully.",
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Fetch doctors error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctors.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    // 2. Find active doctor
    const doctor = await Doctor.findOne({
      _id: id,
      isActive: true,
    }).populate(
      "clinics.clinic",
      "name address city state pincode"
    );

    // 3. Check doctor existence
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    // 4. Return doctor details
    return res.status(200).json({
      success: true,
      message: "Doctor details fetched successfully.",
      doctor,
    });

  } catch (error) {
    console.error("Fetch doctor details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor details.",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate doctor ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const {
      name,
      mobile,
      email,
      specialty,
      qualification,
      experience,
      clinics,
    } = req.body;

    // 2. Find existing active doctor
    const existingDoctor = await Doctor.findOne({
      _id: id,
      isActive: true,
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    // 3. Validate text fields
    const textFields = {
      name,
      mobile,
      email,
      specialty,
      qualification,
    };

    for (const [key, value] of Object.entries(textFields)) {
      if (value !== undefined) {
        if (
          typeof value !== "string" ||
          (key !== "email" && !value.trim())
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${key}.`,
          });
        }
      }
    }

    if (
      mobile !== undefined &&
      !/^\d{10}$/.test(mobile)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number.",
      });
    }

    // 4. Validate experience
    if (
      experience !== undefined &&
      (
        typeof experience !== "number" ||
        !Number.isFinite(experience) ||
        experience < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a valid non-negative number.",
      });
    }

    // 5. Check duplicate mobile
    if (mobile !== undefined && mobile !== existingDoctor.mobile) {
      const duplicateDoctor = await Doctor.findOne({
        mobile,
        _id: { $ne: id },
      });

      if (duplicateDoctor) {
        return res.status(409).json({
          success: false,
          message: "Doctor with this mobile number already exists.",
        });
      }
    }

    // 6. Validate clinic associations
    if (clinics !== undefined) {
      if (!Array.isArray(clinics) || clinics.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide at least one clinic.",
        });
      }

      for (const item of clinics) {
        if (
          !mongoose.Types.ObjectId.isValid(item.clinic) ||
          typeof item.consultationFee !== "number" ||
          !Number.isFinite(item.consultationFee) ||
          item.consultationFee < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid clinic ID or consultation fee.",
          });
        }
      }

      const clinicIds = clinics.map((item) => item.clinic);

      const activeClinics = await Clinic.find({
        _id: { $in: clinicIds },
        isActive: true,
      });

      if (
        activeClinics.length !==
        new Set(clinicIds.map(String)).size
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more clinics are invalid or inactive.",
        });
      }
    }

    // 7. Build update object
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(textFields)) {
      if (value !== undefined) {
        updates[key] =
          typeof value === "string" ? value.trim() : value;
      }
    }

    if (experience !== undefined) {
      updates.experience = experience;
    }

    if (clinics !== undefined) {
      updates.clinics = clinics;
    }

    // 8. Update doctor
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate(
      "clinics.clinic",
      "name address city state"
    );

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully.",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Update doctor error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update doctor.",
    });
  }
});

export default router;