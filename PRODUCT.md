# Product

## Platform

web

## Users

- **Learners practising with stakes removed**: people curious about the stock market who want to buy and sell real US stocks at real prices without risking money, then see how their decisions would have played out. They visit in short sessions: check how the portfolio moved, look up a company, place an order, read why the AI thinks the portfolio is concentrated.
- **Evaluators of the project**: StockLens is a portfolio project, so recruiters, hiring managers and engineers open it, often through the no-sign-up demo account, to judge product and engineering quality in a few minutes.

## Product Purpose

StockLens is a paper-trading app: every account starts with $100,000 in virtual cash and trades US stocks at live market prices. It exists so that someone can learn how investing actually feels (fills, average cost, unrealized P&L, concentration, a daily equity history) without the consequences. Success is a visitor placing a first trade within minutes and coming back to see how it moved.

## Positioning

Not a toy simulator: every order is priced live from Finnhub and settled in a MongoDB transaction, holdings are derived from an append-only ledger, equity is snapshotted after every US close for honest risk metrics, and the AI analysis refuses to invent figures it cannot compute. The shared demo account lets anyone try it instantly.

## Operating Context

- Used on desktop and phone browsers, often during or just after US market hours (9:30–16:00 ET).
- A daily news email (12:00 UTC) and a welcome email bring people back; email templates are out of scope for app design work.
- Market charts, the heatmap, technical analysis, company profile and financials are third-party TradingView embeds: their internals cannot be restyled beyond the colour and theme options their config accepts.

## Capabilities and Constraints

- Pages: sign-in, sign-up (with investing-profile questions), dashboard, stock page (`/stocks/[symbol]`), portfolio, trade history, watchlist, global stock search, trade dialog.
- Paper trading only, US listings only, whole shares, market orders only, $100,000 starting cash, no fees.
- Finnhub free tier (60 calls/minute): quotes cached 60 s; stale prices are never used to trade.
- Every public server action is allowlisted in CI; auth endpoints other than the verification link are not served over HTTP.
- No price alerts, limit orders, short selling, options or real-money features. Do not imply them.

## Brand Commitments

- Name: **StockLens**, with the existing logo (`public/assets/icons/logo.svg`, `app/favicon.ico`) and images in `public/assets/images/` kept.
- Dark theme with the original palette (canvas #050505, surface #141414, raised #212328, lines #30333a, gold #e8ba40, green gains, #ff495b losses). The look should feel sleek, high-agency and professional, at the craft level of Linear, Stripe, Ramp, Robinhood and Bloomberg without copying any of them.
- Voice: plain and honest. "Paper trading only. No real money is involved." must stay visible where people sign up.

## Evidence on Hand

- Real, live data: quotes, company profiles, symbol search, market news (Finnhub); the demo account's seeded portfolio (AAPL, MSFT, NVDA, JPM, JNJ).
- Screenshots in `public/screenshots/` and `public/assets/images/`.
- No testimonials, user counts, press, ratings or performance claims exist. Do not fabricate any.

## Product Principles

1. **Real prices, honest numbers.** Never show a figure the system cannot back; say "not enough history yet" rather than invent.
2. **The first trade in under a minute.** From landing or the demo button to a filled order without detours.
3. **Consequence without cost.** Make gains, losses and concentration feel real while always being clear that no money is involved.
4. **Calm over casino.** Encourage understanding of a position, not compulsive trading: no confetti, streaks or hype.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast; full keyboard operation of search, the trade dialog and tables.
- Direction of a gain or loss is never carried by colour alone: always a sign and an arrow as well.
- Respect `prefers-reduced-motion`.
