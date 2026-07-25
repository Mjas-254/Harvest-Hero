import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getProfile,
  updateProfile,
  registerValidation,
  loginValidation,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/errorHandler.js";

const router = Router();

router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  register
);

router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  login
);

router.get("/profile", authenticate, getProfile);

router.put(
  "/profile",
  authenticate,
  [body("name").optional().trim(), body("language").optional().trim()],
  handleValidationErrors,
  updateProfile
);

export default router;
