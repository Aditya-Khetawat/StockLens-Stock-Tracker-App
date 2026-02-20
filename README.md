# 📈 StockLens

A modern, full-stack stock tracking and **paper trading** application built with Next.js 16, featuring real-time market data, personalized watchlists, a full paper trading engine with portfolio analytics, and AI-powered email summaries.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.1-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🌐 Live Demo & Screenshots

**Live Demo**: [https://stocklens-stock-tracker.vercel.app](https://stocklens-stock-tracker.vercel.app)

### Dashboard

![Dashboard Screenshot](./public/screenshots/dashboard_ss.png)
_Real-time stock tracking with interactive charts and personalized watchlist_

### Stock Details

![Stock Details Screenshot](./public/screenshots/stock-details.png)
_Comprehensive stock analysis with TradingView integration_

### Watchlist Management

![Watchlist Screenshot](./public/screenshots/watchlist.png)
_Manage your portfolio with live price updates and market data_

### Mock Portfolio Management

![Portfolio Screenshots](./public/screenshots/portfolio.png)(./public/screenshots/portfolio2.png)
_Learn and Experiment using the Mock Portfolio feature_

## 💡 Why This Project?

### The Problem

Investors and traders face information overload from multiple sources, making it challenging to:

- Track multiple stocks efficiently across different platforms
- Stay updated with relevant market news without constant monitoring
- Practice trading strategies without risking real money
- Make informed decisions with scattered financial data
- Manage portfolios without enterprise-grade tools

### The Solution

StockLens addresses these challenges by providing:

- **Unified Dashboard**: All your stocks, charts, and data in one place
- **Paper Trading Engine**: Practice buying and selling stocks with a virtual $100,000 balance
- **Portfolio Analytics**: Real-time P&L tracking, cost basis, unrealized gains, and equity charts
- **Smart Notifications**: AI-powered daily summaries tailored to your watchlist
- **Real-time Insights**: Live market data with professional-grade charting tools
- **Personalized Experience**: Investment preferences drive content curation
- **Free & Open Source**: No subscription fees, full transparency

Built as a showcase of modern full-stack development practices, StockLens demonstrates production-ready architecture, scalable design patterns, and seamless integration of multiple services.

## ✨ Features

### 🔐 Authentication & User Management

- Secure email/password authentication with Better Auth
- Personalized user profiles with investment preferences and country selection
- Avatar with user initials display
- Protected routes via middleware

### 📊 Stock Market Features

- **Real-time Stock Data**: Live quotes, prices, and market changes via Finnhub API
- **Interactive Charts**: TradingView widgets for candlestick, baseline, and technical analysis
- **Advanced Search**: Debounced stock search with autocomplete (⌘K / Ctrl+K)
- **Stock Details**: Comprehensive company profiles, financials, and P/E ratios

### 💹 Paper Trading Engine

- **$100,000 virtual starting balance** per user
- **Execute Trades**: Buy and sell any stock with live price fetching
- **Smart Symbol Autocomplete**: Search suggestions while typing in the trade modal (BUY and SELL modes)
- **MAX Button**: Automatically fills the maximum sellable quantity for any position
- **Trade Validation**: Prevents over-buying beyond balance and over-selling beyond held shares

### 📂 Portfolio Management

- **Positions Table**: View all active holdings with quantity, average cost, current price, market value, unrealized P&L, and gain %
- **Cost Basis Reset**: When a position is fully closed, cost basis resets — new buys start fresh
- **Allocation %**: See each position's share of total portfolio value
- **Quick Sell Button**: Per-row sell action pre-filled with symbol and MAX quantity
- **P&L Chart**: Recharts line chart showing profit & loss over time via transaction replay
- **Portfolio Summary**: Total equity, total return ($), total return (%), unrealized P&L, and cash balance

### ⭐ Watchlist Management

- Add/remove stocks with optimistic UI updates
- Debounced actions to prevent rapid API calls
- Real-time data enrichment for watchlist items
- Color-coded price changes (green/red)
- Market cap and P/E ratio tracking
- Responsive table view

### 📧 Email Notifications

- **Welcome Emails**: AI-generated personalized introductions using Gemini
- **Daily News Summaries**: Automated market news digests based on watchlist
- Professional HTML email templates with responsive design
- Nodemailer integration for reliable delivery

### 🤖 Background Jobs

- Inngest integration for scheduled tasks
- Daily news digest generation and distribution
- AI-powered content summarization

### 🎨 Modern UI/UX

- Dark mode optimized interface throughout
- Responsive design (mobile, tablet, desktop)
- Shadcn UI components with custom styling
- Toast notifications for trade confirmations and errors
- Smooth animations and transitions
- Chrome autofill styled to match dark theme
- Custom text selection highlight (yellow accent)
- Password visibility toggle in auth forms

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI, Radix UI
- **Charts**: Recharts (P&L equity chart), TradingView Widgets (stock charts)
- **Forms**: React Hook Form
- **Notifications**: Sonner (Toast)
- **Icons**: Lucide React

### Backend

- **Runtime**: Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Better Auth
- **Email**: Nodemailer
- **Background Jobs**: Inngest
- **AI**: Google Gemini 2.5 Flash

### APIs & Services

- **Stock Data**: Finnhub API
- **Charts**: TradingView Widgets
- **Email Delivery**: SMTP (configurable)

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **MongoDB** (local or Atlas cluster)
- **npm/yarn/pnpm** package manager
- **Finnhub API Key** (free tier available at [finnhub.io](https://finnhub.io))
- **SMTP Server** credentials for email (Gmail, SendGrid, etc.)
- **Google AI API Key** for Gemini (optional, for AI features)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/stocks-app.git
cd stocks-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/stocklens
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/stocklens

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-characters
BETTER_AUTH_URL=http://localhost:3000

# Finnhub API
FINNHUB_API_KEY=your-finnhub-api-key
NEXT_PUBLIC_FINNHUB_API_KEY=your-finnhub-api-key

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=StockLens <noreply@stocklens.com>

# Google Gemini AI (Optional)
GOOGLE_AI_API_KEY=your-gemini-api-key

# Inngest
INNGEST_SIGNING_KEY=your-inngest-key
INNGEST_EVENT_KEY=your-inngest-event-key
```

### 4. Database Setup

Test your MongoDB connection:

```bash
npm run test:db
```

The application will automatically create the necessary collections and indexes on first run.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Inngest Dev Server (Optional)

For background jobs and email notifications:

```bash
npx inngest-cli@latest dev
```

## 📁 Project Structure

```
stocks-app/
├── app/
│   ├── (auth)/              # Authentication routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (root)/              # Protected routes
│   │   ├── page.tsx         # Home / dashboard
│   │   ├── portfolio/       # Paper trading portfolio page
│   │   ├── stocks/[symbol]/ # Stock details page
│   │   └── watchlist/       # Watchlist page
│   ├── api/
│   │   ├── inngest/         # Inngest webhook
│   │   ├── trade/           # Trade execution endpoint
│   │   └── portfolio/
│   │       └── equity/      # P&L history endpoint
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/
│   ├── forms/               # Form components (InputField, SelectField, etc.)
│   ├── ui/                  # Shadcn UI primitives
│   ├── EquityChart.tsx      # Recharts P&L line chart
│   ├── Header.tsx
│   ├── PortfolioTradeButton.tsx
│   ├── PositionSellButton.tsx
│   ├── SearchCommand.tsx
│   ├── TradeModal.tsx       # Buy/sell execution modal
│   ├── WatchlistButton.tsx
│   └── WatchlistTable.tsx
├── database/
│   ├── models/              # Mongoose models (User, Transaction, Watchlist)
│   └── mongoose.ts          # Database connection
├── hooks/
│   ├── useDebounce.ts
│   └── useTradingViewWidget.tsx
├── lib/
│   ├── actions/             # Server actions (auth, finnhub, watchlist, user)
│   ├── better-auth/         # Auth configuration
│   ├── inngest/             # Background job functions & prompts
│   ├── nodemailer/          # Email templates and transport
│   ├── services/
│   │   ├── portfolio.service.ts  # Portfolio aggregation with cost basis replay
│   │   └── trade.service.ts      # Trade execution logic
│   ├── constants.ts
│   └── utils.ts
├── middleware/
│   └── index.ts             # Route protection
├── scripts/
│   └── test-db.mjs          # Database connection test
└── types/
    └── global.d.ts          # TypeScript definitions
```

## 🎯 Key Features Explained

### Paper Trading Engine

Every user starts with a **$100,000 virtual balance**. Trades are executed via the `/api/trade` endpoint which validates the order (sufficient balance for buys, sufficient shares for sells), records a `Transaction` document, and updates the user's balance atomically.

### Cost Basis Calculation

Portfolio positions are built by replaying transactions in chronological order:

- **BUY**: increases quantity and total cost (weighted average accumulation)
- **SELL**: reduces total cost proportionally (`avgCost × quantitySold`)
- **Full close** (`quantity → 0`): the symbol is deleted from state entirely, so the next BUY starts with a fresh cost basis — no stale weighted averages from previous positions

### P&L Chart

The `/api/portfolio/equity` route replays all transactions sequentially, tracking cash and holdings state at each transaction.It computes portfolio equity at every step and returns a `{ date, pnl }` time series, rendered as a Recharts `LineChart` on the portfolio page.

### Watchlist Button

- **Optimistic UI**: Immediate state updates before server confirmation
- **Debouncing**: 300ms delay prevents rapid API calls
- **Two Modes**: Button (full width) and Icon (compact for tables)
- **Toast Feedback**: Success/error notifications

### Trade Modal

- **Symbol autocomplete**: Debounced `searchStocks` suggestions while typing, shown for both BUY and SELL modes (can be disabled per usage)
- **Live price fetch**: Debounced 500ms after symbol entry, shows current price and estimated total
- **MAX button**: In SELL mode, one click fills the quantity with the full number of shares held

### Authentication Flow

- Page-level authentication in layouts (no redirects in server actions)
- Session management with Better Auth
- Graceful error handling for unauthenticated users

### Email System

- AI-generated personalized welcome messages
- Daily news summaries with watchlist-based content
- Responsive HTML templates
- Fallback to general market news

## 🧪 Testing

```bash
# Test database connection
npm run test:db

# Run linter
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add all environment variables in the Vercel dashboard
4. Deploy

### Other Platforms

```bash
npm run build
npm run start
```

## 🔒 Security & Limitations

### Security Features

- **Authentication**: Secure session-based auth with httpOnly cookies
- **Password Hashing**: Passwords encrypted using industry-standard algorithms
- **Environment Variables**: Sensitive data never committed to version control
- **CSRF Protection**: Built-in Next.js security measures
- **Input Validation**: React Hook Form validation on client and server
- **Rate Limiting**: Debounced API calls prevent abuse

### Known Limitations

- **Market Data**: Free Finnhub tier limits API calls (30 calls/second)
- **Real-time Updates**: Data refreshes on page load, not WebSocket streaming
- **Email Delivery**: Requires valid SMTP configuration; may hit rate limits
- **AI Generation**: Gemini API has usage quotas; fallback to templates provided
- **Historical Data**: Limited to current quotes; no extensive historical analysis
- **Production Scale**: Not optimized for high-concurrency enterprise use

### Recommendations for Production

- Implement API rate limiting middleware
- Add Redis caching layer for frequently accessed data
- Use WebSocket connections for real-time price updates
- Set up monitoring and error tracking (e.g., Sentry)
- Configure CDN for static assets
- Implement comprehensive test suite (unit, integration, e2e)

## 🗺️ Roadmap

Future enhancements planned for StockLens:

### Core Features

- [x] **Portfolio Management**: Track buy/sell transactions and calculate returns
- [x] **Paper Trading Engine**: Virtual $100,000 balance with full trade execution
- [x] **P&L Chart**: Equity / profit-loss over time via transaction replay
- [x] **Cost Basis Reset**: Accurate avg cost after fully closing a position
- [ ] **Price Alerts**: Configurable notifications when stocks hit target prices
- [ ] **Multi-Currency Support**: Display prices in user's preferred currency
- [ ] **Historical Charts**: Extended timeframes beyond current data
- [ ] **Stock Comparison**: Side-by-side analysis of multiple stocks

### User Experience

- [ ] **Mobile App**: React Native companion app (iOS/Android)
- [ ] **Dark/Light Mode Toggle**: User-selectable theme preference
- [ ] **Customizable Dashboard**: Drag-and-drop widget arrangement
- [ ] **Export Data**: CSV/PDF export of watchlist and portfolio
- [ ] **Social Features**: Share watchlists and insights with friends

### Technical Improvements

- [ ] **WebSocket Integration**: Real-time price streaming
- [ ] **Redis Caching**: Improve performance and reduce API calls
- [ ] **GraphQL API**: Flexible data fetching for mobile clients
- [ ] **E2E Testing**: Playwright or Cypress test suite
- [ ] **Kubernetes Deployment**: Container orchestration for scaling

### Analytics & Intelligence

- [ ] **AI-Powered Predictions**: Machine learning price trend forecasts
- [ ] **Sentiment Analysis**: News sentiment scoring and tracking
- [ ] **Portfolio Recommendations**: AI-suggested stock additions based on goals
- [ ] **Advanced Charting**: Custom technical indicators and drawing tools

_Contributions welcome! See the Contributing section to help build these features._

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Finnhub](https://finnhub.io) for stock market data
- [TradingView](https://www.tradingview.com) for chart widgets
- [Shadcn UI](https://ui.shadcn.com) for beautiful components
- [Better Auth](https://better-auth.com) for authentication
- [Inngest](https://inngest.com) for background jobs
- [Recharts](https://recharts.org) for portfolio P&L charting

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and TypeScript
