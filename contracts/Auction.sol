// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract NFTminter is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address private _minterOwner;

    constructor(address ownerAddress) ERC721("Metaverse Tokens", "METT") {
        _minterOwner = ownerAddress;
    }

    function mintToken(address owner, string memory tokenURI) public returns (uint) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(owner, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        return newTokenId;
    }

    function transferToken(address from, address to, uint256 tokenId) public {
        require(msg.sender == _minterOwner, "Transfer permission denied.");
        _transfer(from, to, tokenId);
    }
}

contract AuctionMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _auctionIds;
    NFTminter _minter = new NFTminter(address(this));

    address payable _marketOwner;
    uint256 listingPrice = 0 ether;
    uint256 mintingPrice = 0 ether;

    constructor() {
        _marketOwner = payable(msg.sender);
    }

    struct TokenItem {
        uint256 itemId;
        uint256 tokenId;
        address payable creator;
        address payable owner;
        uint birthTime;
        bool isSelling;
    }

    mapping(uint256 => TokenItem) private _idToTokenItem;

    struct Auction {
        uint256 auctionId;
        uint256 itemId;
        address auctionOwner;
        address payable highestBidder;
        uint highestBid;
        uint upsetPrice;
        uint endTime;
        bool isEnded;
    }

    mapping(uint256 => Auction) private _idToAuction;

    event tokenTransfer(
        uint256 indexed itemId,
        address from,
        address to,
        uint time,
        uint price
    );

    function createToken(string memory tokenURI) public payable nonReentrant {
        require(msg.value == mintingPrice, "Price must be equal to minting price.");

        uint256 tokenId = _minter.mintToken(msg.sender, tokenURI);
        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        _idToTokenItem[itemId] = TokenItem(
            itemId,
            tokenId,
            payable(msg.sender),
            payable(msg.sender),
            block.timestamp,
            false
        );

        payable(_marketOwner).transfer(mintingPrice);

        // emit
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return _minter.tokenURI(tokenId);
    }

    function getItemURI(uint256 itemId) public view returns (string memory) {
        return _minter.tokenURI(_idToTokenItem[itemId].tokenId);
    }

    fallback() external payable {
        payable(msg.sender).transfer(msg.value);
    }

    receive() external payable {
    }

    function createAuction(uint256 itemId, uint biddingTime, uint upsetPrice) public payable {
        require(_idToTokenItem[itemId].owner == msg.sender, "You are not the owner of the item.");
        require(!_idToTokenItem[itemId].isSelling, "The item is selling.");
        require(msg.value == listingPrice, "Price must be equal to listing price.");

        _auctionIds.increment();
        uint256 auctionId = _auctionIds.current();
        _idToAuction[auctionId] = Auction(
            auctionId,
            itemId,
            msg.sender,
            payable(msg.sender),
            0,
            upsetPrice,
            block.timestamp + biddingTime,
            false
        );

        _idToTokenItem[itemId].isSelling = true;
    }

    function bid(uint256 auctionId) public payable {
        require(_idToAuction[auctionId].auctionOwner != msg.sender, "You can not bid your own auction.");
        require(!_idToAuction[auctionId].isEnded && block.timestamp <= _idToAuction[auctionId].endTime, "Auction already ended.");
        require(msg.value > _idToAuction[auctionId].highestBid, "There already is a higher bid.");
        require(msg.value >= _idToAuction[auctionId].upsetPrice, "Your bid is less than the upsetprice.");

        if (_idToAuction[auctionId].highestBid != 0) {
            _idToAuction[auctionId].highestBidder.transfer(_idToAuction[auctionId].highestBid);
        }
        _idToAuction[auctionId].highestBidder = payable(msg.sender);
        _idToAuction[auctionId].highestBid = msg.value;

        // emit
    }

    function endAuction(uint256 auctionId) public {
        require(block.timestamp >= _idToAuction[auctionId].endTime, "Auction not yet ended.");
        require(!_idToAuction[auctionId].isEnded, "auctionEnd has already been called.");
        require(_idToAuction[auctionId].highestBidder == msg.sender, "You are not the highest bidder.");

        _idToAuction[auctionId].isEnded = true;
        uint256 itemId = _idToAuction[auctionId].itemId;
        uint256 tokenId = _idToTokenItem[itemId].tokenId;
        _idToTokenItem[itemId].owner.transfer(_idToAuction[auctionId].highestBid);
        _minter.transferToken(_idToTokenItem[itemId].owner, _idToAuction[auctionId].highestBidder, tokenId);
        _idToTokenItem[itemId].owner = _idToAuction[auctionId].highestBidder;
        _idToTokenItem[itemId].isSelling = false;

        emit tokenTransfer(itemId, _idToAuction[auctionId].auctionOwner, _idToAuction[auctionId].highestBidder, block.timestamp, _idToAuction[auctionId].highestBid);
    }

    function fetchMyCreatedNFT() public view returns (TokenItem[] memory) {
        uint totalNFTCount = _itemIds.current();
        uint NFTCount = 0;
        uint currentIndex = 0;

        for (uint256 i = 0; i < totalNFTCount; i++) {
            if (_idToTokenItem[i+1].creator == msg.sender) {
                NFTCount += 1;
            }
        }

        TokenItem[] memory NFTs = new TokenItem[](NFTCount);
        for (uint256 i = 0; i < totalNFTCount; i++) {
            if (_idToTokenItem[i+1].creator == msg.sender) {
                uint currentId = i+1;
                TokenItem storage currentNFT = _idToTokenItem[currentId];
                NFTs[currentIndex] = currentNFT;
                currentIndex += 1;
            }
        }

        return NFTs;
    }

    function fetchMyOwnedNFT() public view returns (TokenItem[] memory) {
        uint totalNFTCount = _itemIds.current();
        uint NFTCount = 0;
        uint currentIndex = 0;

        for (uint256 i = 0; i < totalNFTCount; i++) {
            if (_idToTokenItem[i+1].owner == msg.sender) {
                NFTCount += 1;
            }
        }

        TokenItem[] memory NFTs = new TokenItem[](NFTCount);
        for (uint256 i = 0; i < totalNFTCount; i++) {
            if (_idToTokenItem[i+1].owner == msg.sender) {
                uint currentId = i+1;
                TokenItem storage currentNFT = _idToTokenItem[currentId];
                NFTs[currentIndex] = currentNFT;
                currentIndex += 1;
            }
        }

        return NFTs;
    }

    function fetchMyAuction() public view returns (Auction[] memory, TokenItem[] memory) {
        uint totalAuctionCount = _auctionIds.current();
        uint AuctionCount = 0;
        uint currentIndex = 0;

        for (uint256 i = 0; i < totalAuctionCount; i++) {
            if (_idToAuction[i+1].auctionOwner == msg.sender) {
                AuctionCount += 1;
            }
        }

        Auction[] memory auctions = new Auction[](AuctionCount);
        TokenItem[] memory NFTs = new TokenItem[](AuctionCount);
        for (uint256 i = 0; i < totalAuctionCount; i++) {
            if (_idToAuction[i+1].auctionOwner == msg.sender) {
                uint currentId = i+1;
                Auction storage currentAuction = _idToAuction[currentId];
                TokenItem storage currentNFT = _idToTokenItem[currentAuction.itemId];
                auctions[currentIndex] = currentAuction;
                NFTs[currentIndex] = currentNFT;
                currentIndex += 1;
            }
        }

        return (auctions, NFTs);
    }

    function fetchAvaliableAuction() public view returns (Auction[] memory, TokenItem[] memory) {
        uint totalAuctionCount = _auctionIds.current();
        uint AuctionCount = 0;
        uint currentIndex = 0;

        for (uint256 i = 0; i < totalAuctionCount; i++) {
            if (!_idToAuction[i+1].isEnded) {
                AuctionCount += 1;
            }
        }

        Auction[] memory auctions = new Auction[](AuctionCount);
        TokenItem[] memory NFTs = new TokenItem[](AuctionCount);
        for (uint256 i = 0; i < totalAuctionCount; i++) {
            if (!_idToAuction[i+1].isEnded) {
                uint currentId = i+1;
                Auction storage currentAuction = _idToAuction[currentId];
                TokenItem storage currentNFT = _idToTokenItem[currentAuction.itemId];
                auctions[currentIndex] = currentAuction;
                NFTs[currentIndex] = currentNFT;
                currentIndex += 1;
            }
        }

        return (auctions, NFTs);
    }
}