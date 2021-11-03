import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Web3Modal from "web3modal"

// 加载合约地址
import {
  nftmarketaddress
} from '../config'

import Market from '../artifacts/contracts/Auction.sol/AuctionMarket.json'

export default function MyProperty() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [formInput, updateFormInput] = useState({bidendtime: 0, price: 0 })
  const [events, setEvents] = useState([])
  const router = useRouter()
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const data = await marketContract.fetchMyOwnedNFT()

    const _nfts = await Promise.all(data.map(async i => {
        const tokenUri = await marketContract.getTokenURI(i.tokenId)
        const meta = await axios.get(tokenUri)
        let birthDay = new Date(i.birthTime.toNumber()*1000)
        let nft = {
          itemId: i.itemId,
          tokenId: i.tokenId.toNumber(),
          creator: i.creator,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
          birthday: birthDay.toLocaleString()
        }
        return nft
    }))
    setNfts(_nfts)
    setLoadingState('loaded')
  }
  // 获取代币的交易历史
  async function loadTransferHistory(id) {
    const provider = new ethers.providers.Web3Provider(web3.currentProvider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    let filter = marketContract.filters.tokenTransfer(id,null,null,null,null)
    var data = await marketContract.queryFilter(filter,0,"latest")
    const _events = await Promise.all(data.map(async i => {
      i = i.args
      let day = new Date(i.time.toNumber()*1000)
      let price = ethers.utils.formatUnits(i.price.toString(),'ether')
      let atransfer = {
        from: i.from,
        to: i.to,
        time: day.toLocaleString(),
        price: price
      }
      return atransfer
    }))
    setEvents(_events)
  }
  // 发布拍卖
  async function releaseAuction(nft) {
    const {bidendtime, price} = formInput
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    let _price = ethers.utils.parseUnits(price.toString(), 'ether')

    let contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let transaction = await contract.createAuction(nft.itemId, ethers.BigNumber.from(bidendtime), _price)
    await transaction.wait()

    router.push('/')
  }
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No NFT owned</h1>)
  else return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-xl text-white">Creator:  </p> <p className="text-xs text-white">{nft.creator}</p>
                  <p className="text-xl text-white">Owner:  </p> <p className="text-xs text-white">{nft.owner}</p>
                  <p className="text-xl text-white">BirthDay:  {nft.birthday}</p>
                </div>
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-pink">
                <input
                    type="number" step="0.0001" min="0"
                    placeholder="Upset Price ETH"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
                <input
                    type="number" step="1" min="0"
                    placeholder="Last Seconds"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, bidendtime: e.target.value })}
                />
                <button onClick={() => releaseAuction(nft)} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
                    Creat an Auction
                </button>
                <button onClick={() => (loadTransferHistory(nft.itemId))} className="font-bold mt-4 bg-pink-300 text-white rounded p-4 shadow-lg">
                    View History
                </button>

                </div>
              </div>
            ))
          }
          <div className="border shadow rounded-xl overflow-hidden" hidden={false}>
            <h4> History: </h4>
          {
                    events.map((event,j) => (
                      <div key={j} className="text-xs mt-2">
                      <p className="font-bold">Tx.{j}</p>
                      <p className="font-bold">From: </p> <p>{event.from}</p>
                      <p className="font-bold">To: </p> <p>{event.to}</p>
                      <p className="font-bold">Time: </p> <p>{event.time}</p>
                      <p className="font-bold">Price: </p> <p>{event.price} ETH</p>
                      </div>
                    ))
                  }

          </div>
        </div>
      </div>
    </div>
  )
}