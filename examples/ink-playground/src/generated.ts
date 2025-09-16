//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ballot
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ballotAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'proposalNames', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'chairperson',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'to', internalType: 'address', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'voter', internalType: 'address', type: 'address' }],
    name: 'giveRightToVote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32' },
      { name: 'voteCount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposal', internalType: 'uint256', type: 'uint256' }],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'voters',
    outputs: [
      { name: 'weight', internalType: 'uint256', type: 'uint256' },
      { name: 'voted', internalType: 'bool', type: 'bool' },
      { name: 'delegate', internalType: 'address', type: 'address' },
      { name: 'vote', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'winnerName',
    outputs: [
      { name: 'winnerName_', internalType: 'bytes32', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'winningProposal',
    outputs: [
      { name: 'winningProposal_', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const
