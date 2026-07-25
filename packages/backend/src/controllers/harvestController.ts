import { Response } from "express";
import { body, param, validationResult } from "express-validator";
import { Farm, Harvest, User, Reward } from "../models/index.js";
import { type AuthRequest } from "../middleware/auth.js";
import { uploadBuffer } from "../services/cloudinary.js";
import {
  recordHarvestOnChain,
  verifyHarvestOnChain,
  mintRewardOnChain,
} from "../services/blockchain.js";
import { config } from "../config/index.js";

export const createFarmValidation = [
  body("name").trim().notEmpty().withMessage("Farm name is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("areaHectares").isNumeric().withMessage("Area must be a number"),
  body("crops").isArray({ min: 1 }).withMessage("At least one crop is required"),
];

export const submitHarvestValidation = [
  body("farmId").trim().notEmpty().withMessage("Farm is required"),
  body("cropType").trim().notEmpty().withMessage("Crop type is required"),
  body("quantity").isNumeric().withMessage("Quantity must be a number"),
  body("unit").optional().trim(),
  body("qualityGrade").optional().isIn(["A", "B", "C"]),
  body("harvestDate").isISO8601().withMessage("Valid harvest date required"),
  body("notes").optional().trim(),
];

export const verifyHarvestValidation = [
  body("harvestId").trim().notEmpty().withMessage("Harvest ID is required"),
  body("approved").isBoolean().withMessage("Approved flag required"),
  body("rejectionReason").optional().trim(),
  body("qualityGrade").optional().isIn(["A", "B", "C"]),
];

export async function createFarm(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: "Validation failed", details: errors.array() });
    return;
  }

  try {
    const { name, location, areaHectares, crops } = req.body;
    const farm = await Farm.create({
      ownerId: req.user!._id,
      name,
      location,
      areaHectares,
      crops,
      cooperativeId: req.user!.cooperativeId || "",
    });

    res.status(201).json({ success: true, data: farm });
  } catch (error) {
    console.error("Create farm error:", error);
    res.status(500).json({ error: "Failed to create farm" });
  }
}

export async function getMyFarms(req: AuthRequest, res: Response): Promise<void> {
  try {
    const farms = await Farm.find({ ownerId: req.user!._id });
    res.json({ success: true, data: farms });
  } catch (error) {
    res.status(500).json({ error: "Failed to get farms" });
  }
}

export async function submitHarvest(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: "Validation failed", details: errors.array() });
    return;
  }

  try {
    const { farmId, cropType, quantity, unit, qualityGrade, harvestDate, notes, photoUrls } =
      req.body;

    const farm = await Farm.findOne({ _id: farmId, ownerId: req.user!._id });
    if (!farm) {
      res.status(404).json({ error: "Farm not found" });
      return;
    }

    const grade = qualityGrade || "B";

    const harvest = await Harvest.create({
      farmerId: req.user!._id,
      farmId,
      cropType,
      quantity,
      unit: unit || "kg",
      qualityGrade: grade,
      harvestDate: new Date(harvestDate),
      notes: notes || "",
      photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
      status: "verified",
      verifiedAt: new Date(),
      verifiedBy: req.user!._id,
    });

    const basePoints = 10;
    const gradeBonus = grade === "A" ? 20 : grade === "B" ? 10 : 0;
    const totalPoints = basePoints + gradeBonus;

    await Reward.create({
      farmerId: req.user!._id,
      harvestId: harvest._id,
      rewardType: "harvest_nft",
      points: totalPoints,
      status: "minted",
      mintedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: harvest,
      reward: { points: totalPoints, message: `You earned ${totalPoints} points!` },
    });
  } catch (error) {
    console.error("Submit harvest error:", error);
    res.status(500).json({ error: "Failed to submit harvest" });
  }
}

export async function uploadHarvestPhotos(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { harvestId } = req.params;
    const harvest = await Harvest.findOne({
      _id: harvestId,
      farmerId: req.user!._id,
    });

    if (!harvest) {
      res.status(404).json({ error: "Harvest not found" });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No photos uploaded" });
      return;
    }

    const photoUrls: string[] = [];
    for (const file of files) {
      const url = await uploadBuffer(
        file.buffer,
        `harvest-hero/harvests/${harvestId}`,
        `${Date.now()}-${file.originalname}`
      );
      photoUrls.push(url);
    }

    harvest.photoUrls = [...harvest.photoUrls, ...photoUrls];
    await harvest.save();

    res.json({ success: true, data: { photoUrls: harvest.photoUrls } });
  } catch (error) {
    console.error("Upload photos error:", error);
    res.status(500).json({ error: "Failed to upload photos" });
  }
}

