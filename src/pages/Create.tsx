import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Afterglow } from "../components/Afterglow";
import { ChevronLeftIcon, ChevronRightIcon, HelpIcon, SearchIcon, WalletIcon } from "../components/Icons";
import {
  assets,
  catalogFilters,
  classLabel,
  filterAssets,
  findAsset,
  searchAssets,
  syntheticName,
  type Asset,
  type CatalogFilter,
} from "../data/assets";
import { bookForSeed, listingBook, postingCollateralRatio, protocol, type BookSplit } from "../data/protocol";
import { formatAmount, formatPercent, parseAmount } from "../lib/format";
import { sessionLabel } from "../lib/session";
import { useToast } from "../state/toast";
import { useWallet } from "../state/wallet";

const pageSize = 25;

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2.5 text-[13px] leading-relaxed sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-foreground">{children}</dd>
    </div>
  );
}

function Parameters({ asset, session, book }: { asset: Asset; session: string; book: BookSplit }) {
  const posting = postingCollateralRatio(asset.mcr);
  return (
    <>
      <Spec label="Ticker">{asset.symbol}</Spec>
      <Spec label="Feed">
        <span className="font-mono text-[12px] break-all">{asset.pyth}</span>
      </Spec>
      <Spec label="Quote">{asset.quote}</Spec>
      <Spec label="Session">{session}</Spec>
      <Spec label="Vol">
        <span className="font-mono">{formatPercent(asset.volatility * 100)}</span>
      </Spec>
      <Spec label="Starting MCR">
        <span className="font-mono">{asset.mcr}%</span>
      </Spec>
      <Spec label="Posting CR">
        <span className="font-mono">{posting}%</span>
      </Spec>
      <Spec label="Listing seed">
        <span className="font-mono">
          {formatAmount(book.seedUsdc)} {protocol.collateral.symbol}
        </span>
      </Spec>
      <Spec label="Vault">
        <span className="font-mono">
          {formatAmount(book.vaultUsdc)} {protocol.collateral.symbol} ({book.vaultPercent}%)
        </span>
      </Spec>
      <Spec label="Pool">
        <span className="font-mono">
          {formatAmount(book.poolUsdc)} {protocol.collateral.symbol} ({book.poolPercent}%)
        </span>
      </Spec>
    </>
  );
}

