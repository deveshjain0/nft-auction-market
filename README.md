# Stack
- 前端 Next.js
- 框架 hardhat
- 存储 IPFS

这是本人第一次做全栈工程，之前并未接触过前端，因此参考了这篇教程：
https://dev.to/dabit3/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb

其中前端网页的实现参考了该教程，并在此基础上进行了一定的修改；后端智能合约调用了openzepplin对ERC721的实现来铸造NFT。

# How to run
0. 安装依赖：
```
npm install ethers hardhat @nomiclabs/hardhat-waffle \
ethereum-waffle chai @nomiclabs/hardhat-ethers \
web3modal @openzeppelin/contracts ipfs-http-client@50.1.2 \
axios
```
1. 开启Ganache，端口8545，网络ID1337；
2. 运行`npx hardhat run scripts/deploy.js --network localhost`，将CLI中输出的合约部署地址复制，粘贴到`./config.js`中；
3. 运行`npm run dev`即可在本地运行项目。