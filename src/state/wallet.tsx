import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { CloseIcon } from "../components/Icons";
import { protocol } from "../data/protocol";
import { useToast } from "./toast";

type WalletContextValue = {
  connected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
  openConnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const previewAddress = "0xA11ce00000000000000000000000000000E4b7";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [open, setOpen] = useState(false);
  const { notify } = useToast();
  const value = useMemo<WalletContextValue>(
    () => ({
      connected,
      address: connected ? previewAddress : null,
      connect: () => setConnected(true),
      disconnect: () => setConnected(false),
      openConnect: () => setOpen(true),
    }),
    [connected],
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-labelledby="connect-title"
            className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="connect-title" className="font-display text-2xl font-normal tracking-tight">
                  Connect wallet
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  Local preview only. Nothing is signed, and no wallet extension is contacted. The factory is not deployed on {protocol.chain.name}.
                </p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <CloseIcon className="size-4" />
              </button>
            </div>
            <button
              type="button"
              className="bg-ember mt-5 h-11 w-full rounded-md text-sm font-medium text-accent-foreground"
              onClick={() => {
                setConnected(true);
                setOpen(false);
                notify("Preview wallet connected", "No transaction will be sent.");
              }}
            >
              Continue in preview
            </button>
          </div>
        </div>
      ) : null}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
