---
name: StockLens
description: A dark trading desk for paper trading US stocks at live prices.
colors:
  canvas: "#050505"
  surface: "#141414"
  raised: "#212328"
  hover: "#1a1b1f"
  line: "#30333a"
  line-strong: "#454953"
  fg: "#f3f4f6"
  fg-soft: "#d1d5db"
  fg-muted: "#b4b8c2"
  fg-subtle: "#9095a1"
  brand: "#e8ba40"
  brand-bright: "#fdd458"
  brand-deep: "#c99a28"
  on-brand: "#0b0b0c"
  gain: "oklch(72.3% 0.219 149.579)"
  gain-soft: "oklch(79.2% 0.209 151.711)"
  loss: "#ff495b"
  loss-soft: "#ff6b7a"
  loss-faint: "#ff8a96"
  warning: "#f5a524"
  info: "#7c8cff"
  series-1: "#e8ba40"
  series-2: "#0fedbe"
  series-3: "#7c8cff"
  series-4: "#ff8243"
  series-5: "#d77bff"
  series-6: "#5cc8ff"
  series-7: "#a7b0be"
typography:
  hero:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.25rem"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  hero-mobile:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "\"tnum\", \"lnum\""
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  page-title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  figure:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.015em"
    fontFeature: "\"tnum\", \"lnum\""
  ticker:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 600
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.brand-bright}"
  button-primary-active:
    backgroundColor: "{colors.brand-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
  button-ghost:
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.fg}"
  button-buy:
    backgroundColor: "{colors.gain}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.lg}"
    height: "36px"
  button-buy-hover:
    backgroundColor: "{colors.gain-soft}"
  button-sell:
    backgroundColor: "{colors.loss}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.lg}"
    height: "36px"
  button-sell-hover:
    backgroundColor: "{colors.loss-soft}"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  sheet-head:
    typography: "{typography.title}"
    padding: "12px 20px"
    height: "52px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "44px"
  table-head:
    textColor: "{colors.fg-subtle}"
    typography: "{typography.label}"
    padding: "10px 16px"
  nav-tab-active:
    textColor: "{colors.fg}"
    typography: "{typography.body}"
  mobile-tab-active:
    textColor: "{colors.brand}"
---

# Design System: StockLens

## Overview

**Creative North Star: "The Night Desk"**

StockLens is a trading desk after dark: a near-black canvas, graphite sheets laid on it with hairline borders, and one gold mark that says where you are and what to do next. The hierarchy is that of a premium fintech product rather than a terminal costume: large calm figures, quiet captions, and colour that only speaks when it means something. Gold means action or current place. Green and red mean the market moved, and they never travel without a sign and an arrow.

Density is medium. Sheets carry generous 20 to 24px padding, tables run 12px rows, and the dashboard reads as a two-thirds / one-third grid of sheets, not a wall of equal cards. Third-party TradingView embeds sit inside the same sheets so they read as part of the desk. Motion is functional: 150 to 250ms state transitions and a single short rise when the dashboard sheets arrive.

The app is dark only. The original palette, logo and imagery are kept as they were; this system records how they were set into a disciplined hierarchy. Rejected: neon-terminal styling and generic card-grid dashboards.

