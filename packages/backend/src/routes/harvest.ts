import { Router } from "express";
import multer from "multer";
import {
  createFarm,
  getMyFarms,
  submitHarvest,
  uploadHarvestPhotos,
  getMyHarvests,
  getPendingHarvests,
  verifyHarvest,
  getFarmerDashboard,
  getVerifierDashboard,
  createFarmValidation,
  submitHarvestValidation,
  verifyHarvestValidation,
} from "../controllers/harvestController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/errorHandler.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },
});

router.post(
  "/farms",
  authenticate,
  authorize("farmer"),
  createFarmValidation,
  handleValidationErrors,
  createFarm
);

router.get("/farms", authenticate, getMyFarms);

router.post(
  "/harvests",
  authenticate,
  authorize("farmer"),
  submitHarvestValidation,
  handleValidationErrors,
  submitHarvest
);

router.get("/harvests", authenticate, getMyHarvests);

router.post(
  "/harvests/:harvestId/photos",
  authenticate,
  authorize("farmer"),
  upload.array("photos", 5),
  uploadHarvestPhotos
);

router.get(
  "/verifier/pending",
  authenticate,
  authorize("verifier", "admin"),
  getPendingHarvests
);

router.post(
  "/verifier/verify",
  authenticate,
  authorize("verifier", "admin"),
  verifyHarvestValidation,
  handleValidationErrors,
  verifyHarvest
);

router.get("/dashboard/farmer", authenticate, authorize("farmer"), getFarmerDashboard);
router.get("/dashboard/verifier", authenticate, authorize("verifier", "admin"), getVerifierDashboard);

export default router;
