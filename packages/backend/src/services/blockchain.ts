import { ethers } from "ethers";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let contract: ethers.Contract | null = null;
let relayerWallet: ethers.Wallet | null = null;

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(config.avalanche.rpcUrl);
}

function getRelayerWallet(): ethers.Wallet {
  if (!relayerWallet && config.avalanche.relayerPrivateKey) {
    relayerWallet = new ethers.Wallet(
      config.avalanche.relayerPrivateKey,
      getProvider()
    );
  }
  if (!relayerWallet) {
    throw new Error("Relayer private key not configured");
  }
  return relayerWallet;
}

function loadAbi(): any[] {
  try {
    const artifact = JSON.parse(
      readFileSync(join(__dirname, "..", "abi", "HarvestHero.json"), "utf-8")
    );
    return artifact.abi;
  } catch {
    console.warn("HarvestHero ABI not found — blockchain features disabled");
    return [];
  }
}

export function getContract(): ethers.Contract {
  if (!contract && config.avalanche.contractAddress && config.avalanche.relayerPrivateKey) {
    const abi = loadAbi();
    if (abi.length === 0) throw new Error("Contract ABI not available");
    const provider = getProvider();
    const wallet = getRelayerWallet();
    contract = new ethers.Contract(
      config.avalanche.contractAddress,
      abi,
      wallet.connect(provider)
    );
  }
  if (!contract) {
    throw new Error("Blockchain not configured");
  }
  return contract;
}

export async function recordHarvestOnChain(
  farmerAddress: string,
  cropType: string,
  quantity: number,
  qualityGrade: string,
  harvestDate: number
): Promise<{ txHash: string; tokenId: number }> {
  const c = getContract();
  const tx = await c.recordHarvest(
    farmerAddress,
    cropType,
    quantity,
    qualityGrade,
    harvestDate
  );
  const receipt = await tx.wait();

  let tokenId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = c.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      if (parsed?.name === "HarvestRecorded") {
        tokenId = Number(parsed.args.tokenId);
        break;
      }
    } catch {
      continue;
    }
  }

  return { txHash: receipt.hash, tokenId };
}

export async function mintRewardOnChain(
  farmerAddress: string,
  points: number
): Promise<{ txHash: string; tokenId: number }> {
  const c = getContract();
  const tx = await c.mintReward(farmerAddress, points);
  const receipt = await tx.wait();

  let tokenId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = c.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      if (parsed?.name === "RewardMinted") {
        tokenId = Number(parsed.args.tokenId);
        break;
      }
    } catch {
      continue;
    }
  }

  return { txHash: receipt.hash, tokenId };
}

export async function verifyHarvestOnChain(
  harvestId: number,
  verified: boolean
): Promise<string> {
  const c = getContract();
  const tx = await c.verifyHarvest(harvestId, verified);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getFarmerStats(farmerAddress: string) {
  const c = getContract();
  const stats = await c.getFarmerStats(farmerAddress);
  return {
    totalHarvests: Number(stats.totalHarvests),
    verifiedHarvests: Number(stats.verifiedHarvests),
    totalPoints: Number(stats.totalPoints),
    nftsOwned: Number(stats.nftsOwned),
  };
}
