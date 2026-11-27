import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpenCheck,
  ChartPie,
  DatabaseZap,
  GitBranch,
  LineChart,
  Receipt,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import DemoButton from "@/components/landing/DemoButton";
import ChangeText from "@/components/ChangeText";
import { getLandingData, type LandingDemo } from "@/lib/services/landing.service";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

// Regenerated at most once a minute: live enough for prices, cheap for traffic.
export const revalidate = 60;

export const metadata = {
  title: { absolute: "StockLens: practise investing with real market prices" },
  description:
    "Paper-trade US stocks with $100,000 in virtual cash at live prices. Preview every order, see where your money is, and get an AI review of your portfolio.",
};

const SERIES = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-3)",
  "var(--color-series-4)",
  "var(--color-series-5)",
  "var(--color-series-6)",
];
const REPO = "https://github.com/Aditya-Khetawat/StockLens-Stock-Tracker-App";

export default async function Landing() {
  const { quotes, demo } = await getLandingData();
  const ticketQuote = quotes.find((q) => q.symbol === "NVDA") ?? quotes[0];

  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <LandingNav />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="container grid items-center gap-14 pt-14 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pt-20 lg:pb-28">
            <div className="flex max-w-xl flex-col gap-7">
              <h1 className="animate-rise text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.04em] text-fg sm:text-6xl lg:text-[4.25rem]">
                Practise investing with real market prices.
              </h1>
              <p className="animate-rise text-lg leading-relaxed text-fg-muted [animation-delay:60ms]">
                StockLens gives you <span className="figure font-semibold text-fg">$100,000</span> in virtual cash to
                trade US stocks at live prices, then shows you exactly how your decisions play out. Every lesson, none
                of the losses.
              </p>
              <div className="animate-rise flex flex-wrap items-center gap-3 [animation-delay:120ms]">
                <DemoButton size="lg" />
                <Link href="/sign-up" className="btn-secondary h-11 px-5 text-[0.9375rem]">
                  Create a free account
                </Link>
              </div>
              <ul className="animate-rise flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-subtle [animation-delay:180ms]">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-fg-muted" aria-hidden="true" />
                  Paper trading only, no real money
                </li>
                <li className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-fg-muted" aria-hidden="true" />
                  Demo opens in one click, no sign-up
                </li>
              </ul>
            </div>

            <HeroProduct demo={demo} ticket={ticketQuote} />
          </div>
        </section>

        {/* ── Live prices ──────────────────────────────────────────────── */}
        {quotes.length > 0 && (
          <section aria-labelledby="prices-heading" className="border-b border-line bg-surface/40">
            <div className="container py-8">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="prices-heading" className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <span className="live-dot h-2 w-2 rounded-full bg-gain" aria-hidden="true" />
                  The prices you trade at, right now
                </h2>
                <p className="text-xs text-fg-subtle">US market quotes from Finnhub, up to a minute old</p>
              </div>
              <ul className="grid grid-cols-2 overflow-hidden rounded-xl border border-line sm:grid-cols-4 lg:grid-cols-8">
                {quotes.map((q, i) => (
                  <li
                    key={q.symbol}
                    className={cn(
                      "flex flex-col gap-1 border-line bg-surface px-4 py-3.5",
                      i % 2 === 1 && "border-l",
                      "sm:border-l sm:[&:nth-child(4n+1)]:border-l-0 lg:[&:nth-child(4n+1)]:border-l lg:[&:first-child]:border-l-0",
                      i >= 2 && "max-sm:border-t",
                      i >= 4 && "sm:max-lg:border-t",
                    )}
                  >
                    <span className="font-mono text-xs font-semibold text-fg-muted">{q.symbol}</span>
                    <span className="figure text-base font-semibold text-fg">{formatUsd(q.price)}</span>
                    <ChangeText percent={q.changePercent} className="text-xs font-semibold" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Product ──────────────────────────────────────────────────── */}
        <section id="product" aria-labelledby="product-heading" className="scroll-mt-20 border-b border-line">
          <div className="container flex flex-col gap-24 py-24 lg:gap-32 lg:py-32">
            <div className="reveal max-w-2xl">
              <h2 id="product-heading" className="text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-[2.5rem] sm:leading-[1.1]">
                Everything a brokerage shows you. None of the risk.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-fg-muted">
                StockLens behaves like the real thing, so the habits you build carry over: you see the cost before you
                commit, where every dollar sits, and what your choices did.
              </p>
            </div>

            <FeatureRow
              icon={Receipt}
              title="Every order is previewed before it fills"
              body="Pick a stock and a size, and the ticket shows the live price, the estimated cost, and exactly how much cash and how many shares you will have afterwards. Max buys as many shares as your cash allows."
              points={["Live price on every ticket", "Cash and shares after the order", "Clear limits: whole shares, never more than you can afford"]}
              visual={<TicketVisual quote={ticketQuote} />}
            />
            <FeatureRow
              flip
              icon={ChartPie}
              title="See where your money actually is"
              body="Your whole account is drawn as one bar, every holding at exactly its share. Insights call out what matters, computed only from your own positions: concentration, cash levels, your best and worst holdings."
              points={["Allocation drawn to scale", "Insights from your positions, never guesses", "Performance recorded after every market close"]}
              visual={demo ? <AllocationVisual demo={demo} /> : null}
            />
            <FeatureRow
              icon={Sparkles}
              title="An AI analyst, on demand"
              body="One click asks Gemini for a structured review of your live portfolio: a summary, concentration risk, diversification across sectors, and what to look at next. When there is not enough history for a metric, it says so instead of inventing one."
              points={["Built from your actual positions", "Risk, diversification and next steps", "Educational, never financial advice"]}
              visual={<AIVisual />}
            />
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section id="how" aria-labelledby="how-heading" className="scroll-mt-20 border-b border-line bg-surface/40">
          <div className="container py-24">
            <h2 id="how-heading" className="reveal text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-[2.5rem]">
              From zero to your first trade in a minute
            </h2>
            <ol className="reveal mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {[
                ["Get $100,000 to invest", "Open the demo in one click, or create an account and start with $100,000 in virtual cash."],
                ["Trade at live prices", "Search any US stock, preview the order, and buy or sell at the market price."],
                ["Learn from what happens", "Watch performance build day by day, read your insights, and ask for an AI review."],
              ].map(([title, body], i) => (
                <li key={title} className="flex flex-col gap-3 bg-surface p-6 md:p-8">
                  <span className="figure flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-on-brand">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-fg">{title}</h3>
                  <p className="text-[0.9375rem] leading-relaxed text-fg-subtle">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Under the hood ───────────────────────────────────────────── */}
        <section id="engineering" aria-labelledby="eng-heading" className="scroll-mt-20 border-b border-line">
          <div className="container grid gap-12 py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div className="reveal flex flex-col gap-4">
              <h2 id="eng-heading" className="text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-[2.5rem] sm:leading-[1.1]">
                Built like a real brokerage
              </h2>
              <p className="text-lg leading-relaxed text-fg-muted">
                Paper money, production engineering. The numbers you see are the numbers the system can prove.
              </p>
              <p className="text-sm text-fg-subtle">Next.js 16, React 19, MongoDB, Better Auth, Inngest, Finnhub, Gemini.</p>
              <a
                href={REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand hover:text-brand-bright"
              >
                <GitBranch className="h-4 w-4" aria-hidden="true" />
                Read the source on GitHub
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <dl className="reveal grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {[
                [DatabaseZap, "Transactional orders", "Each trade checks cash or shares and writes the result inside one MongoDB transaction, so concurrent orders can never overspend."],
                [BookOpenCheck, "A ledger, not a guess", "Holdings and average cost are replayed from an append-only trade ledger, so history and positions always agree."],
                [LineChart, "Honest performance", "Equity is snapshotted after every US close. Volatility and Sharpe appear only once there are 20 days of history."],
                [ShieldCheck, "Stale prices never trade", "If the market feed drops, cached prices keep pages readable, but orders are refused until a live price returns."],
              ].map(([Icon, title, body]) => {
                const I = Icon as React.ComponentType<{ className?: string }>;
                return (
                  <div key={title as string} className="flex flex-col gap-2 bg-surface p-6">
                    <dt className="flex items-center gap-2.5 font-semibold text-fg">
                      <I className="h-4 w-4 text-brand" aria-hidden="true" />
                      {title as string}
                    </dt>
                    <dd className="text-sm leading-relaxed text-fg-subtle">{body as string}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 border-b border-line">
          <div className="container grid gap-10 py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <h2 id="faq-heading" className="reveal text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-[2.5rem]">
              Questions
            </h2>
            <div className="reveal flex flex-col">
              {[
                ["Is any real money involved?", "No. StockLens is paper trading only. Every account starts with $100,000 in virtual cash, and nothing you do here touches a real brokerage."],
                ["Where do the prices come from?", "Quotes come from Finnhub's US market feed and are cached for up to a minute. Charts and the market overview are embedded from TradingView."],
                ["What is the demo account?", "A shared account anyone can open without signing up. It starts with a few real holdings, and visitors' trades are undone every night."],
                ["What can I trade?", "US-listed stocks, in whole shares, with market orders. There are no options, short selling or limit orders."],
                ["Is the AI review financial advice?", "No. It is an educational summary generated by Gemini from your paper portfolio, and it never invents figures it cannot compute."],
              ].map(([q, a]) => (
                <details key={q} className="group border-b border-line py-5 first:pt-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium text-fg [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden="true"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line text-fg-subtle transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-fg-subtle">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing call ─────────────────────────────────────────────── */}
        <section className="container py-24 text-center lg:py-32">
          <div className="reveal mx-auto flex max-w-2xl flex-col items-center gap-6">
            <h2 className="text-4xl font-semibold tracking-[-0.035em] text-fg sm:text-5xl">
              Make your first trade before your coffee cools.
            </h2>
            <p className="text-lg text-fg-muted">The demo is one click away. Your own account takes thirty seconds.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <DemoButton size="lg" />
              <Link href="/sign-up" className="btn-secondary h-11 px-5 text-[0.9375rem]">
                Create a free account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Image src="/assets/icons/logo.svg" alt="StockLens" width={140} height={32} className="h-6 w-auto self-start" />
            <p className="text-xs text-fg-subtle">
              Paper trading only. No real money is involved. Market data from Finnhub and TradingView.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-subtle">
            <Link href="/sign-in" className="hover:text-fg">Sign in</Link>
            <Link href="/sign-up" className="hover:text-fg">Create account</Link>
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="hover:text-fg">Source code</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/75 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-8">
        <Link href="/" aria-label="StockLens home" className="shrink-0">
          <Image src="/assets/icons/logo.svg" alt="StockLens" width={140} height={32} priority className="h-7 w-auto" />
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-6 text-sm text-fg-subtle md:flex">
          <a href="#product" className="transition-colors hover:text-fg">Product</a>
          <a href="#how" className="transition-colors hover:text-fg">How it works</a>
          <a href="#engineering" className="transition-colors hover:text-fg">Under the hood</a>
          <a href="#faq" className="transition-colors hover:text-fg">FAQ</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/sign-in" className="btn-ghost">Sign in</Link>
          <DemoButton className="hidden sm:inline-flex">Try the demo</DemoButton>
        </div>
      </div>
    </header>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  body,
  points,
  visual,
  flip = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <div className={cn("reveal flex flex-col gap-5", flip && "lg:order-2")}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-brand">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-2xl font-semibold tracking-[-0.025em] text-fg sm:text-3xl">{title}</h3>
        <p className="text-lg leading-relaxed text-fg-muted">{body}</p>
        <ul className="flex flex-col gap-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[0.9375rem] text-fg-soft">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      {visual && <div className="reveal">{visual}</div>}
    </div>
  );
}

/* ── Product visuals: drawn from live data, labelled where illustrative ── */

function HeroProduct({ demo, ticket }: { demo: LandingDemo | null; ticket?: { symbol: string; price: number; changePercent: number | null } }) {
  if (!demo) return <Image src="/assets/images/dashboard.png" alt="The StockLens dashboard" width={1600} height={1291} sizes="640px" className="rounded-xl border border-line" />;
  const total = demo.totalEquity;
  const slices = [...demo.positions.slice(0, 6).map((p, i) => ({ key: p.symbol, value: p.marketValue, fill: SERIES[i] })), { key: "Cash", value: demo.cash, fill: "" }];

  return (
    <div className="animate-rise relative [animation-delay:120ms] lg:pl-6">
      <figure className="sheet overflow-hidden shadow-[var(--shadow-pop)]">
        <figcaption className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-fg">
            {demo.live && <span className="live-dot h-2 w-2 rounded-full bg-gain" aria-hidden="true" />}
            {demo.live ? "The demo account, live" : "Demo account, starting holdings"}
          </span>
          <span className="text-xs text-fg-subtle">{demo.live ? "Prices up to a minute old" : "At today's prices"}</span>
        </figcaption>
        <div className={cn("flex flex-col gap-5 p-5", ticket && "sm:pb-16")}>
          <div>
            <p className="caption">Total equity</p>
            <p className="figure mt-1 text-4xl font-semibold tracking-[-0.035em] text-fg">{formatUsd(total)}</p>
            <p className="mt-1 text-sm">
              {demo.dayChange ? (
                <>
                  <ChangeText value={demo.dayChange.amount} percent={demo.dayChange.percent} className="font-semibold" />{" "}
                  <span className="text-fg-subtle">today</span>
                </>
              ) : (
                <span className="text-fg-subtle">$100,000 starting balance</span>
              )}
            </p>
          </div>
          <div className="flex h-8 w-full gap-0.5 overflow-hidden rounded-lg" aria-hidden="true">
            {slices.filter((s) => s.value > 0).map((s) => (
              <span
                key={s.key}
                className="h-full first:rounded-l-lg last:rounded-r-lg"
                style={{
                  width: `${(s.value / total) * 100}%`,
                  background: s.fill || "repeating-linear-gradient(135deg, var(--color-raised) 0 5px, var(--color-line) 5px 6px)",
                }}
              />
            ))}
          </div>
          <table className="w-full text-sm">
            <caption className="sr-only">Demo account holdings</caption>
            <thead>
              <tr className="text-xs text-fg-subtle">
                <th scope="col" className="pb-2 text-left font-medium">Holding</th>
                <th scope="col" className="pb-2 text-right font-medium">Shares</th>
                <th scope="col" className="pb-2 text-right font-medium">Price</th>
                <th scope="col" className="pb-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {demo.positions.slice(0, 5).map((p, i) => (
                <tr key={p.symbol} className="border-t border-line">
                  <td className="py-2">
                    <span className="flex items-center gap-2 font-mono text-[0.8125rem] font-semibold text-fg">
                      <span className="h-2 w-2 rounded-sm" style={{ background: SERIES[i] }} aria-hidden="true" />
                      {p.symbol}
                    </span>
                  </td>
                  <td className="figure py-2 text-right text-fg-soft">{p.netQty}</td>
                  <td className="figure py-2 text-right text-fg-soft">{formatUsd(p.currentPrice)}</td>
                  <td className="figure py-2 text-right font-medium text-fg">{formatUsd(p.marketValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>

      {ticket && (
        <div
          aria-hidden="true"
          className="relative z-10 -mt-14 mr-6 ml-auto hidden w-64 rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-pop)] sm:block"
        >
          <div className="grid grid-cols-2 rounded-md bg-raised p-0.5 text-xs font-semibold">
            <span className="rounded bg-gain py-1 text-center text-on-brand">Buy</span>
            <span className="py-1 text-center text-fg-subtle">Sell</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-sm font-semibold text-fg">{ticket.symbol}</span>
            <span className="figure text-sm font-semibold text-fg">{formatUsd(ticket.price)}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-fg-subtle">
            <span>10 shares</span>
            <span className="figure text-fg-soft">{formatUsd(ticket.price * 10)}</span>
          </div>
          <div className="mt-3 rounded-md bg-gain py-1.5 text-center text-xs font-semibold text-on-brand">
            Buy 10 {ticket.symbol}
          </div>
        </div>
      )}
    </div>
  );
}

function TicketVisual({ quote }: { quote?: { symbol: string; price: number; changePercent: number | null } }) {
  if (!quote) return null;
  const shares = 10;
  const cost = quote.price * shares;
  return (
    <figure className="mx-auto w-full max-w-md">
      <div className="sheet overflow-hidden shadow-[var(--shadow-pop)]" aria-hidden="true">
        <div className="border-b border-line px-5 py-4">
          <p className="text-base font-semibold text-fg">Place an order</p>
          <p className="text-[0.8125rem] text-fg-subtle">Paper trade at the live market price.</p>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 rounded-lg bg-raised p-1 text-sm font-semibold">
            <span className="rounded-md bg-gain py-1.5 text-center text-on-brand">Buy</span>
            <span className="py-1.5 text-center text-fg-subtle">Sell</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2.5">
            <span className="font-mono text-sm font-semibold text-fg">{quote.symbol}</span>
            <span className="flex items-baseline gap-2">
              <span className="figure text-sm font-semibold text-fg">{formatUsd(quote.price)}</span>
              <ChangeText percent={quote.changePercent} className="text-xs font-semibold" />
            </span>
          </div>
          <div className="flex h-11 items-center justify-center rounded-lg border border-line bg-canvas figure text-lg font-semibold text-fg">
            {shares}
          </div>
        </div>
        <dl className="flex flex-col gap-2 border-t border-line bg-canvas/60 px-5 py-4 text-sm">
          <div className="flex justify-between"><dt className="text-fg-subtle">Estimated cost</dt><dd className="figure font-semibold text-fg">{formatUsd(cost)}</dd></div>
          <div className="flex justify-between"><dt className="text-fg-subtle">Buying power after</dt><dd className="figure text-fg-soft">{formatUsd(100_000 - cost)}</dd></div>
          <div className="flex justify-between"><dt className="text-fg-subtle">{quote.symbol} held after</dt><dd className="figure text-fg-soft">{shares}</dd></div>
        </dl>
        <div className="px-5 py-4">
          <div className="rounded-lg bg-gain py-2.5 text-center text-sm font-semibold text-on-brand">Buy {shares} {quote.symbol}</div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-fg-subtle">
        The order ticket at today&apos;s {quote.symbol} price, for a new account with $100,000
      </figcaption>
    </figure>
  );
}

function AllocationVisual({ demo }: { demo: LandingDemo }) {
  const total = demo.totalEquity;
  return (
    <figure className="sheet overflow-hidden shadow-[var(--shadow-pop)]">
      <div className="p-5">
        <p className="caption">Allocation</p>
        <div className="mt-3 flex h-10 w-full gap-0.5 overflow-hidden rounded-lg" aria-hidden="true">
          {demo.positions.slice(0, 6).map((p, i) => (
            <span key={p.symbol} className="h-full first:rounded-l-lg" style={{ width: `${(p.marketValue / total) * 100}%`, background: SERIES[i] }} />
          ))}
          <span
            className="h-full rounded-r-lg"
            style={{ width: `${(demo.cash / total) * 100}%`, background: "repeating-linear-gradient(135deg, var(--color-raised) 0 5px, var(--color-line) 5px 6px)" }}
          />
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1.5 text-sm">
          {demo.positions.slice(0, 5).map((p, i) => (
            <li key={p.symbol} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[i] }} aria-hidden="true" />
              <span className="font-mono text-[0.8125rem] font-medium text-fg">{p.symbol}</span>
              <span className="figure ml-auto text-xs text-fg-muted">{((p.marketValue / total) * 100).toFixed(1)}%</span>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-raised" aria-hidden="true" />
            <span className="text-[0.8125rem] font-medium text-fg">Cash</span>
            <span className="figure ml-auto text-xs text-fg-muted">{((demo.cash / total) * 100).toFixed(1)}%</span>
          </li>
        </ul>
      </div>
      <div className="border-t border-line">
        <p className="caption px-5 pt-4">Insights</p>
        <ul className="flex flex-col py-2">
          {demo.insights.slice(0, 3).map((ins) => (
            <li key={ins.id} className="px-5 py-2.5">
              <p className="text-sm font-medium text-fg">{ins.title}</p>
              <p className="text-[0.8125rem] text-fg-subtle">{ins.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="border-t border-line px-5 py-2.5 text-xs text-fg-subtle">
        {demo.live ? "The shared demo account, right now" : "The demo account's starting holdings at today's prices"}
      </figcaption>
    </figure>
  );
}

function AIVisual() {
  return (
    <figure className="sheet overflow-hidden shadow-[var(--shadow-pop)]">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5" aria-hidden="true">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/12 text-brand">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-[0.9375rem] font-semibold text-fg">AI portfolio review</span>
      </div>
      <div className="flex flex-col gap-5 p-5" aria-hidden="true">
        <div className="flex flex-col gap-2">
          <span className="h-3 w-full rounded bg-raised" />
          <span className="h-3 w-11/12 rounded bg-raised" />
          <span className="h-3 w-3/5 rounded bg-raised" />
        </div>
        <div>
          <p className="caption">Concentration risk</p>
          <div className="mt-2 flex gap-1">
            <span className="h-1.5 flex-1 rounded-full bg-warning" />
            <span className="h-1.5 flex-1 rounded-full bg-warning" />
            <span className="h-1.5 flex-1 rounded-full bg-raised" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {["Risk", "Diversification"].map((t) => (
            <div key={t} className="flex flex-col gap-2 rounded-lg border border-line p-3">
              <p className="caption">{t}</p>
              <span className="h-2.5 w-full rounded bg-raised" />
              <span className="h-2.5 w-4/5 rounded bg-raised" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <p className="caption">Worth considering</p>
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <span className="figure flex h-5 w-5 items-center justify-center rounded-md bg-raised text-xs font-semibold text-fg-muted">{n}</span>
              <span className="h-2.5 flex-1 rounded bg-raised" />
            </div>
          ))}
        </div>
      </div>
      <figcaption className="border-t border-line px-5 py-2.5 text-xs text-fg-subtle">
        The review&apos;s layout. Its content is written by Gemini from your own positions.
      </figcaption>
    </figure>
  );
}
