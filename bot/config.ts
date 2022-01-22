import { BigNumber, BigNumberish, utils } from 'ethers';

interface Config {
  contractAddr: string;
  logLevel: string;
  minimumProfit: number;
  gasPrice: BigNumber;
  gasLimit: BigNumberish;
  bscScanUrl: string;
  concurrency: number;
}

const contractAddr = '0x1b8264D8aCc1c00ab66dc526826f54353Be77488'; // flash bot contract address
const gasPrice = utils.parseUnits('10', 'gwei');
const gasLimit = 100000000;

const bscScanApiKey = '7JNGHRRBTACIHMCNYEVNF4UHYGZENFGNVG'; // bscscan API key
const bscScanUrl = `https://api.ftmscan.com/api?module=stats&action=ftmprice&apikey=${bscScanApiKey}`;

const config: Config = {
  contractAddr: contractAddr,
  logLevel: 'info',
  concurrency: 50,
  minimumProfit: 50, // in USD
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  bscScanUrl: bscScanUrl,
};

export default config;
