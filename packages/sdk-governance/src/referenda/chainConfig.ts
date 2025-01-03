const SpenderOrigin = {
  Treasurer: "Treasurer",
  SmallTipper: "SmallTipper",
  BigTipper: "BigTipper",
  SmallSpender: "SmallSpender",
  MediumSpender: "MediumSpender",
  BigSpender: "BigSpender",
} as const;
export type Origin = (typeof SpenderOrigin)[keyof typeof SpenderOrigin];

export const originToTrack: Record<Origin, string> = {
  Treasurer: "treasurer",
  SmallTipper: "small_tipper",
  BigTipper: "big_tipper",
  SmallSpender: "small_spender",
  MediumSpender: "medium_spender",
  BigSpender: "big_spender",
};

const DOT_UNIT = 10_000_000_000n;
export const polkadotSpenderOrigin = (value: bigint): Origin | null => {
  if (value <= 250n * DOT_UNIT) return SpenderOrigin.SmallTipper;
  if (value <= 1_000n * DOT_UNIT) return SpenderOrigin.BigTipper;
  if (value <= 10_000n * DOT_UNIT) return SpenderOrigin.SmallSpender;
  if (value <= 100_000n * DOT_UNIT) return SpenderOrigin.MediumSpender;
  if (value <= 1_000_000n * DOT_UNIT) return SpenderOrigin.BigSpender;
  if (value <= 10_000_000n * DOT_UNIT) return SpenderOrigin.Treasurer;
  return null;
};

const KSM_UNIT = 1_000_000_000_000n;
export const kusamaSpenderOrigin = (value: bigint): Origin | null => {
  if (value <= 1n * KSM_UNIT) return SpenderOrigin.SmallTipper;
  if (value <= 5n * KSM_UNIT) return SpenderOrigin.BigTipper;
  if (value <= 333n * KSM_UNIT) return SpenderOrigin.SmallSpender;
  if (value <= 3_333n * KSM_UNIT) return SpenderOrigin.MediumSpender;
  if (value <= 33_333n * KSM_UNIT) return SpenderOrigin.BigSpender;
  return SpenderOrigin.Treasurer;
};
