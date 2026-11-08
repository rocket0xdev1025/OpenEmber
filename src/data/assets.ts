import catalogJson from "./catalog.json";
import {
  classLabels,
  classVolatility,
  equityRegions,
  forcedEtfs,
  highVolatility,
  minimumCollateralRatio,
  nameOverrides,
  sessionHours,
  venues,
} from "./protocol";

export type CatalogEntry = {
  id: string;
  symbol: string;
  name: string;
  region: string;
  quote: string;
  pyth: string;
  kind: string;
};

export type AssetClass = "equity" | "etf" | "fx" | "metal" | "commodity";

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  region: string;
  quote: string;
  pyth: string;
  kind: string;
  assetClass: AssetClass;
  venue: string;
  hours: string;
  volatility: number;
  mcr: number;
};

function assetClassOf(entry: CatalogEntry): AssetClass {
  if (entry.kind === "etf" || forcedEtfs.has(entry.symbol)) return "etf";
  if (
    entry.kind === "fx" ||
    entry.kind === "metal" ||
    entry.kind === "commodity" ||
    entry.kind === "equity"
  ) {
    return entry.kind;
  }
  return "equity";
}

function venueOf(entry: CatalogEntry, assetClass: AssetClass) {
  if (assetClass === "metal") return entry.symbol.endsWith("3M") ? "LME" : "COMEX";
  return venues[entry.region] ?? entry.region;
}

function hoursOf(entry: CatalogEntry, assetClass: AssetClass) {
  if (assetClass === "metal") {
    return entry.symbol.endsWith("3M") ? "LME cash session" : "COMEX 23/5";
  }
  return sessionHours[entry.region] ?? "Session on the feed calendar";
}

export const assets: Asset[] = (catalogJson as CatalogEntry[]).map((entry) => {
  const assetClass = assetClassOf(entry);
  const volatility = highVolatility[entry.symbol] ?? classVolatility[assetClass] ?? classVolatility.equity;
  return {
    ...entry,
    name: nameOverrides[entry.symbol] ?? entry.name,
    assetClass,
    venue: venueOf(entry, assetClass),
    hours: hoursOf(entry, assetClass),
    volatility,
    mcr: minimumCollateralRatio(volatility),
  };
});

const bySymbol = new Map(assets.map((asset) => [asset.symbol.toUpperCase(), asset]));

export function findAsset(query: string | null) {
  if (!query) return undefined;
  const ticker = query.trim().toUpperCase();
  const stripped = ticker.replace(/^E(?=[A-Z0-9])/, "");
  return bySymbol.get(ticker) ?? (stripped === ticker ? undefined : bySymbol.get(stripped));
}

export function syntheticName(symbol: string) {
  return `e${symbol}`;
}

export function classLabel(assetClass: AssetClass) {
  return classLabels[assetClass] ?? assetClass;
}

export type CatalogFilter = "all" | "us" | "etf" | "intl" | "fx" | "metal" | "commodity";

export const catalogFilters: { id: CatalogFilter; label: string; short?: string }[] = [
  { id: "all", label: "All" },
  { id: "us", label: "US" },
  { id: "etf", label: "ETFs" },
  { id: "intl", label: "International", short: "Intl" },
  { id: "fx", label: "FX" },
  { id: "metal", label: "Metals" },
  { id: "commodity", label: "Commodities", short: "Cmdty" },
];

export function filterAssets(list: Asset[], filter: CatalogFilter) {
  switch (filter) {
    case "us":
      return list.filter((asset) => asset.region === "US" && equityRegions.has(asset.region));
    case "etf":
      return list.filter((asset) => asset.assetClass === "etf");
    case "intl":
      return list.filter((asset) => equityRegions.has(asset.region) && asset.region !== "US");
    case "fx":
      return list.filter((asset) => asset.assetClass === "fx");
    case "metal":
      return list.filter((asset) => asset.assetClass === "metal");
    case "commodity":
      return list.filter((asset) => asset.assetClass === "commodity");
    default:
      return list;
  }
}

export function searchAssets(list: Asset[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((asset) =>
    `${asset.symbol} ${asset.name} ${asset.venue} ${asset.region} e${asset.symbol} ${asset.pyth} ${asset.assetClass}`
      .toLowerCase()
      .includes(needle),
  );
}
