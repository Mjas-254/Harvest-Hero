import { Router, Response } from "express";
import { Harvest, User, Farm } from "../models/index.js";
import { getContract } from "../services/blockchain.js";

const router = Router();

router.get("/:identifier", async (req, res: Response) => {
  try {
    const { identifier } = req.params;

    // Try to find by tokenId first
    let harvest = null;
    const tokenId = parseInt(identifier);
    if (!isNaN(tokenId)) {
      harvest = await Harvest.findOne({ tokenId })
        .populate("farmerId", "name phone")
        .populate("farmId", "name location");
    }

    // Try by MongoDB _id
    if (!harvest) {
      harvest = await Harvest.findById(identifier)
        .populate("farmerId", "name phone")
        .populate("farmId", "name location");
    }

    // Try by blockchain txHash
    if (!harvest) {
      harvest = await Harvest.findOne({ blockchainTxHash: identifier })
        .populate("farmerId", "name phone")
        .populate("farmId", "name location");
    }

    // Try by harvestId string format
    if (!harvest && identifier.startsWith("HARVEST-")) {
      const num = parseInt(identifier.replace("HARVEST-", ""));
      if (!isNaN(num)) {
        harvest = await Harvest.findOne({ tokenId: num })
          .populate("farmerId", "name phone")
          .populate("farmId", "name location");
      }
    }

    if (!harvest) {
      res.status(404).json({ error: "Harvest not found" });
      return;
    }

    // Try to get on-chain data if tokenId exists
    let onChainData = null;
    if (harvest.tokenId && process.env.CONTRACT_ADDRESS) {
      try {
        const contract = getContract();
        const chainHarvest = await contract.harvests(harvest.tokenId);
        onChainData = {
          tokenId: Number(chainHarvest.id),
          farmer: chainHarvest.farmer,
          verified: chainHarvest.verified,
          rewardMinted: chainHarvest.rewardMinted,
          createdAt: Number(chainHarvest.createdAt),
        };
      } catch (e) {
        // On-chain query failed — return DB data only
      }
    }

    res.json({
      success: true,
      data: {
        harvest,
        onChain: onChainData,
      },
    });
  } catch (error) {
    console.error("Trace error:", error);
    res.status(500).json({ error: "Failed to trace harvest" });
  }
});

export default router;