**Key Characteristics:**
- Near-black canvas (#050505) with graphite sheets separated by 1px borders, not shadows.
- One gold primary action per view; gold also marks the current section.
- Market colour only for market meaning, always paired with a sign and an arrow.
- Every money figure tabular and lining; every ticker in Geist Mono.
- Shadows exist only on overlays: dialogs, menus, popovers, tooltips.
- Skeletons for loading, and empty states that name the next action.

## Colors

A monochrome graphite ladder with one warm gold accent and a reserved pair of market colours.

### Primary
- **Desk Gold** (`brand`): the single primary action per view (Trade on the dashboard and portfolio, Sign in, Add a stock on the watchlist; repeated or secondary actions such as the AI review and empty-state search use the secondary button), the current-tab underline in the header, the active tab in the mobile bar, focus outlines, text selection (at 35%), link text in auth footers, and ticker hover. **Bright Gold** (`brand-bright`) is its hover; **Deep Gold** (`brand-deep`) its pressed state. Text on gold is **Desk Ink** (`on-brand`).

### Secondary
- **Market Green** (`gain`, hover `gain-soft`): gains, the Buy fill, upward equity curves, positive move bars.
- **Market Red** (`loss`, hover `loss-soft`, tint `loss-faint`): losses, the Sell fill, downward curves, destructive actions (remove, sell a position) and error alerts.

### Tertiary
- **Caution Amber** (`warning`): missing prices, validation messages, concentration insights.
- **Signal Periwinkle** (`info`): informational accents only; also series-3.
- **Series 1 to 7**: allocation segments in size order, gold first, with dark labels (`on-brand`) on the fills. Series-7 slate is the "N more" bucket. Cash is not a series colour: it is a hatched `raised`/`line` stripe.

### Neutral
- **Desk Black** (`canvas`): the page, the sticky header (at 70 to 80% with blur), table head rows (at 40%), recessed fields inside the trade ticket.
- **Graphite** (`surface`): sheets, dialogs, menus, the auth showcase panel, form inputs.
- **Raised Graphite** (`raised`): segmented-control tracks, skeleton blocks, icon tiles, chips, stat bands (at 40%).
- **Row Hover** (`hover`): the hover fill for table rows and list items.
- **Hairline** (`line`): every border and divider. **Strong Hairline** (`line-strong`): input borders, the mobile tab bar top rule, the move-bar centre rule.
- **Text ladder**: `fg` for figures and headings, `fg-soft` for secondary figures and labels, `fg-muted` for quiet body and inactive mobile tabs, `fg-subtle` for captions, column heads and helper copy.

### Named Rules
**The One Gold Rule.** Gold fills at most one button per view. Every other action is secondary, ghost, buy or sell.

**The Market Meaning Rule.** Green and red appear only where a price, a P&L or an order side is the subject. Gain/loss colour is never the only carrier of direction: a sign and an arrow always come with it.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui)
**Body Font:** Geist
**Label/Mono Font:** Geist Mono, for tickers only

**Character:** One neutral grotesque carries everything, tightened at large sizes so figures feel engineered; the mono face is a label for symbols, not a terminal costume.

### Hierarchy
- **Display** (600, 2.5rem rising to 3rem, line-height 1, -0.035em, tabular): the total-equity figure on the dashboard. One per view.
- **Headline** (600, 2.5rem rising to 3rem, 1.08, -0.03em): the auth showcase headline.
- **Page title** (600, 1.5rem rising to 1.75rem, tight tracking): page headings (Portfolio, Watchlist, History); form titles run 1.875rem.
- **Title** (600, 0.9375rem, tight tracking): sheet headers.
- **Body** (400, 0.875rem): table cells, insights, ticket rows; long copy sits at 0.8125 to 0.9375rem with relaxed leading. Headings balance, paragraphs wrap pretty.
- **Label** (500, 0.75rem, `fg-subtle`): column heads, stat labels, field captions. Sentence case, never uppercase.
- **Ticker** (Geist Mono 600, 0.75 to 0.8125rem): every stock symbol in lists, tables, strips and the ticket.

### Named Rules
**The Tabular Money Rule.** Every money figure, share count and percentage uses the figure treatment: tabular, lining numerals, -0.015em. Tables default to tabular numerals.

**The Mono Ticker Rule.** A stock symbol is always Geist Mono semibold; company names stay in Geist.

## Layout

A centred container (max 1360px; 16px gutters on phones, 24px from md, 32px from lg). The header is one 56px sticky bar (logo, section tabs, search field with a Ctrl K hint, account) over a 36px watchlist price strip that scrolls horizontally on phones and never animates as a ticker.

The dashboard is a 12-column grid from lg: an 8-column main stack (equity sheet with chart and a four-stat band, allocation sheet) beside a 4-column rail (insights, watchlist movers). Sheets stack at 20px gaps; major page sections are 48px apart. Market embeds sit in a 3-column grid from xl with the wide embeds spanning two. Auth pages split into a form column (max 420px) and, from lg, a graphite showcase panel.

Below md the section tabs leave the header and a fixed bottom tab bar takes over (Dashboard, Search, Watchlist, Portfolio), respecting the safe-area inset; the header search field hides below sm and Search becomes a tab. Page content reserves 112px at the bottom on phones for the bar.

## Elevation & Depth

Flat by default. Depth comes from the tonal ladder (canvas, surface, raised) and hairline borders. The one shadow token is an overlay lift with a faint 1px light ring, so overlays read on black.

### Shadow Vocabulary
- **Pop** (`box-shadow: 0 0 0 1px rgb(255 255 255 / 0.04), 0 16px 48px -12px rgb(0 0 0 / 0.7)`): dialogs (trade ticket, search), dropdown menus, autocomplete lists, chart tooltips.

### Named Rules
**The Borders Separate Rule.** Sheets never carry a resting shadow. If something needs lifting off the page, it is an overlay.

## Shapes

