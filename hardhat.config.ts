import { task, HardhatUserConfig } from 'hardhat/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';

import deployer from './.secret';

// const BSC_RPC = 'https://rpcapi.fantom.network';
const FTM_RPC = 'https://rpc.ftm.tools';
const FTM_Tetsnet_RPC = 'https://rpc.testnet.fantom.network';

const config: HardhatUserConfig = {
  solidity: { version: '0.7.6' },
  networks: {
    hardhat: {
      // loggingEnabled: true,
      forking: {
        url: FTM_RPC,
        enabled: true,
      },
      accounts: {
        accountsBalance: '1000000000000000000000000', // 1 mil ether
      },
    },
    bscTestnet: {
      url: FTM_Tetsnet_RPC,
      chainId: 4002,
      accounts: [deployer.private],
    },
    bsc: {
      url: FTM_RPC,
      chainId: 250,
      accounts: [deployer.private],
      gasPrice: 22000000000
    },
  },
  mocha: {
    timeout: 40000,
  },
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = config;
