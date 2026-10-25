
import jwt from "jsonwebtoken";

export interface AuthTokenPayload extends jwt.JwtPayload {
  patientId: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

export function generateAuthToken(patientId: string): string {
  const expiresIn = (
    process.env.JWT_EXPIRES_IN || "1d"
  ) as jwt.SignOptions["expiresIn"];

  return jwt.sign({ patientId }, getJwtSecret(), {
    expiresIn,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (
    typeof decoded === "string" ||
    typeof decoded.patientId !== "string"
  ) {
    throw new Error("Invalid authentication token.");
  }

  return decoded as AuthTokenPayload;
}
