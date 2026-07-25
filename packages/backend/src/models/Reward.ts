import { createCollectionModel } from "../db/localStore.js";

export type RewardStatus = "pending" | "minted" | "claimed" | "failed";

export interface IReward {
  _id: string;
  farmerId: string;
  harvestId: string;
  rewardType: "harvest_nft" | "quality_bonus" | "streak_bonus";
  points: number;
  tokenId?: number;
  txHash?: string;
  status: RewardStatus;
  mintedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  save?: () => Promise<void>;
}

export const Reward = createCollectionModel("rewards");
