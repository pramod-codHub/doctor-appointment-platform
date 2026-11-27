
import { Router } from "express";
import mongoose from "mongoose";

import Doctor from "../models/Doctor";
import Clinic from "../models/Clinic";
import DoctorAvailability from "../models/DoctorAvailability";

const router = Router();

// POST: Create doctor availability
router.post("/", async (req, res) => {
  try {
    const {
      doctorId,
      clinicId,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes,
      breakStartTime,
      breakEndTime,
    } = req.body;

    // 1. Validate required fields
    if (
      !doctorId ||
      !clinicId ||
      dayOfWeek === undefined ||
      !startTime ||
      !endTime ||
      slotDurationMinutes === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    // 2. Validate MongoDB IDs
    if (
      !mongoose.Types.ObjectId.isValid(doctorId) ||
      !mongoose.Types.ObjectId.isValid(clinicId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID or clinic ID.",
      });
    }

    // 3. Validate weekday and appointment duration
    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6
    ) {
      return res.status(400).json({
        success: false,
        message: "dayOfWeek must be a number between 0 and 6.",
      });
    }

    if (
      !Number.isInteger(slotDurationMinutes) ||
      slotDurationMinutes < 5 ||
      slotDurationMinutes > 240
    ) {
      return res.status(400).json({
        success: false,
        message: "Slot duration must be between 5 and 240 minutes.",
      });
    }

    // 4. Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (
      !timeRegex.test(startTime) ||
      !timeRegex.test(endTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Time must be in HH:mm format.",
      });
    }

    const start = Number(startTime.substring(0, 2)) * 60 +
      Number(startTime.substring(3, 5));

    const end = Number(endTime.substring(0, 2)) * 60 +
      Number(endTime.substring(3, 5));

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    // 5. Validate break time
    if (
      (breakStartTime && !breakEndTime) ||
      (!breakStartTime && breakEndTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide both break start and end times.",
      });
    }

    if (breakStartTime && breakEndTime) {
      if (
        !timeRegex.test(breakStartTime) ||
        !timeRegex.test(breakEndTime)
      ) {
        return res.status(400).json({
          success: false,
          message: "Break time must be in HH:mm format.",
        });
      }

      const breakStart =
        Number(breakStartTime.substring(0, 2)) * 60 +
        Number(breakStartTime.substring(3, 5));

      const breakEnd =
        Number(breakEndTime.substring(0, 2)) * 60 +
        Number(breakEndTime.substring(3, 5));

      if (
        breakStart < start ||
        breakEnd > end ||
        breakEnd <= breakStart
      ) {
        return res.status(400).json({
          success: false,
          message: "Break must be within working hours.",
        });
      }
    }

    // 6. Check active doctor
    const doctor = await Doctor.findOne({
      _id: doctorId,
      isActive: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Active doctor not found.",
      });
    }

    // 7. Check active clinic
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

    // 8. Check doctor works at this clinic
    const worksAtClinic = doctor.clinics.some(
      (item) => item.clinic.toString() === clinicId
    );

    if (!worksAtClinic) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not associated with this clinic.",
      });
    }

    // 9. Create availability
    const availability = await DoctorAvailability.create({
      doctor: doctorId,
      clinic: clinicId,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes,
      breakStartTime,
      breakEndTime,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor availability created successfully.",
      availability,
    });
  } catch (error: any) {
    // Duplicate doctor + clinic + weekday
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Availability already exists for this doctor, clinic, and day.",
      });
    }

    console.error("Create availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create doctor availability.",
    });
  }
});


// GET: Generate appointment slots for a doctor
router.get("/slots", async (req, res) => {
  try {
    const { doctorId, clinicId, date } = req.query;

    // 1. Validate query parameters
    if (
      typeof doctorId !== "string" ||
      typeof clinicId !== "string" ||
      typeof date !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "doctorId, clinicId and date are required.",
      });
    }

    // 2. Validate MongoDB IDs
    if (
      !mongoose.Types.ObjectId.isValid(doctorId) ||
      !mongoose.Types.ObjectId.isValid(clinicId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID or clinic ID.",
      });
    }

    // 3. Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must be in YYYY-MM-DD format.",
      });
    }

    const [year, month, day] = date.split("-").map(Number);

    const selectedDate = new Date(
      Date.UTC(year, month - 1, day)
    );

    // Reject invalid calendar dates
    if (
      selectedDate.getUTCFullYear() !== year ||
      selectedDate.getUTCMonth() !== month - 1 ||
      selectedDate.getUTCDate() !== day
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid calendar date.",
      });
    }

    // 4. Find weekday
    const dayOfWeek = selectedDate.getUTCDay();

    // 5. Check active doctor
    const doctor = await Doctor.findOne({
      _id: doctorId,
      isActive: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Active doctor not found.",
      });
    }

    // 6. Check active clinic
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

    // 7. Check doctor-clinic association
    const worksAtClinic = doctor.clinics.some(
      (item) => item.clinic.toString() === clinicId
    );

    if (!worksAtClinic) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not associated with this clinic.",
      });
    }

    // 8. Find schedule for selected weekday
    const schedule = await DoctorAvailability.findOne({
      doctor: doctorId,
      clinic: clinicId,
      dayOfWeek,
      isAvailable: true,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "No availability found for this date.",
      });
    }

    // 9. Convert HH:mm into minutes
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const toTimeString = (totalMinutes: number): string => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}`;
    };

    const start = toMinutes(schedule.startTime);
    const end = toMinutes(schedule.endTime);
    const duration = schedule.slotDurationMinutes;

    const breakStart = schedule.breakStartTime
      ? toMinutes(schedule.breakStartTime)
      : null;

    const breakEnd = schedule.breakEndTime
      ? toMinutes(schedule.breakEndTime)
      : null;

    // 10. Generate slots
    const slots: {
      startTime: string;
      endTime: string;
    }[] = [];

    for (
      let current = start;
      current + duration <= end;
      current += duration
    ) {
      const slotEnd = current + duration;

      // Skip slots overlapping the break
      const overlapsBreak =
        breakStart !== null &&
        breakEnd !== null &&
        current < breakEnd &&
        slotEnd > breakStart;

      if (!overlapsBreak) {
        slots.push({
          startTime: toTimeString(current),
          endTime: toTimeString(slotEnd),
        });
      }
    }

    // 11. Return generated slots
    return res.status(200).json({
      success: true,
      message: "Appointment slots generated successfully.",
      date,
      dayOfWeek,
      doctor: doctor.name,
      clinic: clinic.name,
      count: slots.length,
      slots,
    });
  } catch (error) {
    console.error("Generate slots error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate appointment slots.",
    });
  }
});


// GET: Get availability by doctor ID
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      isActive: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Active doctor not found.",
      });
    }

    const availability = await DoctorAvailability.find({
      doctor: doctorId,
      isAvailable: true,
    })
      .populate("clinic", "name address city state")
      .sort({ clinic: 1, dayOfWeek: 1 });

    return res.status(200).json({
      success: true,
      message: "Doctor availability fetched successfully.",
      count: availability.length,
      availability,
    });
  } catch (error) {
    console.error("Get availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor availability.",
    });
  }
});

export default router;
