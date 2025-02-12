import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const AdvancedNFT = await ethers.getContractFactory("AdvancedNFT");

  const CID = "bafybeifdswmxfa7uil7p7fmwfa5cinh6izjmpobpejbw5lxgnowysydl5y";

  const advancedNft = await AdvancedNFT.deploy(deployer.address, CID);

  await advancedNft.waitForDeployment();
  console.log("AdvancedNFT deployed to:", await advancedNft.getAddress());

  const mintPrice = ethers.parseEther("0.01");

  console.log("Adding deployer to whitelist...");
  const whitelistTx = await advancedNft.addToWhitelist(deployer.address);
  await whitelistTx.wait();

  console.log("Minting NFT...");
  const tx = await advancedNft
    .connect(deployer)
    .mintNFT(deployer.address, { value: mintPrice });
  await tx.wait();

  console.log("NFT minted successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
