import { HardhatUserConfig } from 'hardhat/types'

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{
      version: "0.4.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
	}, {
      version: "0.8.9",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
	}]
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
	local: {
      url: 'http://127.0.0.1:7545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      }
    },
    optimism_l1: {
      url: 'http://127.0.0.1:9545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      gasPrice: 0
    },
    optimism_l2: {
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      gasPrice: 0
    }
  },
};

export default config
