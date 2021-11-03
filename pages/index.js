import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

// 加载合约地址
import {
  nftmarketaddress
} from '../config'

import Market from '../artifacts/contracts/Auction.sol/AuctionMarket.json'

export default function Home() {
  const [auctions, setAuctions] = useState([]) // 未结束的合约
  const [bidprice, setBidprice] = useState("") // 出价
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadAuctions()
  }, [])
  async function loadAuctions() {
    // 获取合约
    const provider = new ethers.providers.Web3Provider(web3.currentProvider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const [dataAuctions, dataTokens] = await marketContract.fetchAvaliableAuction() // 调用合约中的fetchAvaliableAuction方法

    // 处理数据
    const _auctions = await Promise.all(dataAuctions.map(async i => {
        const tokenUri = await marketContract.getItemURI(i.itemId)
        const meta = await axios.get(tokenUri)
        let highestBid = ethers.utils.formatUnits(i.highestBid.toString(), 'ether')
        let upsetPrice = ethers.utils.formatUnits(i.upsetPrice.toString(), 'ether')
        let endTime = new Date(i.endTime.toNumber()*1000)
        let auction = {
          highestBid, // 最高出价
          upsetPrice, // 起拍价
          auctionId: i.auctionId.toNumber(), // 拍卖编号
          itemId: i.itemId.toNumber(),       // 代币编号
          seller: i.auctionOwner,            // 拍卖者
          highestBidder: i.highestBidder,    // 最高出价者
          endTime: endTime.toLocaleString(), // 结束时间
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        }
      return auction
    }))
    setAuctions(_auctions)
    setLoadingState('loaded')
  }
  // 竞拍
  async function bid(auction) {
    // 用户登陆
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    try {
      const price = ethers.utils.parseUnits(bidprice, 'ether')
      // 调用合约中的bid方法
      const transaction = await contract.bid(ethers.BigNumber.from(auction.auctionId), {
        value: price
      })
      await transaction.wait()
    } catch (error) {
      console.log(error.data.message)
      alert(error.data.message)
    }
    loadAuctions()
  }
  // 结束拍卖，只有最高出价者在结束时间已过后才能结束拍卖
  async function end(auction) {
    // 用户登录
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    try {
      const transaction = await contract.endAuction(ethers.BigNumber.from(auction.auctionId))
      await transaction.wait()
    } catch (error) {
      console.log(error.data.message)
      alert(error.data.message)
    }

    loadAuctions()
  }
  if (loadingState === 'loaded' && !auctions.length) return (<h1 className="px-20 py-10 text-3xl">No auctions in marketplace</h1>)
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            auctions.map((auction, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={auction.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{auction.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{auction.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-1 font-bold text-white">HighestBid: {auction.highestBid} ETH</p>
                  <p className="text-2xl mb-1 font-bold text-white">UpsetPrice: {auction.upsetPrice} ETH</p>
                  <p className="text-2xl mb-1 font-bold text-white">Seller: </p>
                  <p className="text-xs mb-1 text-white">{auction.seller}</p>
                  <p className="text-2xl mb-1 font-bold text-white">HighestBidder: </p>
                  <p className="text-xs mb-1 text-white">{auction.highestBidder}</p>
                  <p className="text-2xl mb- font-bold text-white">EndTime: </p>
                  <p className="text-2xl mb-1 text-white">{auction.endTime}</p>
                </div>
                <div className="p-4 bg-black">
                  <input type="number" step="0.0001" min="0" className="w-full mt-2 border rounded p-4" onChange={e => setBidprice(e.target.value)}/>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={e => bid(auction)}>BID</button>
                  <button className="w-full bg-black-500 text-white font-bold py-2 px-12 rounded" onClick={e => end(auction)}>END</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}