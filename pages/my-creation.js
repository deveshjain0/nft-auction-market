import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  nftmarketaddress
} from '../config'

import Market from '../artifacts/contracts/Auction.sol/AuctionMarket.json'

export default function MyCreations() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const data = await marketContract.fetchMyCreatedNFT()

    const _nfts = await Promise.all(data.map(async i => {
      const tokenUri = await marketContract.getTokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let birthDay = new Date(i.birthTime.toNumber()*1000)
      let nft = {
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
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No NFT owned</h1>)
  return (
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
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}