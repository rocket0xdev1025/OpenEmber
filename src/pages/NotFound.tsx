import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-5 py-24 text-center sm:px-8">
      <p className="font-display text-6xl font-normal tracking-tight">404</p>
      <p className="max-w-sm text-muted">This page doesn't exist. It may have been moved or never existed.</p>
      <Link to="/" className="bg-ember inline-flex h-11 items-center rounded-md px-4 text-sm font-medium text-accent-foreground">
        Back home
      </Link>
    </div>
  );
}
