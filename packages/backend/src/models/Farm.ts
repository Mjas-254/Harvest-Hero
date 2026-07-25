import { createCollectionModel } from "../db/localStore.js";

export interface IFarm {
  _id: string;
  ownerId: string;
  name: string;
  location: string;
  areaHectares: number;
  crops: string[];
  cooperativeId: string;
  createdAt: Date;
  updatedAt: Date;
  save?: () => Promise<void>;
}

export const Farm = createCollectionModel("farms");
