import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: "path" in e ? e.path : "unknown",
        message: e.msg,
      })),
    });
    return;
  }
  next();
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
