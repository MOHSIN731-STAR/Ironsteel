import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

console.log("JWT_SECRET loaded:", !!JWT_SECRET);

export function createToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "12h",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}