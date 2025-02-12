import { AdvancedNFT } from "../typechain-types";
import { ethers as e } from "ethers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("AdvancedNFT", () => {
  let advancedNft: AdvancedNFT;
  let owner: e.Signer;
  let addr1: e.Signer;
  let addr2: e.Signer;

  const MINT_PRICE = ethers.parseEther("0.01");
  const BASE_IPFS_ID =
    "bafybeifdswmxfa7uil7p7fmwfa5cinh6izjmpobpejbw5lxgnowysydl5y";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const advancedNftFactory = await ethers.getContractFactory("AdvancedNFT");

    advancedNft = await advancedNftFactory.deploy(
      await owner.getAddress(),
      BASE_IPFS_ID
    );

    await advancedNft.waitForDeployment();
  });

  it("should deploy", async () => {
    expect(await advancedNft.owner()).to.equal(await owner.getAddress());
  });

  it("should mint an NFT successfully", async function () {
    await advancedNft.addToWhitelist(await addr1.getAddress());
    const tx = await advancedNft
      .connect(addr1)
      .mintNFT(await addr1.getAddress(), { value: MINT_PRICE });
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    const event = receipt.logs
      .map((log) => advancedNft.interface.parseLog(log))
      .find((parsedLog) => parsedLog && parsedLog.name === "NFTMinted");

    expect(event).to.not.be.undefined;
    expect(event?.args?.owner).to.equal(await addr1.getAddress());
    expect(event?.args?.tokenId).to.equal(1);
    expect(event?.args?.tokenURI).to.equal(`ipfs://${BASE_IPFS_ID}/nft_1.json`);

    const tokenId = 1;
    expect(event?.args?.tokenURI).to.equal(
      `ipfs://${BASE_IPFS_ID}/nft_${tokenId}.json`
    );
    const uri = await advancedNft.tokenURI(tokenId);
    expect(uri).to.equal(`ipfs://${BASE_IPFS_ID}/nft_${tokenId}.json`);
  });

  it("should fail if insufficient funds are sent", async function () {
    await advancedNft.addToWhitelist(await addr2.getAddress());
    await expect(
      advancedNft.connect(addr2).mintNFT(await addr2.getAddress(), {
        value: ethers.parseEther("0.005"),
      })
    ).to.be.revertedWith("Insufficient funds");
  });

  it("should allow only whitelisted users to mint", async function () {
    await advancedNft.addToWhitelist(await addr1.getAddress());

    await expect(
      advancedNft.connect(addr2).mintNFT(await addr2.getAddress(), {
        value: MINT_PRICE,
      })
    ).to.be.revertedWith("Not in whitelist");

    const tx = await advancedNft
      .connect(addr1)
      .mintNFT(await addr1.getAddress(), { value: MINT_PRICE });
    await tx.wait();

    expect(await advancedNft.ownerOf(1)).to.equal(await addr1.getAddress());

    await advancedNft.addToWhitelist(await addr2.getAddress());
    const maxSupply = Number(await advancedNft.MAX_SUPPLY());
    for (let i = 1; i < maxSupply - 1; i++) {
      await advancedNft.connect(addr2).mintNFT(await addr2.getAddress(), {
        value: MINT_PRICE,
      });
    }

    await expect(
      advancedNft.connect(addr2).mintNFT(await addr2.getAddress(), {
        value: MINT_PRICE,
      })
    ).to.be.revertedWith("Sold out");
  });

  it("should allow the owner to reveal NFTs", async function () {
    await expect(
      advancedNft.reveal(
        "bafybeidvwxbuslqvixnaohnlgilelycb3js7h5omjwfnns5m44j44zzfwa"
      )
    ).to.be.revertedWith("Reveal time not reached");

    await ethers.provider.send("evm_increaseTime", [60 * 60 * 24]);
    await ethers.provider.send("evm_mine", []);

    await advancedNft.reveal(
      "bafybeidvwxbuslqvixnaohnlgilelycb3js7h5omjwfnns5m44j44zzfwa"
    );

    expect(await advancedNft.baseUrl()).to.equal(
      "ipfs://bafybeidvwxbuslqvixnaohnlgilelycb3js7h5omjwfnns5m44j44zzfwa/"
    );
    expect(await advancedNft.revealed()).to.equal(true);
  });

  it("should allow the owner to withdraw funds", async function () {
    await advancedNft.addToWhitelist(await addr1.getAddress());
    const initialBalance = await ethers.provider.getBalance(
      await owner.getAddress()
    );
    await advancedNft.connect(addr1).mintNFT(await addr1.getAddress(), {
      value: MINT_PRICE,
    });

    const tx = await advancedNft.connect(owner).withdraw();
    await tx.wait();

    const finalBalance = await ethers.provider.getBalance(
      await owner.getAddress()
    );
    expect(finalBalance).to.be.gt(initialBalance);
  });
});
