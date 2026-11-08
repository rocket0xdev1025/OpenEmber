import { Link } from "react-router-dom";
import { Afterglow } from "../components/Afterglow";
import { ArrowRightIcon, ChartIcon, DocsIcon } from "../components/Icons";
import { protocol } from "../data/protocol";

const stats = [
  { k: "Collateral", v: `${protocol.collateral.symbol} only` },
  { k: "MCR", v: `${protocol.largeCapMcr.min}% to ${protocol.pennyMcr.max}%, by volatility` },
  { k: "Book fee", v: `${protocol.swapFeePercent}%, ${protocol.creatorSharePercent}% of the take to creator` },
  { k: "Create", v: `${protocol.creationFeeUsdc} ${protocol.collateral.symbol}, half burns $${protocol.tokenSymbol}` },
];

export function Home() {
  return (
    <Afterglow className="flex flex-1 flex-col" layout="hero">
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-20 text-center sm:py-28">
        <img
          src="/logo.png"
          alt=""
          className="mx-auto size-20 object-contain drop-shadow-[0_0_36px_rgba(255,106,61,0.45)] sm:size-24"
        />
        <h1 className="mt-8 font-display text-6xl font-light tracking-tight sm:text-7xl">
          <span className="text-muted">open</span>
          <em className="font-normal text-foreground">Ember</em>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-pretty">
          <span className="text-muted">Permissionless synthetic assets launchpad on Elysium.</span>
          <br />
          <span className="text-ember font-display text-xl italic">It has a price? Light it.</span>
        </p>
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-label="Get started">
          <Link
            to="/create"
            className="bg-ember inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium text-accent-foreground"
          >
            Light a ticker
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            to="/trade"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm text-foreground"
          >
            <ChartIcon className="size-4" />
            Trade
          </Link>
          <Link to="/docs" className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm text-muted hover:text-foreground">
            <DocsIcon className="size-4" />
            Docs
          </Link>
        </nav>
        <dl className="mt-16 grid w-full grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border/60 text-left sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.k} className="bg-background/85 px-4 py-3">
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">{stat.k}</dt>
              <dd className="mt-1 font-mono text-[12px] leading-snug text-foreground">{stat.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Afterglow>
  );
}
