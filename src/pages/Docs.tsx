import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Afterglow } from "../components/Afterglow";
import { protocol } from "../data/protocol";

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "architecture", label: "Architecture" },
  { id: "contracts", label: "Contracts" },
  { id: "create", label: "Create" },
  { id: "cdp", label: "CDP Engine" },
  { id: "c-ratio", label: "Collateral Ratio" },
  { id: "market-guard", label: "Market Guard" },
  { id: "liquidations", label: "Liquidations" },
  { id: "risks", label: "Risks" },
  { id: "token", label: "Token" },
];

const zero = "0x000000…000000";

const contracts = [
  ["$EMBR", "external", "Protocol token. Buybacks burn it. It is not a synthetic."],
  ["SyntheticFactory", "SyntheticFactory.sol", "Creates a ticker, deploys its ERC-20, and registers the feed. Starts closed."],
  ["SyntheticAsset", "SyntheticAsset.sol", "ERC-20 implementation. Each ticker is its own clone."],
  ["CDPVaultManager", "CDPVaultManager.sol", "Holds USDC, tracks debt, applies the live MCR, and liquidates."],
  ["OracleAdapter", "OracleAdapter.sol", "Reads Pyth or Chainlink and the cash-market clock."],
  ["PoolSeeder", "PoolSeeder.sol", "Collects the USDC seed and posts the genesis book at the oracle."],
  ["ProtocolTreasury", "ProtocolTreasury.sol", "Create fees and the protocol share of swap fees. Cover pays from the reserve."],
  ["GenesisBook", "GenesisBook.sol", "eTICKER / USDC book. A slice of genesis LP stays locked."],
  ["EmberHook", "ForgeHook.sol", "Takes most of the swap fee and splits it between protocol and creator."],
];

