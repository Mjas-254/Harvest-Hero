import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  jwtSecret: required("JWT_SECRET"),
  cloudinary: {
    cloudName: optional("CLOUDINARY_CLOUD_NAME", ""),
    apiKey: optional("CLOUDINARY_API_KEY", ""),
    apiSecret: optional("CLOUDINARY_API_SECRET", ""),
  },
  avalanche: {
    rpcUrl: optional("AVALANCHE_FUJI_RPC", "https://api.avax-test.network/ext/bc/C/rpc"),
    contractAddress: optional("CONTRACT_ADDRESS", ""),
    relayerPrivateKey: optional("RELAYER_PRIVATE_KEY", ""),
  },
  corsOrigins: optional("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(","),
  defaultWalletAddress: optional("DEFAULT_WALLET_ADDRESS", ""),
};
