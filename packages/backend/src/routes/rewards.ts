import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { Reward, Redemption } from "../models/index.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const REDEMPTION_OPTIONS: Record<string, { cost: number; description: string }> = {
  mobile_money_5: { cost: 50, description: "GHs 5 Mobile Money" },
  mobile_money_10: { cost: 100, description: "GHs 10 Mobile Money" },
  mobile_money_25: { cost: 250, description: "GHs 25 Mobile Money" },
  seeds: { cost: 80, description: "Seed Pack (2kg)" },
  fertilizer: { cost: 120, description: "Fertilizer Bag (5kg)" },
  tools: { cost: 200, description: "Farm Tool Set" },
  vouchers: { cost: 150, description: "Agricultural Store Voucher" },
};

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const rewards = await Reward.find({ farmerId: req.user!._id })
      .sort({ createdAt: -1 })
      .populate("harvestId", "cropType quantity unit");

    res.json({ success: true, data: rewards });
  } catch (error) {
    res.status(500).json({ error: "Failed to get rewards" });
  }
});

router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  try {
    const farmerId = req.user!._id;

    const rewards = await Reward.find({
      farmerId,
      status: { $in: ["minted", "claimed"] },
    });

    const redemptions = await Redemption.find({
      farmerId,
      status: { $in: ["pending", "completed"] },
    });

    const totalEarned = rewards.reduce((sum: number, r: any) => sum + r.points, 0);
    const totalRedeemed = redemptions.reduce((sum: number, r: any) => sum + r.pointsSpent, 0);
    const totalPoints = totalEarned - totalRedeemed;
    const totalNfts = rewards.filter((r: any) => r.rewardType === "harvest_nft").length;

    res.json({
      success: true,
      data: {
        totalPoints,
        totalEarned,
        totalRedeemed,
        totalNfts,
        recentRewards: rewards.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get reward stats" });
  }
});

router.get("/options", authenticate, (_req, res) => {
  res.json({
    success: true,
    data: Object.entries(REDEMPTION_OPTIONS).map(([key, val]) => ({
      id: key,
      cost: val.cost,
      description: val.description,
    })),
  });
});

router.get("/redemptions", authenticate, async (req: AuthRequest, res) => {
  try {
    const redemptions = await Redemption.find({ farmerId: req.user!._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: redemptions });
  } catch (error) {
    res.status(500).json({ error: "Failed to get redemptions" });
  }
});

router.post(
  "/redeem",
  authenticate,
  [body("optionId").trim().notEmpty().withMessage("Redemption option is required")],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: "Validation failed", details: errors.array() });
      return;
    }

    try {
      const { optionId } = req.body;
      const farmerId = req.user!._id;

      const option = REDEMPTION_OPTIONS[optionId];
      if (!option) {
        res.status(400).json({ error: "Invalid redemption option" });
        return;
      }

      const rewards = await Reward.find({
        farmerId,
        status: { $in: ["minted", "claimed"] },
      });
      const redemptions = await Redemption.find({
        farmerId,
        status: { $in: ["pending", "completed"] },
      });

      const totalEarned = rewards.reduce((sum: number, r: any) => sum + r.points, 0);
      const totalRedeemed = redemptions.reduce((sum: number, r: any) => sum + r.pointsSpent, 0);
      const available = totalEarned - totalRedeemed;

      if (available < option.cost) {
        res.status(400).json({
          error: "Not enough points",
          available,
          required: option.cost,
        });
        return;
      }

      const redemption = await Redemption.create({
        farmerId,
        method: optionId.startsWith("mobile_money") ? "mobile_money" :
                optionId === "seeds" ? "seeds" :
                optionId === "fertilizer" ? "fertilizer" :
                optionId === "tools" ? "tools" : "vouchers",
        pointsSpent: option.cost,
        description: option.description,
        status: "completed",
        reference: `RDM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      });

      res.json({
        success: true,
        data: redemption,
        remaining: available - option.cost,
      });
    } catch (error) {
      console.error("Redeem error:", error);
      res.status(500).json({ error: "Failed to redeem" });
    }
  }
);

export default router;
