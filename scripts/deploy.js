async function main() {
  const NFTMarket = await hre.ethers.getContractFactory("AuctionMarket");
  const nftMarket = await NFTMarket.deploy();
  await nftMarket.deployed();
  console.log("AuctionMarket deployed to:", nftMarket.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
