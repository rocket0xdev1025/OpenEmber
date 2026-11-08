import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { protocol } from "../data/protocol";
import { useToast } from "../state/toast";
import { useWallet } from "../state/wallet";
import { CloseIcon, DocsIcon, MenuIcon, WalletIcon } from "./Icons";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/create", label: "Create", end: false },
  { to: "/trade", label: "Trade", end: false },
  { to: "/docs", label: "Docs", end: false },
];

function Wordmark() {
  return (
    <Link to="/" className="flex shrink-0 items-center" aria-label="openEmber">
      <img src="/logo.png" alt="" className="size-5 object-contain" />
      <span className="ml-2 font-display text-[17px] font-light tracking-tight">
        <span className="text-muted">open</span>
        <em className="font-normal">Ember</em>
      </span>
    </Link>
  );
}

function ChainPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-secondary" />
      </span>
      {protocol.chain.name}
    </span>
  );
}

function ConnectControl({ className = "" }: { className?: string }) {
  const { connected, address, disconnect, openConnect } = useWallet();
  const { notify } = useToast();

  if (connected && address) {
    return (
      <button
        type="button"
        onClick={() => {
          disconnect();
          notify("Preview wallet disconnected");
        }}
        className={`inline-flex items-center gap-2 text-[13px] tracking-[0.02em] text-muted transition-colors hover:text-foreground ${className}`}
      >
        <WalletIcon className="size-3.5" />
        <span className="font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openConnect}
      className={`inline-flex items-center gap-2 text-[13px] tracking-[0.02em] text-muted transition-colors hover:text-foreground ${className}`}
    >
      <WalletIcon className="size-3.5" />
      Connect Wallet
    </button>
  );
}

export function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90">
        <div className="flex h-14 items-center justify-between gap-8 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-10">
            <Wordmark />
            <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `text-[13px] tracking-[0.02em] transition-colors ${isActive ? "text-foreground" : "text-muted hover:text-foreground"}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <ChainPill />
            <ConnectControl />
          </div>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center text-muted md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon className="size-4" /> : <MenuIcon className="size-4" />}
          </button>
        </div>
        {menuOpen ? (
          <div className="flex flex-col gap-6 px-5 pb-6 md:hidden">
            <div className="flex items-center justify-between gap-4">
              <ChainPill />
              <ConnectControl />
            </div>
            <nav className="flex flex-col gap-4" aria-label="Main">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-[13px] tracking-[0.02em] ${isActive ? "text-foreground" : "text-muted"}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <footer>
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[12px] text-muted">
            <span className="font-sans tracking-[0.02em]">CA</span>
            <span className="font-sans tracking-[0.02em]">0x5cf58da30b62aca1c7a735a680279fbedaa7189c</span>
          </div>
          <Link to="/docs" aria-label="Docs" title="Docs" className="text-muted transition-colors hover:text-foreground">
            <DocsIcon className="size-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
