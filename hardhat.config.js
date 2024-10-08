require("@nomiclabs/hardhat-waffle");
const fs = require("fs")
const privateKey = fs.readFileSync(".secret").toString()
const projectId = "d91ca7488f2b41c6a141bc948e0fdd4a"

module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
      blockGasLimit: 0x1fffffffffffff,
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectId}`,  
      accounts: [privateKey]
    },
    mainnet: {
      url: `https://polygon-mainnet.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    }  
  },
  solidity: "0.8.4",
};
