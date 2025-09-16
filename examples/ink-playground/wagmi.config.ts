import { defineConfig } from '@wagmi/cli';
import type { Abi } from 'viem';
import ballotAbi from './contracts/ballot/ballot-abi.json' with { type: 'json' };

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'ballot',
      abi: ballotAbi as Abi,
    },
  ]
})