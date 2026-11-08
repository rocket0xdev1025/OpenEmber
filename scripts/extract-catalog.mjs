const source = "https://openember.app/assets/index-Cdu66irK.js";
const response = await fetch(source);
if (!response.ok) throw new Error(`Failed to fetch bundle: ${response.status}`);
const text = await response.text();
const marker = "assets:[{id:";
const start = text.indexOf(marker);
if (start < 0) throw new Error("Catalog marker not found");
const arrayStart = text.indexOf("[", start);
let depth = 0;
let end = arrayStart;
for (; end < text.length; end++) {
  const char = text[end];
  if (char === "`") {
    end++;
    while (end < text.length && text[end] !== "`") {
      if (text[end] === "\\") end++;
      end++;
    }
    continue;
  }
  if (char === "[") depth++;
  else if (char === "]") {
    depth--;
    if (depth === 0) {
      end++;
      break;
    }
  }
}
const raw = text.slice(arrayStart, end);
const pattern =
  /\{id:`([^`]*)`,symbol:`([^`]*)`,name:`([^`]*)`,region:`([^`]*)`,quote:`([^`]*)`,pyth:`([^`]*)`,kind:`([^`]*)`\}/g;
const assets = [];
for (const match of raw.matchAll(pattern)) {
  assets.push({
    id: match[1],
    symbol: match[2],
    name: match[3],
    region: match[4],
    quote: match[5],
    pyth: match[6],
    kind: match[7],
  });
}
if (assets.length < 1000) {
  throw new Error(`Expected the full catalog, parsed ${assets.length}`);
}
const { mkdir, writeFile } = await import("node:fs/promises");
await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../src/data/catalog.json", import.meta.url),
  JSON.stringify(assets),
);
console.log(`wrote ${assets.length} assets`);
