import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { User, type IUser } from "../models/index.js";
import { config } from "../config/index.js";
import { generateToken, type AuthRequest } from "../middleware/auth.js";

export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("pin")
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage("PIN must be 4-6 digits"),
  body("role").optional().isIn(["farmer"]),
  body("cooperativeId").optional().trim(),
  body("language").optional().trim(),
];

export const loginValidation = [
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("pin").notEmpty().withMessage("PIN is required"),
];

export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: "Validation failed", details: errors.array() });
    return;
  }

  try {
    const { name, phone, pin, role, cooperativeId, language } = req.body;

    const existing = await User.findOne({ phone });
    if (existing) {
      res.status(409).json({ error: "Phone number already registered" });
      return;
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await User.create({
      name,
      phone,
      pin: hashedPin,
      role: role || "farmer",
      cooperativeId: cooperativeId || "",
      language: language || "en",
      walletAddress: config.defaultWalletAddress,
    });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: "Validation failed", details: errors.array() });
    return;
  }

  try {
    const { phone, pin } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      res.status(401).json({ error: "Invalid phone or PIN" });
      return;
    }

    const valid = await bcrypt.compare(pin, user.pin);
    if (!valid) {
      res.status(401).json({ error: "Invalid phone or PIN" });
      return;
    }

    const token = generateToken(user);
    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user: any = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { pin, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (error) {
    res.status(500).json({ error: "Failed to get profile" });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const allowed = ["name", "language", "avatarUrl", "walletAddress"];
    const updates: Record<string, string> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user: any = await User.findByIdAndUpdate(req.user?._id, updates, {
      new: true,
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { pin, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
}

function sanitizeUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    cooperativeId: user.cooperativeId,
    walletAddress: user.walletAddress,
    avatarUrl: user.avatarUrl,
    language: user.language,
  };
}
