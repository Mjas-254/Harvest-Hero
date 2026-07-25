import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "AVAX");

  const HarvestHero = await ethers.getContractFactory("HarvestHero");
  const contract = await HarvestHero.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("HarvestHero deployed to:", address);

  const VERIFIER_ROLE = await contract.VERIFIER_ROLE();
  console.log("VERIFIER_ROLE:", VERIFIER_ROLE);

  console.log("\n--- Deployment Complete ---");
  console.log("Contract Address:", address);
  console.log("Network: Avalanche Fuji");
  console.log("Add this to your backend .env as CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
