import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import patientRoutes from "./routes/patientRoutes";

dotenv.config();

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

async function startServer() {
  try {
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