import { Router, Request, Response } from "express";
import multer from "multer";
import { uploadBuffer } from "../services/cloudinary.js";
import { authenticate } from "../middleware/auth.js";

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
  "/upload",
  authenticate,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const folder = (req.body.folder as string) || "harvest-hero/general";
      const url = await uploadBuffer(
        req.file.buffer,
        folder,
        `${Date.now()}-${req.file.originalname}`
      );

      res.json({ success: true, data: { url } });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
