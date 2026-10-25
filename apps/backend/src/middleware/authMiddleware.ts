
import type { RequestHandler } from "express";
import { verifyAuthToken } from "../utils/jwt";

export const authenticateToken: RequestHandler = (
  req,
  res,
  next
) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required.",
    });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required.",
    });
    return;
  }

  try {
    const payload = verifyAuthToken(token);

    // Make the authenticated patient's ID available to the route.
    res.locals.patientId = payload.patientId;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};
