import { createCollectionModel } from "../db/localStore.js";

export type RedemptionMethod = "mobile_money" | "seeds" | "fertilizer" | "tools" | "vouchers";
export type RedemptionStatus = "pending" | "completed" | "cancelled";

export interface IRedemption {
  _id: string;
  farmerId: string;
  method: RedemptionMethod;
  pointsSpent: number;
  description: string;
  status: RedemptionStatus;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const Redemption = createCollectionModel("redemptions");
