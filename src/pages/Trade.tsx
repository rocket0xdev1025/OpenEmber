import { Link } from "react-router-dom";
import { Afterglow } from "../components/Afterglow";
import { HelpIcon } from "../components/Icons";
import { protocol } from "../data/protocol";

export function Trade() {
  return (
    <div>
      <Afterglow layout="band">
        <header className="relative z-10 mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-16">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-display text-[1.75rem] leading-none font-normal tracking-tight sm:text-5xl">Trade</h1>
            <Link
              to="/docs#cdp"
              className="inline-flex shrink-0 items-center gap-1.5 text-[13px] tracking-[0.02em] text-muted transition-colors hover:text-foreground"
            >
              <HelpIcon className="size-3.5" />
              Peg docs
            </Link>
          </div>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted sm:mt-5 sm:text-[15px]">
            Buy and sell listed synthetics. Premium prints mint and sell on the pool. Discount prints buy the pool and burn in the vault.
          </p>
        </header>
      </Afterglow>
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:items-start lg:gap-20">
          <section className="order-2 min-w-0 lg:order-1">
            <h2 className="font-display text-2xl font-normal tracking-tight">Near listing</h2>
            <ul className="mt-6 border-y border-border">
              <li className="py-4 text-[13px] text-muted">Factory is not deployed on {protocol.chain.name} yet.</li>
            </ul>
            <h2 className="mt-12 font-display text-2xl font-normal tracking-tight">Listed</h2>
            <ul className="mt-6 border-y border-border">
              <li className="py-4 text-[13px] text-muted">Listed books show here after deploy.</li>
            </ul>
          </section>
          <aside className="order-1 min-w-0 lg:order-2">
            <p className="text-sm text-muted">Create a ticker first. Live seed windows and listed books land here.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
