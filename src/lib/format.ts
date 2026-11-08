export function formatAmount(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function parseAmount(value: string) {
  const amount = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
