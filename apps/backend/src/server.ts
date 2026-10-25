
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import patientRoutes from "./routes/patientRoutes";
import otpRoutes from "./routes/otpRoutes";
import { authenticateToken } from "./middleware/authMiddleware";


// Explicitly load apps/backend/.env.
dotenv.config({
  path: "C:/doctor-appointment-platform/apps/backend/.env",
});

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Appointment API is running",
  });
});

app.use("/api/patients", patientRoutes);
app.use("/api/otp", otpRoutes);

app.get("/api/protected", authenticateToken, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "You have accessed a protected route.",
  });
});

async function startServer() {
  try {
    console.log(
      "JWT_SECRET loaded:",
      Boolean(process.env.JWT_SECRET)
    );

    console.log(
      "JWT_EXPIRES_IN:",
      process.env.JWT_EXPIRES_IN
    );

    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
