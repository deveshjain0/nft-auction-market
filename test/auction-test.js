const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function() {
    it("Should create tokens", async function() {
        // deploy
        const Auction = await ethers.getContractFactory("AuctionMarket")
        const auction = await Auction.deploy()
        await auction.deployed()

        // create tokens
        await auction.createToken("mytokenlocation1")
        await auction.createToken("mytokenlocation2")

        // fetch tokens
        items = await auction.fetchMyCreatedNFT()
        items = await Promise.all(items.map(async i => {
            const tokenURI =  await auction.getTokenURI(i.tokenId)
            let item = {
                itemId: i.itemId.toString(),
                tokenId: i.tokenId.toString(),
                creator: i.creator,
                owner: i.owner,
                birthTime: i.birthTime,
                tokenURI
            }
            return item
        }))
        console.log('items:', items)
    })
})