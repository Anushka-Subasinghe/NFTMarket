const hre = require("hardhat");

async function main() {
  const minter = "0x9b022cA52B5a90dd8A2ffCe73C7DE84757662Cbb";
  console.log(minter)
  const NFTMarket = await hre.ethers.getContractFactory("NFTMarket");
  const nftMarket = await NFTMarket.deploy(minter, 100, "https://gateway.moralisipfs.com/ipfs/QmUx46XznwkRFJZgqxgELp2BEE2F9UMtkMdx2zfnW4WhvQ/metadata");
  await nftMarket.deployed();
  console.log("NftMarket deployed to:", nftMarket.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
