
import { Router } from "express";
import mongoose from "mongoose";

import Appointment from "../models/Appointment";
import Doctor from "../models/Doctor";
import Clinic from "../models/Clinic";
import Patient from "../models/Patient";
import DoctorAvailability from "../models/DoctorAvailability";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();


// GET: Fetch appointments of the logged-in patient
router.get("/my-appointments", authenticateToken, async (req, res) => {
  try {
    // 1. Get logged-in patient ID from JWT middleware
    const patientId = res.locals.patientId;

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: "Patient authentication required.",
      });
    }

    // 2. Find appointments belonging to this patient
    const appointments = await Appointment.find({
      patient: patientId,
    })
      // 3. Get doctor details instead of only doctor ID
      .populate("doctor", "name specialty qualification experience")

      // 4. Get clinic details instead of only clinic ID
      .populate("clinic", "name address city state pincode")

      // 5. Show newest appointments first
      .sort({
        appointmentDate: -1,
        startTime: 1,
      });

    // 6. Return appointments
    return res.status(200).json({
      success: true,
      message: "Patient appointments fetched successfully.",
      count: appointments.length,
      appointments,
    });

  } catch (error) {
    console.error("Fetch patient appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient appointments.",
    });
  }
});


// POST: Patient requests an appointment
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      doctorId,
      clinicId,
      appointmentDate,
      startTime,
      reason,
    } = req.body;

    // 1. Get logged-in patient ID from JWT middleware
    const patientId = res.locals.patientId;

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: "Patient authentication required.",
      });
    }

    // 2. Validate required fields
    if (
      !doctorId ||
      !clinicId ||
      !appointmentDate ||
      !startTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide doctorId, clinicId, appointmentDate and startTime.",
      });
    }

    // 3. Validate MongoDB IDs
    if (
      !mongoose.Types.ObjectId.isValid(doctorId) ||
      !mongoose.Types.ObjectId.isValid(clinicId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID or clinic ID.",
      });
    }

    // 4. Validate date format and calendar date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(appointmentDate)) {
      return res.status(400).json({
        success: false,
        message: "Date must be in YYYY-MM-DD format.",
      });
    }

    const [year, month, day] = appointmentDate
      .split("-")
      .map(Number);

    const selectedDate = new Date(
      Date.UTC(year, month - 1, day)
    );

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

    // 5. Validate appointment time
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(startTime)) {
      return res.status(400).json({
        success: false,
        message: "Start time must be in HH:mm format.",
      });
    }

    // 6. Find logged-in patient
    const patient = await Patient.findById(patientId);

    if (!patient || !patient.isMobileVerified) {
      return res.status(404).json({
        success: false,
        message: "Verified patient not found.",
      });
    }

    // 7. Find active doctor
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

    // 8. Find active clinic
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

    // 9. Verify doctor-clinic association
    const worksAtClinic = doctor.clinics.some(
      (item) => item.clinic.toString() === clinicId
    );

    if (!worksAtClinic) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not associated with this clinic.",
      });
    }

    // 10. Find doctor's schedule for selected weekday
    const dayOfWeek = selectedDate.getUTCDay();

    const schedule = await DoctorAvailability.findOne({
      doctor: doctorId,
      clinic: clinicId,
      dayOfWeek,
      isAvailable: true,
    });

    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not available on this date.",
      });
    }

    // 11. Convert time to minutes
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const requestedStart = toMinutes(startTime);
    const scheduleStart = toMinutes(schedule.startTime);
    const scheduleEnd = toMinutes(schedule.endTime);

    const duration = schedule.slotDurationMinutes;
    const requestedEnd = requestedStart + duration;

    // 12. Check whether selected time is a valid slot
    const isWithinWorkingHours =
      requestedStart >= scheduleStart &&
      requestedEnd <= scheduleEnd;

    const isCorrectSlot =
      (requestedStart - scheduleStart) % duration === 0;

    if (!isWithinWorkingHours || !isCorrectSlot) {
      return res.status(400).json({
        success: false,
        message: "Selected time is not a valid appointment slot.",
      });
    }

    // 13. Check break overlap
    if (schedule.breakStartTime && schedule.breakEndTime) {
      const breakStart = toMinutes(schedule.breakStartTime);
      const breakEnd = toMinutes(schedule.breakEndTime);

      const overlapsBreak =
        requestedStart < breakEnd &&
        requestedEnd > breakStart;

      if (overlapsBreak) {
        return res.status(400).json({
          success: false,
          message: "Selected time overlaps with doctor's break.",
        });
      }
    }

    // 14. Create appointment
    // The database unique index prevents duplicate active bookings.
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      clinic: clinicId,
      appointmentDate,
      startTime,
      endTime: (() => {
        const hours = Math.floor(requestedEnd / 60);
        const minutes = requestedEnd % 60;

        return `${String(hours).padStart(2, "0")}:${String(
          minutes
        ).padStart(2, "0")}`;
      })(),
      status: "pending",
      reason,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment request submitted successfully.",
      appointment,
    });

  } catch (error: any) {
    // Duplicate active appointment slot
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot is already reserved.",
      });
    }

    console.error("Create appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create appointment.",
    });
  }
});

export default router;
