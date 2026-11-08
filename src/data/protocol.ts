export const protocol = {
  collateral: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "/usdc.png",
  },
  chain: {
    id: 99901,
    name: "Elysium",
    nativeSymbol: "HYPE",
    rpcUrl: "https://rpc-live.elysp.com",
    explorerUrl: "https://scan.elysp.com",
  },
  tokenSymbol: "EMBR",
  isLive: false,
  baseMcrPercent: 150,
  mcrAlpha: 120,
  largeCapMcr: { min: 150, max: 180 },
  pennyMcr: { min: 300, max: 400 },
  liquidationBonusPercent: 10,
  creationFeeUsdc: 50,
  creationFeeBuybackPercent: 50,
  seedTargetPoolUsdc: 4_000,
  seedMinPoolUnits: 2,
  swapFeePercent: 1,
  hookLpSharePercent: 20,
  protocolSharePercent: 30,
  creatorSharePercent: 70,
  genesisBufferBps: 1_000,
  bookLockBps: 1_000,
} as const;

export const classVolatility: Record<string, number> = {
  equity: 0.28,
  etf: 0.16,
  fx: 0.12,
  metal: 0.18,
  commodity: 0.32,
};

export const highVolatility: Record<string, number> = {
  AMC: 1.25,
  GME: 1.45,
  MARA: 0.9,
  RIOT: 0.9,
  COIN: 0.7,
  HOOD: 0.65,
  TSLA: 0.55,
  SMCI: 0.7,
  PLTR: 0.55,
  MSTR: 0.75,
  NVDA: 0.42,
  AMD: 0.4,
  ARM: 0.5,
  SOFI: 0.55,
  USDTRY: 0.35,
  USDZAR: 0.28,
  USDBRL: 0.24,
  USDMXN: 0.18,
  XAG: 0.28,
  XPD: 0.32,
  XPT: 0.3,
  NATGAS: 0.55,
  RNATGAS: 0.5,
  HHGAS1M: 0.5,
  HLGAS1M: 0.5,
  TGAS: 0.45,
  TGAS1M: 0.42,
  BRENT: 0.35,
  BRENT1M: 0.34,
  RBRENT: 0.34,
  WTI1M: 0.35,
  LWTI1M: 0.35,
  PYTHOIL: 0.36,
};

export const forcedEtfs = new Set(["SPY", "QQQ", "DIA", "VOO", "VTI", "IVV", "IWM"]);

export const nameOverrides: Record<string, string> = {
  SPY: "SPDR S&P 500",
  QQQ: "Invesco QQQ",
  GME: "GameStop",
};

export const equityRegions = new Set(["US", "HK", "JP", "KR", "CN", "TW", "IN"]);

export const venues: Record<string, string> = {
  US: "US listed",
  HK: "HKEX",
  JP: "TSE",
  KR: "KRX",
  CN: "CN listed",
  TW: "TWSE",
  IN: "NSE",
  FX: "FX spot",
  METAL: "Bullion / LME",
  CMDTY: "Continuous",
};

export const sessionHours: Record<string, string> = {
  US: "US equity regular hours",
  HK: "HKEX cash session",
  JP: "TSE cash session",
  KR: "KRX cash session",
  CN: "CN cash session",
  TW: "TWSE cash session",
  IN: "NSE cash session",
  FX: "FX 24/5 week",
  METAL: "COMEX / LME session",
  CMDTY: "Commodity session",
};

export const classLabels: Record<string, string> = {
  equity: "Equity",
  etf: "ETF",
  fx: "FX",
  metal: "Metal",
  commodity: "Commodity",
};

export function minimumCollateralRatio(volatility: number) {
  return Math.round(protocol.baseMcrPercent + protocol.mcrAlpha * volatility);
}

export function postingCollateralRatio(mcr: number) {
  if (mcr <= 0) return 0;
  const buffered = Math.floor((mcr * (10_000 + protocol.genesisBufferBps)) / 10_000);
  return Math.min(10_000, buffered);
}

export type BookSplit = {
  seedUsdc: number;
  vaultUsdc: number;
  poolUsdc: number;
  vaultPercent: number;
  poolPercent: number;
};

export function listingBook(mcr: number, oraclePrice: number | null = null): BookSplit {
  if (mcr <= 0) {
    return { seedUsdc: 0, vaultUsdc: 0, poolUsdc: 0, vaultPercent: 0, poolPercent: 0 };
  }
  const posting = postingCollateralRatio(mcr);
  const oracleFloor =
    oraclePrice != null && Number.isFinite(oraclePrice) && oraclePrice > 0
      ? protocol.seedMinPoolUnits * oraclePrice
      : 0;
  const poolUsdc = Math.max(protocol.seedTargetPoolUsdc, oracleFloor);
  const vaultUsdc = (poolUsdc * posting) / 100;
  const vaultPercent = Math.round((posting / (posting + 100)) * 100);
  return {
    seedUsdc: vaultUsdc + poolUsdc,
    vaultUsdc,
    poolUsdc,
    vaultPercent,
    poolPercent: 100 - vaultPercent,
  };
}

export function bookForSeed(seedUsdc: number | null, mcr: number, oraclePrice: number | null = null) {
  const listing = listingBook(mcr, oraclePrice);
  if (seedUsdc == null || seedUsdc <= listing.seedUsdc) return listing;
  const posting = postingCollateralRatio(mcr);
  const vaultPercent = Math.round((posting / (posting + 100)) * 100);
  const vaultUsdc = (seedUsdc * posting) / (posting + 100);
  return {
    seedUsdc,
    vaultUsdc,
    poolUsdc: seedUsdc - vaultUsdc,
    vaultPercent,
    poolPercent: 100 - vaultPercent,
  };
}
