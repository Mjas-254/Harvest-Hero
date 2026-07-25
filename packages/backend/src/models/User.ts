import { createCollectionModel } from "../db/localStore.js";

export type UserRole = "farmer" | "verifier" | "buyer" | "admin";

export interface IUser {
  _id: string;
  name: string;
  phone: string;
  pin: string;
  role: UserRole;
  cooperativeId?: string;
  walletAddress?: string;
  avatarUrl?: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  save?: () => Promise<void>;
}

export const User = createCollectionModel("users");
