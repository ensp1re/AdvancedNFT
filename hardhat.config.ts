import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    sepolia: {
      url: "https://sepolia.infura.io/v3/your-infura-id",
      accounts: [
        "",
      ],
    },
  },
  etherscan: {
    apiKey: "",
  },
};

export default config;