Soft, consistent corners on a 12px base radius: sheets and dialogs 16px, buttons, inputs and segmented tracks 12px, segmented thumbs, menu items and strip links 10px, skeleton bars and legend swatches 8px or less. Avatars, move bars and progress fills are fully round. Borders are always 1px hairlines; tables clip inside their sheet.

## Components

### Buttons
Confident and compact: one shape, five intents.
- **Shape:** 36px high, 14px horizontal padding, 12px radius, semibold 0.875rem, 8px icon gap. Full-width form submits grow to 44px.
- **Primary:** gold fill, ink text; brighter on hover, deeper when pressed. Once per view.
- **Secondary:** graphite fill with a hairline border; raised fill and strong border on hover.
- **Ghost:** no fill, muted text; raised fill and full-strength text on hover.
- **Buy / Sell:** green or red fill with ink text, lighter on hover. Used only for order sides.
- **States:** colour transitions at 150ms; disabled at 50% opacity with a not-allowed cursor; focus shows a 2px gold outline offset 2px.

### Segmented controls
Range pickers (1W, 1M, 3M, YTD, All) and the Buy/Sell side switch: a raised track with 2 to 4px padding, 28px semibold xs options, the selected option lifted to the surface colour.

### Cards / Containers (Sheets)
- **Corner Style:** 16px.
- **Background:** graphite with a hairline border.
- **Shadow Strategy:** none (see Elevation).
- **Header:** min 52px, 20px sides, bottom hairline, title left and a quiet caption or link right.
- **Internal Padding:** 20px, 24px from md. Stat bands divide with hairlines.

### Inputs / Fields
- **Style:** 44px, graphite fill, hairline border, 12px radius, 1rem text, subtle placeholder. Inside the trade ticket, fields recess to canvas at 40px.
- **Focus:** gold border plus a 2px gold ring at 20%.
- **Error:** amber helper text below; server errors appear as a red-tinted alert (10% fill, 40% border).

### Tables
Rows sit inside a sheet. The head row is canvas at 40% with a bottom hairline and label-style headings; rows are 12px tall-padded with hairline separators and the row-hover fill. Numeric columns are right-aligned and tabular. On the watchlist, Company, Price and Today are sortable: a button in the header with an up/down/neutral chevron and `aria-sort`.

### Navigation
- **Header tabs:** 0.875rem medium, `fg-subtle` at rest, `fg` on hover and when current; the current tab carries a 2px gold underline on the header's bottom edge.
- **Mobile tab bar:** fixed bottom, 95% graphite with blur and a strong top hairline; icon over 0.6875rem label; the current tab turns gold with a 3px gold bar at its top edge.
- **Search:** a field-style trigger with a Ctrl K keycap in the header; opens a 672px command dialog 12vh from the top with a 56px input.

### Change readout (signature)
Every gain or loss renders as an arrow (up-right or down-right), a signed value and, when present, a signed percentage in brackets, coloured green or red and set tabular. Used in the strip, tables, stats, tooltips and the ticket.

### Move bars and allocation (signature)
Watchlist movers draw a 6px diverging bar from a centre rule: losses grow left in red, gains right in green, scaled to the day's largest move. Allocation is a single 40px bar of the whole account in size order, cash hatched, with a legend grid; hovering either dims the other segments to 35%.

### Loading and empty states
Loading uses pulsing raised blocks shaped like the content they replace, inside the same sheets, with a screen-reader status. Empty states say what is missing and offer the one action that fixes it (Find a stock, Trade).

### Motion
State changes transition colour, border and opacity over 150 to 250ms. The dashboard sheets enter once with a 240ms rise (6px, fading in) on an ease-out-quint curve. All animation and transition collapse under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** keep gold to one filled button per view, plus the current-place marker.
- **Do** render every gain or loss through the change readout: arrow, sign, colour, tabular.
- **Do** set every money figure with the figure treatment and every ticker in Geist Mono.
- **Do** build containers as sheets: graphite, 1px hairline, 16px radius, no shadow.
- **Do** reserve the pop shadow for dialogs, menus, popovers and tooltips.
- **Do** show skeletons shaped like the content while it loads, and an empty state that names the next action.
- **Do** keep transitions between 150 and 250ms and honour reduced motion.

### Don't:
- **Don't** use green or red for anything that is not market direction, an order side or a destructive action.
- **Don't** add resting shadows, decorative gradients or glows to sheets.
- **Don't** add a light theme; the app is dark only.
- **Don't** animate the price strip as a scrolling ticker.
- **Don't** use uppercase eyebrow labels above headings; captions are sentence case and sit as labels for data.
