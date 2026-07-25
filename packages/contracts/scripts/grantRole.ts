import hre, { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const relayerAddress = "0x83eFcd4ac673D88d54c9D89021F8831b76224a57";
  const contractAddress = "0x10311Bb33ec0A56Cab2567fC29A6CC3614051948";

  const HarvestHero = await ethers.getContractFactory("HarvestHero");
  const contract = HarvestHero.attach(contractAddress);

  const VERIFIER_ROLE = await contract.VERIFIER_ROLE();

  console.log("Granting VERIFIER_ROLE to relayer:", relayerAddress);
  const tx = await contract.grantRole(VERIFIER_ROLE, relayerAddress);
  await tx.wait();

  const hasRole = await contract.hasRole(VERIFIER_ROLE, relayerAddress);
  console.log("VERIFIER_ROLE granted:", hasRole);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
