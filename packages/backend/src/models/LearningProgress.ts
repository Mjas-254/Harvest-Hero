import { createCollectionModel } from "../db/localStore.js";

export interface ILearningProgress {
  _id: string;
  farmerId: string;
  articleId: string;
  completed: boolean;
  createdAt: Date;
}

export const LearningProgress = createCollectionModel("learning_progress");
