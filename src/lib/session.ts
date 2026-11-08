import type { Asset } from "../data/assets";

type Zoned = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutes: number;
};

type Span = {
  startDay: number;
  startMin: number;
  endDay: number;
  endMin: number;
};

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const WEEKDAYS = [1, 2, 3, 4, 5];

function zonedParts(date: Date, timeZone: string): Zoned {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(read("hour"));
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    weekday: weekdayIndex[read("weekday")] ?? 0,
    minutes: (hour === 24 ? 0 : hour) * 60 + Number(read("minute")),
  };
}

function timeZoneOffset(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    Math.floor(parts.minutes / 60),
    parts.minutes % 60,
  );
  return asUtc - date.getTime();
}

function wallTime(year: number, month: number, day: number, minutes: number, timeZone: string) {
  const guess = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
  return new Date(guess - timeZoneOffset(new Date(guess), timeZone));
}

function shiftDays(parts: Zoned, days: number, timeZone: string) {
  const noon = wallTime(parts.year, parts.month, parts.day, 12 * 60, timeZone);
  return zonedParts(new Date(noon.getTime() + days * 86_400_000), timeZone);
}

function formatStamp(date: Date, timeZone: string) {
  return date.toLocaleString("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function sameDaySpans(days: number[], open: number, close: number): Span[] {
  return days.map((day) => ({ startDay: day, startMin: open, endDay: day, endMin: close }));
}

function describe(timeZone: string, spans: Span[], fallback: string, now = new Date()) {
  const here = zonedParts(now, timeZone);
  let nextOpen: Date | null = null;

  for (let offset = -7; offset < 10; offset++) {
    const day = shiftDays(here, offset, timeZone);
    for (const span of spans) {
      if (day.weekday !== span.startDay) continue;
      const open = wallTime(day.year, day.month, day.day, span.startMin, timeZone);
      const endShift = (span.endDay - span.startDay + 7) % 7;
      const endDay = shiftDays(day, endShift, timeZone);
      const close = wallTime(endDay.year, endDay.month, endDay.day, span.endMin, timeZone);
      if (close <= open) continue;
      if (now >= open && now < close) return `Open now · closes ${formatStamp(close, timeZone)}`;
      if (now < open && (nextOpen == null || open < nextOpen)) nextOpen = open;
    }
  }

  return nextOpen ? `Closed · next ${formatStamp(nextOpen, timeZone)}` : `Closed · ${fallback}`;
}

const equity: Record<string, { timeZone: string; spans: Span[] }> = {
  US: { timeZone: "America/New_York", spans: sameDaySpans(WEEKDAYS, 9 * 60 + 30, 16 * 60) },
  HK: { timeZone: "Asia/Hong_Kong", spans: sameDaySpans(WEEKDAYS, 9 * 60 + 30, 16 * 60) },
  JP: { timeZone: "Asia/Tokyo", spans: sameDaySpans(WEEKDAYS, 9 * 60, 15 * 60) },
  KR: { timeZone: "Asia/Seoul", spans: sameDaySpans(WEEKDAYS, 9 * 60, 15 * 60 + 30) },
  CN: { timeZone: "Asia/Shanghai", spans: sameDaySpans(WEEKDAYS, 9 * 60 + 30, 15 * 60) },
  TW: { timeZone: "Asia/Taipei", spans: sameDaySpans(WEEKDAYS, 9 * 60, 13 * 60 + 30) },
  IN: { timeZone: "Asia/Kolkata", spans: sameDaySpans(WEEKDAYS, 9 * 60 + 15, 15 * 60 + 30) },
};

const comexSpans: Span[] = [0, 1, 2, 3, 4].map((day) => ({
  startDay: day,
  startMin: 18 * 60,
  endDay: day === 4 ? 5 : day + 1,
  endMin: day === 4 ? 17 * 60 : 17 * 60,
}));

export function sessionLabel(asset: Asset, now = new Date()) {
  if (asset.region === "FX") {
    return describe(
      "America/New_York",
      [{ startDay: 0, startMin: 17 * 60, endDay: 5, endMin: 17 * 60 }],
      asset.hours,
      now,
    );
  }
  if (asset.assetClass === "metal" && asset.symbol.endsWith("3M")) {
    return describe("Europe/London", sameDaySpans(WEEKDAYS, 60, 19 * 60), asset.hours, now);
  }
  if (asset.assetClass === "metal" || asset.assetClass === "commodity") {
    return describe("America/New_York", comexSpans, asset.hours, now);
  }
  const cash = equity[asset.region];
  if (!cash) return asset.hours;
  return describe(cash.timeZone, cash.spans, asset.hours, now);
}
