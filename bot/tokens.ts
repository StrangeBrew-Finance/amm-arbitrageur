import fs from 'fs';
import path from 'path';
import 'lodash.combinations';
import lodash from 'lodash';
import { Contract } from '@ethersproject/contracts';
import { ethers } from 'hardhat';

import log from './log';

export enum Network {
  BSC = 'bsc',
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const bscBaseTokens: Tokens = {
  wFTM: { symbol: 'WFTM', address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83' },
  MIM: { symbol: 'MIM', address: '0x82f0b8b456c1a451378467398982d4834b6829c1' },
  usdc: { symbol: 'USDC', address: '0x04068da6c83afcfa0e13ba15a6696662335d5b75' },
};

const bscQuoteTokens: Tokens = {
  OXDAO: { symbol: 'OXD', address: '0xc165d941481e68696f43EE6E99BFB2B23E0E3114' },
};

const bscDexes: AmmFactories = {
  spirit: '0xEF45d134b73241eDa7703fa787148D9C9F4950b0',
  spooky: '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3',
  sushi: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  hyper: '0x991152411A7B5A14A8CF0cDDE8439435328070dF',
  fbomb: '0xD9473A05b2edf4f614593bA5D1dBd3021d8e0Ebe',
  zoo: '0x6178C3B21F7cA1adD84c16AD35452c85a85F5df4',

  // value: '0x1B8E12F839BD4e73A47adDF76cF7F0097d74c14C',
};

function getFactories(network: Network): AmmFactories {
  switch (network) {
    case Network.BSC:
      return bscDexes;
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

export function getTokens(network: Network): [Tokens, Tokens] {
  switch (network) {
    case Network.BSC:
      return [bscBaseTokens, bscQuoteTokens];
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

async function updatePairs(network: Network): Promise<ArbitragePair[]> {
  log.info('Updating arbitrage token pairs');
  const [baseTokens, quoteTokens] = getTokens(network);
  const factoryAddrs = getFactories(network);

  const factoryAbi = ['function getPair(address, address) view returns (address pair)'];
  let factories: Contract[] = [];

  log.info(`Fetch from dexes: ${Object.keys(factoryAddrs)}`);
  for (const key in factoryAddrs) {
    const addr = factoryAddrs[key];
    const factory = new ethers.Contract(addr, factoryAbi, ethers.provider);
    factories.push(factory);
  }

  let tokenPairs: TokenPair[] = [];
  for (const key in baseTokens) {
    const baseToken = baseTokens[key];
    for (const quoteKey in quoteTokens) {
      const quoteToken = quoteTokens[quoteKey];
      let tokenPair: TokenPair = { symbols: `${quoteToken.symbol}-${baseToken.symbol}`, pairs: [] };
      for (const factory of factories) {
        const pair = await factory.getPair(baseToken.address, quoteToken.address);
        if (pair != ZERO_ADDRESS) {
          tokenPair.pairs.push(pair);
        }
      }
      if (tokenPair.pairs.length >= 2) {
        tokenPairs.push(tokenPair);
      }
    }
  }

  let allPairs: ArbitragePair[] = [];
  for (const tokenPair of tokenPairs) {
    if (tokenPair.pairs.length < 2) {
      continue;
    } else if (tokenPair.pairs.length == 2) {
      allPairs.push(tokenPair as ArbitragePair);
    } else {
      // @ts-ignore
      const combinations = lodash.combinations(tokenPair.pairs, 2);
      for (const pair of combinations) {
        const arbitragePair: ArbitragePair = {
          symbols: tokenPair.symbols,
          pairs: pair,
        };
        allPairs.push(arbitragePair);
      }
    }
  }
  return allPairs;
}

function getPairsFile(network: Network) {
  return path.join(__dirname, `../pairs-${network}.json`);
}

export async function tryLoadPairs(network: Network): Promise<ArbitragePair[]> {
  let pairs: ArbitragePair[] | null;
  const pairsFile = getPairsFile(network);
  try {
    pairs = JSON.parse(fs.readFileSync(pairsFile, 'utf-8'));
    log.info('Load pairs from json');
  } catch (err) {
    pairs = null;
  }

  if (pairs) {
    return pairs;
  }
  pairs = await updatePairs(network);

  fs.writeFileSync(pairsFile, JSON.stringify(pairs, null, 2));
  return pairs;
}
