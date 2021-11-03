import '../styles/globals.css'
import Link from 'next/link'

/*
index.js  "/" : 加载尚未结束的拍卖
mint-token : 铸造NFT的页面
my-property : 显示用户拥有的NFT，可以查看该NFT的交易记录
my-creation : 显示用户铸造的NFT
*/

function MyApp({ Component, pageProps }) { // 页面入口
  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">NFT Auction Market</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-16 text-pink-500">
              Avaliable Auctions
            </a>
          </Link>
          <Link href="/mint-token">
            <a className="mr-16 text-pink-500">
              Mint NFT
            </a>
          </Link>
          <Link href="/my-property">
            <a className="mr-16 text-pink-500">
              My Property
            </a>
          </Link>
          <Link href="/my-creation">
            <a className="mr-16 text-pink-500">
              My Creation
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