export async function getMyHarvests(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const skip = (page - 1) * limit;

    const [harvests, total] = await Promise.all([
      Harvest.find({ farmerId: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("farmId", "name"),
      Harvest.countDocuments({ farmerId: req.user!._id }),
    ]);

    res.json({
      success: true,
      data: harvests,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get harvests" });
  }
}

export async function getPendingHarvests(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { status: "submitted" };
    if (req.user!.cooperativeId) {
      filter.cooperativeId = req.user!.cooperativeId;
    }

    const [harvests, total] = await Promise.all([
      Harvest.find(filter)
        .sort({ submittedAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("farmerId", "name phone")
        .populate("farmId", "name location"),
      Harvest.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: harvests,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get pending harvests" });
  }
}

export async function verifyHarvest(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: "Validation failed", details: errors.array() });
    return;
  }

  try {
    const { harvestId, approved, rejectionReason, qualityGrade } = req.body;

    const harvest = await Harvest.findById(harvestId);
    if (!harvest) {
      res.status(404).json({ error: "Harvest not found" });
      return;
    }
    if (harvest.status !== "submitted") {
      res.status(400).json({ error: "Harvest already processed" });
      return;
    }

    harvest.verifiedBy = req.user!._id;
    harvest.verifiedAt = new Date();

    if (approved) {
      harvest.status = "verified";
      if (qualityGrade) harvest.qualityGrade = qualityGrade;

      // Get farmer's wallet address (use relayer as default for MVP)
      const farmer = await User.findById(harvest.farmerId);
      const farmerAddress = farmer?.walletAddress || config.defaultWalletAddress;

      // 1. Record harvest on-chain
      try {
        const harvestDate = Math.floor(new Date(harvest.harvestDate).getTime() / 1000);
        const recordResult = await recordHarvestOnChain(
          farmerAddress,
          harvest.cropType,
          Math.floor(harvest.quantity * 100), // Store as scaled integer
          harvest.qualityGrade,
          harvestDate
        );
        harvest.blockchainTxHash = recordResult.txHash;
        harvest.tokenId = recordResult.tokenId;

        // 2. Verify harvest on-chain
        await verifyHarvestOnChain(recordResult.tokenId, true);
      } catch (chainError) {
        console.error("Blockchain recording failed:", chainError);
        // Continue with DB-only flow — blockchain is best-effort for MVP
      }

      // 3. Calculate points: 10 base + 20 for A, +10 for B
      const basePoints = 10;
      const gradeBonus = harvest.qualityGrade === "A" ? 20 : harvest.qualityGrade === "B" ? 10 : 0;
      const totalPoints = basePoints + gradeBonus;

      // 4. Mint reward on-chain
      let rewardTxHash = "";
      let rewardTokenId: number | undefined;
      try {
        const rewardResult = await mintRewardOnChain(farmerAddress, totalPoints);
        rewardTxHash = rewardResult.txHash;
        rewardTokenId = rewardResult.tokenId;
      } catch (chainError) {
        console.error("Reward minting failed:", chainError);
      }

      // 5. Create reward document in MongoDB
      await Reward.create({
        farmerId: harvest.farmerId,
        harvestId: harvest._id,
        rewardType: "harvest_nft",
        points: totalPoints,
        tokenId: rewardTokenId,
        txHash: rewardTxHash,
        status: rewardTxHash ? "minted" : "pending",
        mintedAt: rewardTxHash ? new Date() : undefined,
      });
    } else {
      harvest.status = "rejected";
      harvest.rejectionReason = rejectionReason || "Not approved";
    }

    await harvest.save();

    res.json({
      success: true,
      data: harvest,
      message: approved ? "Harvest verified" : "Harvest rejected",
    });
  } catch (error) {
    console.error("Verify harvest error:", error);
    res.status(500).json({ error: "Failed to verify harvest" });
  }
}

export async function getFarmerDashboard(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const farmerId = req.user!._id;

    const [totalHarvests, verifiedHarvests, pendingHarvests, rewardDocs, farms] =
      await Promise.all([
        Harvest.countDocuments({ farmerId }),
        Harvest.countDocuments({ farmerId, status: "verified" }),
        Harvest.countDocuments({ farmerId, status: "submitted" }),
        Reward.find({ farmerId, status: { $in: ["minted", "claimed"] } }),
        Farm.countDocuments({ ownerId: farmerId }),
      ]);

    const totalPoints = rewardDocs.reduce((sum: number, r: any) => sum + r.points, 0);

    res.json({
      success: true,
      data: {
        totalHarvests,
        verifiedHarvests,
        pendingHarvests,
        totalPoints,
        farms,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get dashboard" });
  }
}

export async function getVerifierDashboard(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const filter: Record<string, unknown> = {};
    if (req.user!.cooperativeId) {
      filter.cooperativeId = req.user!.cooperativeId;
    }

    const [pending, verifiedToday, totalFarmers] = await Promise.all([
      Harvest.countDocuments({ ...filter, status: "submitted" }),
      Harvest.countDocuments({
        ...filter,
        status: "verified",
        verifiedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      User.countDocuments({ role: "farmer", cooperativeId: req.user!.cooperativeId || { $exists: true } }),
    ]);

    res.json({
      success: true,
      data: { pending, verifiedToday, totalFarmers },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get verifier dashboard" });
  }
}
