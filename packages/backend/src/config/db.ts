import { loadDB } from "../db/localStore.js";

export async function connectDB(): Promise<void> {
  loadDB();
  console.log("Local JSON database loaded");
}

export async function disconnectDB(): Promise<void> {
  console.log("Local database shutdown");
}
