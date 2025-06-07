import '@nomiclabs/hardhat-ethers'
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
  solidity: '0.8.20',
  networks: {
    kaia: {
      url: 'https://public-en-kairos.node.kaia.io',
      accounts: ['0x29eec5cc035c288408380f522542735db5e8fedaf3219f8d99b1bbd100539bb8'],
    },
  },
};

export default config;