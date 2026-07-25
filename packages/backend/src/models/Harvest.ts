import { createCollectionModel } from "../db/localStore.js";

export type HarvestStatus = "submitted" | "verified" | "rejected" | "rewarded";

export interface IHarvest {
  _id: string;
  farmerId: string;
  farmId: string;
  cropType: string;
  quantity: number;
  unit: string;
  qualityGrade: "A" | "B" | "C";
  harvestDate: Date;
  photoUrls: string[];
  notes: string;
  status: HarvestStatus;
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  blockchainTxHash?: string;
  tokenId?: number;
  createdAt: Date;
  updatedAt: Date;
  save?: () => Promise<void>;
}

export const Harvest = createCollectionModel("harvests");