export function Docs() {
  const [active, setActive] = useState("introduction");

  useEffect(() => {
    if (window.location.hash === "#launch") {
      window.history.replaceState(null, "", "#create");
      document.getElementById("create")?.scrollIntoView();
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id && sections.some((section) => section.id === id)) setActive(id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    for (const section of sections) {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <Afterglow layout="band">
        <header className="relative z-10 mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-16">
          <p className="text-[11px] tracking-[0.18em] text-muted uppercase">Documentation</p>
          <h1 className="mt-3 font-display text-4xl font-normal tracking-tight sm:text-6xl">How openEmber works</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            Elysium is a Hyperliquid L2 with 100 ms blocks. openEmber is the primitive that lets anyone light a synthetic against a price feed on it.
          </p>
        </header>
      </Afterglow>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
        <nav className="flex gap-6 overflow-x-auto lg:sticky lg:top-20 lg:flex lg:h-fit lg:flex-col lg:gap-2.5 lg:overflow-visible" aria-label="Documentation">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`shrink-0 text-[13px] tracking-[0.02em] transition-colors ${active === section.id ? "text-foreground" : "text-muted hover:text-foreground"}`}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <article className="prose-docs min-w-0 max-w-3xl">
          <section id="introduction">
            <h2>Introduction</h2>
            <p>
              Elysium is Kinetiq's general-purpose L2 for Hyperliquid. It settles to HyperEVM, charges gas in HYPE, and produces a block every 100 ms. Hyperliquid already prices perps, HIP-3 markets, and spot. It does not ship a permissionless way to collateralize an off-chain name. Someone still has to decide that the name exists.
            </p>
            <p>
              openEmber is that missing piece, carried over from Forge on Robinhood Chain. The vault, the oracle guard, and the genesis book are the same shape of system. The chain, the collateral, and the brand are new.
            </p>
            <p>
              If the adapter will price a name, anyone can deploy it. The factory writes an ERC-20 such as <code>eAAPL</code> or <code>eNVDA</code>, collects a {protocol.collateral.symbol} seed, and once that seed fills it posts a book at the oracle and opens the vault. An eTICKER is not a share. It does not vote, it does not pay a dividend unless a later module adds one, and it is not a claim on the issuer, a broker, or a transfer agent. It targets the oracle price of the underlying.
            </p>
            <h3>Mirror on Terra</h3>
            <p>
              The mint, burn, and arbitrage loop is the one Mirror used. Lock collateral, mint the synthetic, sell it if you want the short, and let traders pull the pool back to the oracle. The vault does not set the pool price. Traders do, while mint and burn are open.
            </p>
            <p>Mirror failed in three separate ways:</p>
            <ul>
              <li>Collateral was UST. When the unit of account left the dollar, vaults that were fine against the stock were insolvent in the token that backed them.</li>
              <li>Oracles kept printing after the cash market shut. Weekend and halt prices could mint and liquidate, so Monday gaps hit vaults the protocol had already marked as healthy.</li>
              <li>The list was curated and the collateral ratio was flat. A penny name and a large cap posted the same floor.</li>
            </ul>
            <p>
              openEmber keeps the loop and changes those three inputs. Create is open to anyone the feed will price. Collateral is only {protocol.collateral.symbol}. The minimum ratio rises with the name's volatility score. Mint and burn wait for a usable open print. The pool stays open overnight. Liquidations may still use a stale spot so a noisy tape cannot freeze them, and a halt still blocks anything that needs a price.
            </p>
            <h3>Who is in the system</h3>
            <p>
              Each synthetic is its own token, its own vault book, and its own {protocol.collateral.symbol} pool. A halt or a blown vault on one ticker does not freeze another.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>What they do</th>
                  <th>Exposure</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Creator</td>
                  <td>Pays the fee, names the feed, and posts the first seed.</td>
                  <td>No free tokens. Pro-rata LP and genesis vault after the book posts, then {protocol.creatorSharePercent}% of the hook take.</td>
                </tr>
                <tr>
                  <td>Seeder</td>
                  <td>Adds {protocol.collateral.symbol} during the seed window.</td>
                  <td>Pro-rata claim on 90% of genesis LP and the backing vault. 10% stays locked so an exit cannot empty the book.</td>
                </tr>
                <tr>
                  <td>Vault minter</td>
                  <td>Locks {protocol.collateral.symbol} and mints up to the live ratio.</td>
                  <td>Short if they sell. A costly long if they hold.</td>
                </tr>
                <tr>
                  <td>Pool trader</td>
                  <td>Swaps or LPs the eTICKER / {protocol.collateral.symbol} book.</td>
                  <td>Long the synthetic, or inventory risk versus the underlying.</td>
                </tr>
                <tr>
                  <td>Liquidator</td>
                  <td>Posts eTICKER against a vault under its ratio.</td>
                  <td>A {protocol.liquidationBonusPercent}% {protocol.collateral.symbol} bonus when the vault can pay it.</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="architecture">
            <h2>Architecture</h2>
            <p>
              Six contracts plus ${protocol.tokenSymbol} make the protocol. Addresses are read from config and stay at zero until a deploy is written there. Every token in circulation came from a vault that locked {protocol.collateral.symbol}, including the inventory that opens the pool.
            </p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border/70 sm:grid-cols-3">
              {[
                ["Create", "Anyone pays the USDC fee"],
                ["Entry", "SyntheticFactory deploys and registers"],
                ["Core", "SyntheticAsset, the eTICKER ERC-20"],
                ["Debt", "CDPVaultManager holds USDC"],
                ["Seed", "PoolSeeder waits on a good print"],
                ["Gate", "OracleAdapter, Pyth / Chainlink and hours"],
                ["Market", "GenesisBook, 1% fee, swaps stay open"],
                ["Treasury", "Fees, buyback bucket, and the reserve"],
              ].map(([title, body]) => (
                <div key={title} className="bg-background px-4 py-3">
                  <p className="text-[11px] tracking-[0.14em] text-muted uppercase">{title}</p>
                  <p className="mt-1 text-[13px] text-foreground">{body}</p>
                </div>
              ))}
            </div>
            <h3>What each contract does</h3>
            <ul>
              <li>
                <span className="text-foreground">SyntheticFactory</span> is the only create path. <code>createSynthetic</code> deploys the token, registers the feed, stores the trusted volatility, and opens the seed. The call reverts until the owner enables create.
              </li>
              <li>
                <span className="text-foreground">SyntheticAsset</span> is the ERC-20. Mint and burn are limited to the vault manager. Holders can transfer and LP it like any other token.
              </li>
              <li>
                <span className="text-foreground">CDPVaultManager</span> holds {protocol.collateral.symbol}, accounts debt, computes the live ratio, and runs liquidations. Mint and burn wait on a quality open print.
              </li>
              <li>
                <span className="text-foreground">OracleAdapter</span> reads Pyth and Chainlink, checks confidence and TWAP, and reports whether the cash market is open, closed, or halted.
              </li>
              <li>
                <span className="text-foreground">PoolSeeder</span> holds incoming {protocol.collateral.symbol} until the listing threshold. On a good print it mints genesis inventory against a vault and posts the book at the oracle.
              </li>
              <li>
                <span className="text-foreground">ProtocolTreasury</span> receives the {protocol.creationFeeUsdc} {protocol.collateral.symbol} create fee and the protocol cut of hook fees. Half of each create fee is the buyback bucket. Cover pays from the reserve.
              </li>
            </ul>
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Who</th>
                  <th>Blocked when</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>createSynthetic</td>
                  <td>Anyone with the fee</td>
                  <td>Create is off, or the feed is not trusted</td>
                </tr>
                <tr>
                  <td>Seed</td>
                  <td>Anyone, until listing</td>
                  <td>Threshold already filled, or the ticker is live</td>
                </tr>
                <tr>
                  <td>Withdraw seed</td>
                  <td>Seeder, before the pool posts</td>
                  <td>Seed already minted into the pool</td>
                </tr>
                <tr>
                  <td>Exit seed</td>
                  <td>Seeder, after listing, while the feed is open</td>
                  <td>Session closed, already exited, or no remaining share</td>
                </tr>
                <tr>
                  <td>Mint, burn, withdraw</td>
                  <td>Vault owner, after listing</td>
                  <td>Market closed, halt, or a rejected print</td>
                </tr>
                <tr>
                  <td>Liquidate</td>
                  <td>Anyone holding the debt token</td>
                  <td>Guard tightens off-hours. A stale print cannot wipe the vault</td>
                </tr>
                <tr>
                  <td>Pool swap</td>
                  <td>Anyone, after a pool exists</td>
                  <td>Not by the market guard</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="contracts">
            <h2>Contracts</h2>
            <p>
              Addresses flip off the zero address once a deploy is written into config. {protocol.collateral.symbol} is collateral, not an openEmber contract. Nothing below is deployed yet.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Role</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(([name, file, role]) => (
                  <tr key={name}>
                    <td>
                      {name}
                      <div className="mt-1 font-mono text-[11px] text-muted">{file}</div>
                    </td>
                    <td>{role}</td>
                    <td>
                      <div className="font-mono text-[12px] text-foreground">{zero}</div>
                      <div className="mt-1 text-[12px]">Not deployed</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section id="create">
            <h2>Create</h2>
            <p>
              A ticker has three phases. Deploy leaves create off. After <code>enableCreate</code>, the factory call is permissionless. The seed window, the open book, and the closed session are protocol state.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Phase 1", "Seed", `USDC in. No eTICKER until the pool posts at the oracle.`],
                ["Phase 2", "Open market", "Pool live at the feed. Vault mint and burn. Arb holds the peg."],
                ["Phase 3", "Session close", "CDP frozen. The book still trades. It returns to phase 2 at the open."],
              ].map(([phase, title, body]) => (
                <div key={phase} className="border border-border px-4 py-3">
                  <p className="text-[11px] tracking-[0.14em] text-muted uppercase">{phase}</p>
                  <p className="mt-2 font-display text-xl text-foreground">{title}</p>
                  <p className="mt-2 text-[13px]">{body}</p>
                </div>
              ))}
            </div>
            <h3>Creating a ticker</h3>
            <p>
              Anyone calls the factory with a symbol and a supported feed, and pays the {protocol.creationFeeUsdc} {protocol.collateral.symbol} fee plus a seed. Volatility has to match the score stored when that feed was trusted. The create form's seed is the first {protocol.collateral.symbol} in the window. No eTICKER is minted in that transaction. Use the <Link to="/create">create form</Link> once the factory is live.
            </p>
            <h3>Liquidity seed</h3>
            <p>
              Phase 1 is a {protocol.collateral.symbol} raise, not a bonding curve. The listing amount is sized so every name opens with the same dollar depth in the pool, then scaled by that name's posting ratio so genesis supply matches. Posting collateral sits {protocol.genesisBufferBps / 100}% above the liquidation ratio, so the genesis vault is not on the line at the listing print.
            </p>
            <p>
              Anyone can add {protocol.collateral.symbol} until the pot hits the seed. Later seeders do not pay a higher price. If the threshold never fills, seeders withdraw. The pool posts on the next good print after the threshold is met. The {protocol.seedTargetPoolUsdc.toLocaleString("en-US")} {protocol.collateral.symbol} pool floor is what the create form uses until a live oracle price would require more.
            </p>
            <p>Starting MCR is <code>round({protocol.baseMcrPercent} + {protocol.mcrAlpha} × volatility)</code>. A quiet equity at 28% vol opens at 184%.</p>
            <h3>Fees</h3>
            <p>
              Create pays {protocol.creationFeeUsdc} {protocol.collateral.symbol} to the treasury. That fee is not seed and not a vault deposit. {protocol.creationFeeBuybackPercent}% credits the buyback bucket. The rest is withdrawable revenue. Buyback does not run until the owner points it at a set ${protocol.tokenSymbol} pool.
            </p>
            <p>
              Each listed book charges {protocol.swapFeePercent}% on swaps. {protocol.hookLpSharePercent}% of that fee stays in the book. Of the rest, {protocol.protocolSharePercent}% goes to the treasury and {protocol.creatorSharePercent}% to the ticker creator.
            </p>
          </section>

          <section id="cdp">
            <h2>CDP Engine</h2>
            <p>
              After listing, minting is a debt position. Deposit {protocol.collateral.symbol}, then mint eTICKER up to the live ratio. Selling the mint is the short. Holding it is a capital-heavy long, because the same exposure can be bought on the pool without posting the full ratio.
            </p>
            <ol className="mt-4 list-none space-y-3 pl-0">
              {[
                ["01", "Deposit USDC", "Collateral only. Nothing is minted yet."],
                ["02", "Mint eTICKER", "Up to the live ratio, and only while the market is open."],
                ["03", "Sell or hold", "A sale is the short. A hold is a costly long."],
                ["04", "Burn, then withdraw", "Debt first. Unused collateral after that."],
              ].map(([step, title, body]) => (
                <li key={step} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-3">
                  <span className="font-mono text-[12px] text-accent">{step}</span>
                  <span>
                    <span className="text-foreground">{title}</span>
                    <span className="mt-1 block text-[13px]">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <h3>Worked mint</h3>
            <p>
              Penny name, live ratio 300%, oracle 1 {protocol.collateral.symbol} per token. Deposit 300 {protocol.collateral.symbol} and you may mint 100 tokens. You are on the floor. Any rise in the oracle, or any drop in the collateral mark, makes the vault liquidatable.
            </p>
            <h3>Peg arbitrage</h3>
            <p>The vault does not set the pool price. Arbitrage does, and only while the guard says the cash market is open.</p>
            <p>
              If the pool is above the oracle, mint and sell. Supply pushes the price toward the feed. If the pool is below the oracle, buy and burn. Demand lifts the pool, and the burn unlocks {protocol.collateral.symbol}. That is why a minter who sells is short, and why a long who wants inventory buys the pool instead of minting.
            </p>
          </section>

          <section id="c-ratio">
            <h2>Collateral Ratio</h2>
            <p>
              The floor is not a constant. Each ticker carries a volatility score bound when the feed was trusted. <code>createSynthetic</code> must pass that same score or it reverts.
            </p>
            <p>
              <code>MCR = round({protocol.baseMcrPercent} + {protocol.mcrAlpha} × VolatilityScore)</code>
            </p>
            <p>
              A quiet large cap sits near {protocol.largeCapMcr.min}–{protocol.largeCapMcr.max}%. A name scored like a penny stock can reach {protocol.pennyMcr.min}–{protocol.pennyMcr.max}%. Raising the live ratio does not seize a healthy vault. It raises the floor for new mints and for withdrawals, and it pulls thin vaults closer to liquidation.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Vol</th>
                  <th>MCR</th>
                  <th>USDC for 100 of debt</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Large cap</td>
                  <td>28%</td>
                  <td>184%</td>
                  <td>184</td>
                </tr>
                <tr>
                  <td>ETF</td>
                  <td>16%</td>
                  <td>169%</td>
                  <td>169</td>
                </tr>
                <tr>
                  <td>Stressed name</td>
                  <td>145%</td>
                  <td>324%</td>
                  <td>324</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="market-guard">
            <h2>Market Guard</h2>
            <p>
              The adapter is a price source and a circuit breaker. A print is rejected when it is stale, when the confidence band is too wide, or when it fails a TWAP check. On top of that, the adapter follows the session for the underlying: cash hours for equities, the FX week, COMEX or LME hours for metals, and the commodity venue.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Open", "Mint, burn, and full liquidations.", "Leaves to closed at the cash close, or halted on a per-name halt."],
                ["Closed", "Vault frozen. Pool still live.", "Weekends, holidays, and the regular close. Back to open on a good session."],
                ["Halted", "That ticker only.", "Other names keep their own clock. Open again when the halt lifts."],
              ].map(([title, body, note]) => (
                <div key={title} className="border border-border px-4 py-3">
                  <p className="font-display text-xl text-foreground">{title}</p>
                  <p className="mt-2 text-[13px] text-foreground">{body}</p>
                  <p className="mt-2 text-[13px]">{note}</p>
                </div>
              ))}
            </div>
            <p>
              You can still trade when the cash market is closed. You cannot mint or burn through a vault, and the overnight pool price is not the cash print. The peg is enforced during the session.
            </p>
          </section>

          <section id="liquidations">
            <h2>Liquidations</h2>
            <p>A vault can be liquidated when it is under the live ratio and the guard allows it.</p>
            <ol className="mt-4 list-none space-y-3 pl-0">
              {[
                ["01", "Vault under the ratio", "The guard has to allow the call."],
                ["02", "Liquidator posts eTICKER", "The full debt, or a slice of it."],
                ["03", "Debt is burned", `USDC out, plus a ${protocol.liquidationBonusPercent}% bonus.`],
                ["04", "Remainder or reserve", "The owner keeps leftover collateral. A shortfall hits the reserve."],
              ].map(([step, title, body]) => (
                <li key={step} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-3">
                  <span className="font-mono text-[12px] text-accent">{step}</span>
                  <span>
                    <span className="text-foreground">{title}</span>
                    <span className="mt-1 block text-[13px]">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <h3>Worked liquidation</h3>
            <p>
              Same 300 {protocol.collateral.symbol} / 100 token vault, ratio 300%. If the oracle jumps to 1.20, required collateral is 360. The vault is 60 short of the floor. The liquidator burns the debt and takes the collateral plus the bonus. The owner loses the cushion and the bonus. That is the cost of sitting on the floor through a gap.
            </p>
            <h3>Reserve fund</h3>
            <p>
              A penny name can gap hard at the open. A vault that was healthy at Friday's close can be underwater before a liquidator sees the first good print. Create-fee revenue and the protocol's hook cut can fund a reserve. The reserve is a buffer, not a promise that every vault is made whole. A weekend of gaps can exhaust it. After that, leftover debt is unbacked inventory.
            </p>
          </section>

          <section id="risks">
            <h2>Risks</h2>
            <p>
              Read this before you mint, LP, or buy a synthetic. openEmber does not hold the underlying. An eTICKER is a claim on protocol accounting, not on the company, a broker, or a transfer agent.
            </p>
            <ul>
              <li>Oracle failure, a bad confidence band, or a halt that lifts into a gap can liquidate vaults that looked safe at the previous close.</li>
              <li>The pool can trade far from the cash print while the vault is frozen. That price is not a mintable quote.</li>
              <li>LP inventory loses against a name that doubles, even if the fee share is attractive.</li>
              <li>The reserve can run out. After that, synthetic supply can exceed the {protocol.collateral.symbol} that backs it.</li>
              <li>Contracts are not deployed on {protocol.chain.name} yet. Nothing on this site can move funds until they are.</li>
            </ul>
          </section>

          <section id="token">
            <h2>Token</h2>
            <p>
              ${protocol.tokenSymbol} is the protocol token on {protocol.chain.name}. It is not an eTICKER. eTICKER names are the synthetics. What is specified today: {protocol.creationFeeBuybackPercent}% of every {protocol.creationFeeUsdc} {protocol.collateral.symbol} create fee credits a buyback bucket. The other half is protocol revenue. Buyback is owner-triggered, not a schedule. Supply and any incentive role get published with the deployment.
            </p>
            <p className="text-foreground">${protocol.tokenSymbol} contract</p>
            <p>0x5cf58da30b62aca1c7a735a680279fbedaa7189c</p>
            <p>
              Collateral for synthetics is {protocol.collateral.symbol}, not ${protocol.tokenSymbol}. The collateral address is {zero}, 6 decimals, on {protocol.chain.name}. Do not send {protocol.collateral.symbol} or ${protocol.tokenSymbol} on another network and expect a vault to see it.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