export function Create() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [page, setPage] = useState(1);
  const [seedInput, setSeedInput] = useState("");
  const { connected, openConnect } = useWallet();
  const { notify } = useToast();

  const filtered = useMemo(() => searchAssets(filterAssets(assets, filter), query), [filter, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = start + rows.length;

  const selected =
    findAsset(params.get("ticker")) ??
    assets.find((asset) => asset.symbol === "AAPL" && asset.region === "US") ??
    assets[0];

  const minimum = listingBook(selected.mcr);
  useEffect(() => {
    setSeedInput(String(Math.round(minimum.seedUsdc)));
  }, [selected.id, minimum.seedUsdc]);

  const seed = parseAmount(seedInput);
  const shown = bookForSeed(seed, selected.mcr);
  const fee = 0;
  const total = seed == null ? null : fee + seed;
  const session = sessionLabel(selected);

  function choose(asset: Asset) {
    setParams({ ticker: asset.symbol }, { replace: true });
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => {
        document.getElementById("create-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  return (
    <div>
      <Afterglow layout="band">
        <header className="relative z-10 mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-16">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-display text-[1.75rem] leading-none font-normal tracking-tight sm:text-5xl">Create</h1>
            <Link
              to="/docs#create"
              className="inline-flex shrink-0 items-center gap-1.5 text-[13px] tracking-[0.02em] text-muted transition-colors hover:text-foreground"
            >
              <HelpIcon className="size-3.5" />
              <span className="sm:hidden">Docs</span>
              <span className="hidden sm:inline">How create works</span>
            </Link>
          </div>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted sm:mt-5 sm:text-[15px]">
            Pick a ticker and create the synthetic.
            <br className="hidden sm:block" /> You pay {protocol.collateral.symbol} to seed the pool at the oracle. No allocation.
          </p>
        </header>
      </Afterglow>

      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:items-start lg:gap-20">
          <section id="catalog" aria-labelledby="catalog-heading" className="order-2 min-w-0 scroll-mt-16 border-t border-border pt-10 lg:order-1 lg:border-0 lg:pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div>
                <h2 id="catalog-heading" className="font-display text-2xl font-normal tracking-tight">
                  Catalog
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  {from.toLocaleString("en-US")}–{to.toLocaleString("en-US")} of {filtered.length.toLocaleString("en-US")}
                </p>
              </div>
              <label className="relative block w-full sm:max-w-[16rem]">
                <span className="sr-only">Search catalog</span>
                <SearchIcon className="pointer-events-none absolute top-1/2 left-0 size-3.5 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search ticker or name"
                  autoComplete="off"
                  className="h-9 w-full border-0 border-b border-border bg-transparent pr-0 pl-6 text-sm text-foreground outline-none placeholder:text-muted"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-5 overflow-x-auto text-[13px]" role="tablist" aria-label="Catalog filters">
              {catalogFilters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  onClick={() => {
                    setFilter(item.id);
                    setPage(1);
                  }}
                  className={`shrink-0 tracking-[0.02em] transition-colors ${filter === item.id ? "text-foreground" : "text-muted hover:text-foreground"}`}
                >
                  {item.short ? (
                    <>
                      <span className="sm:hidden">{item.short}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[11px] tracking-[0.14em] text-muted uppercase">
                    <th className="py-3 pr-4 font-medium">Synthetic</th>
                    <th className="py-3 pr-4 font-medium">Name</th>
                    <th className="py-3 pr-4 font-medium">Venue</th>
                    <th className="py-3 pl-4 text-right font-medium">MCR</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((asset) => {
                    const active = asset.id === selected.id;
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => choose(asset)}
                        className={`cursor-pointer border-b border-border/80 transition-colors ${active ? "text-foreground" : "text-muted hover:text-foreground"}`}
                      >
                        <td className={`py-3 pr-4 font-medium ${active ? "" : "text-foreground/80"}`}>{syntheticName(asset.symbol)}</td>
                        <td className="py-3 pr-4">{asset.name}</td>
                        <td className="py-3 pr-4">
                          {asset.symbol} · {asset.venue}
                        </td>
                        <td className="py-3 pl-4 text-right font-mono">{asset.mcr}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length === 0 ? <p className="py-8 text-sm text-muted">No names match that search.</p> : null}
            </div>

            {filtered.length > pageSize ? (
              <nav className="mt-4 flex items-center justify-between text-[13px] text-muted" aria-label="Catalog pages">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="inline-flex items-center gap-1 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeftIcon className="size-3.5" />
                  Prev
                </button>
                <span>
                  {currentPage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className="inline-flex items-center gap-1 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                  <ChevronRightIcon className="size-3.5" />
                </button>
              </nav>
            ) : null}
          </section>

          <aside id="create-panel" className="order-1 min-w-0 scroll-mt-16 lg:sticky lg:top-16 lg:order-2">
            <form
              className="flex flex-col gap-6 sm:gap-8"
              onSubmit={(event) => {
                event.preventDefault();
                notify("Factory is not deployed", `Not live on ${protocol.chain.name} yet.`);
              }}
            >
              <div>
                <p className="text-[11px] tracking-[0.18em] text-muted uppercase">Create</p>
                <h2 className="mt-2 font-display text-[1.75rem] leading-none font-normal tracking-tight sm:text-[2rem]">
                  {syntheticName(selected.symbol)}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {selected.name} · {classLabel(selected.assetClass)} · {selected.venue}
                </p>
                <a href="#catalog" className="mt-3 inline-block text-[13px] text-muted underline-offset-4 hover:text-foreground hover:underline lg:hidden">
                  Browse catalog
                </a>
              </div>

              <div className="order-3 lg:order-1">
                <details className="border-y border-border lg:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[13px] text-muted [&::-webkit-details-marker]:hidden">
                    Parameters
                  </summary>
                  <dl className="divide-y divide-border border-t border-border">
                    <Parameters asset={selected} session={session} book={shown} />
                  </dl>
                </details>
                <dl className="hidden divide-y divide-border border-y border-border lg:block">
                  <Parameters asset={selected} session={session} book={shown} />
                </dl>
              </div>

              <label className="order-1 block lg:order-2">
                <span className="text-[11px] tracking-[0.18em] text-muted uppercase">Seed</span>
                <span className="mt-2 flex items-center gap-2 border-b border-border focus-within:border-foreground">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={seedInput}
                    onChange={(event) => setSeedInput(event.target.value)}
                    placeholder="0"
                    aria-label={`Pool seed in ${protocol.collateral.symbol}`}
                    className="h-10 w-full border-0 bg-transparent font-mono text-[1.35rem] tracking-tight text-foreground outline-none placeholder:text-muted"
                  />
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-muted">
                    <img src={protocol.collateral.logo} alt="" width={16} height={16} className="size-4" />
                    {protocol.collateral.symbol}
                  </span>
                </span>
              </label>

              <dl className="order-1 divide-y divide-border border-y border-border lg:order-2">
                <Spec label="Fee">
                  <span className="font-mono">
                    {formatAmount(fee)} {protocol.collateral.symbol}
                  </span>
                </Spec>
                <Spec label="Seed">
                  <span className="font-mono">{seed == null ? "" : `${formatAmount(seed)} ${protocol.collateral.symbol}`}</span>
                </Spec>
                <Spec label="Total">
                  <span className="font-mono">{total == null ? "" : `${formatAmount(total)} ${protocol.collateral.symbol}`}</span>
                </Spec>
              </dl>

              <div className="order-1 space-y-2 lg:order-2">
                {connected ? (
                  <button
                    type="submit"
                    className="bg-ember inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                    disabled
                  >
                    Create {syntheticName(selected.symbol)}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openConnect}
                    className="bg-ember inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-accent-foreground"
                  >
                    <WalletIcon className="size-4" />
                    Connect Wallet
                  </button>
                )}
                <p className="text-xs leading-relaxed text-muted">
                  Factory is not deployed on {protocol.chain.name} yet.
                  {seed != null && seed + 1e-9 < minimum.seedUsdc
                    ? ` Opens the seed window. Lists at ${formatAmount(minimum.seedUsdc)} ${protocol.collateral.symbol}.`
                    : ""}
                </p>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
