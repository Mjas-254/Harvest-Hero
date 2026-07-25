import { expect } from "chai";
import { ethers } from "hardhat";
import { HarvestHero } from "../typechain-types";

describe("HarvestHero", function () {
  let contract: HarvestHero;
  let deployer: any;
  let farmer: any;
  let verifier: any;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

  beforeEach(async function () {
    [deployer, farmer, verifier] = await ethers.getSigners();
    const HarvestHero = await ethers.getContractFactory("HarvestHero");
    contract = await HarvestHero.deploy();
    await contract.waitForDeployment();

    await contract.grantRole(MINTER_ROLE, deployer.address);
    await contract.grantRole(VERIFIER_ROLE, verifier.address);
  });

  it("Should record a harvest", async function () {
    const tx = await contract.recordHarvest(
      farmer.address,
      "Cassava",
      500,
      "A",
      Math.floor(Date.now() / 1000)
    );
    const receipt = await tx.wait();
    expect(receipt?.status).to.equal(1);

    const stats = await contract.getFarmerStats(farmer.address);
    expect(stats.totalHarvests).to.equal(1);
  });

  it("Should verify a harvest", async function () {
    const tx = await contract.recordHarvest(
      farmer.address,
      "Maize",
      200,
      "B",
      Math.floor(Date.now() / 1000)
    );
    await tx.wait();

    const verifyTx = await contract.connect(verifier).verifyHarvest(1, true);
    await verifyTx.wait();

    const harvest = await contract.harvests(1);
    expect(harvest.verified).to.equal(true);
  });

  it("Should mint a reward", async function () {
    const tx = await contract.mintReward(farmer.address, 100);
    const receipt = await tx.wait();

    const stats = await contract.getFarmerStats(farmer.address);
    expect(stats[2]).to.equal(100);
    expect(stats[3]).to.equal(1);
  });
});
