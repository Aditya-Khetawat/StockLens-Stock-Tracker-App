# 📈 StockLens

A modern, full-stack stock tracking and portfolio management application built with Next.js 16, featuring real-time market data, personalized watchlists, and AI-powered email summaries.

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

## 💡 Why This Project?

### The Problem

Investors and traders face information overload from multiple sources, making it challenging to:

- Track multiple stocks efficiently across different platforms
- Stay updated with relevant market news without constant monitoring
- Make informed decisions with scattered financial data
- Manage portfolios without enterprise-grade tools

### The Solution

StockLens addresses these challenges by providing:

- **Unified Dashboard**: All your stocks, charts, and data in one place
- **Smart Notifications**: AI-powered daily summaries tailored to your watchlist
- **Real-time Insights**: Live market data with professional-grade charting tools
- **Personalized Experience**: Investment preferences drive content curation
- **Free & Open Source**: No subscription fees, full transparency

Built as a showcase of modern full-stack development practices, StockLens demonstrates production-ready architecture, scalable design patterns, and seamless integration of multiple services.

## ✨ Features

### 🔐 Authentication & User Management

- Secure email/password authentication with Better Auth
- Personalized user profiles with investment preferences
- Avatar with user initials display

### 📊 Stock Market Features

- **Real-time Stock Data**: Live quotes, prices, and market changes via Finnhub API
- **Interactive Charts**: TradingView widgets for candlestick, baseline, and technical analysis
- **Advanced Search**: Debounced stock search with autocomplete
- **Stock Details**: Comprehensive company profiles, financials, and P/E ratios

### ⭐ Watchlist Management

- Add/remove stocks with optimistic UI updates
- Debounced actions to prevent rapid API calls
- Real-time data enrichment for watchlist items
- Color-coded price changes (green/red)
- Market cap and P/E ratio tracking
- Responsive table view with sorting

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

- Dark mode optimized interface
- Responsive design (mobile, tablet, desktop)
- Shadcn UI components with custom styling
- Toast notifications with consistent theming
- Smooth animations and transitions
- Password visibility toggle in forms

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI, Radix UI
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
# or
yarn install
# or
pnpm install
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
│   │   ├── stocks/[symbol]/ # Stock details page
│   │   └── watchlist/       # Watchlist page
│   ├── api/inngest/         # Inngest webhook
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/
│   ├── forms/               # Form components
│   ├── ui/                  # Shadcn UI components
│   ├── Header.tsx
│   ├── SearchCommand.tsx
│   ├── WatchlistButton.tsx
│   └── WatchlistTable.tsx
├── database/
│   ├── models/              # Mongoose models
│   └── mongoose.ts          # Database connection
├── lib/
│   ├── actions/             # Server actions
│   ├── better-auth/         # Auth configuration
│   ├── inngest/             # Background job functions
│   ├── nodemailer/          # Email templates
│   ├── constants.ts
│   └── utils.ts
├── middleware/
│   └── index.ts             # Route protection
└── types/
    └── global.d.ts          # TypeScript definitions
```

## 🎯 Key Features Explained

### Watchlist Button

- **Optimistic UI**: Immediate state updates before server confirmation
- **Debouncing**: 300ms delay prevents rapid API calls
- **Two Modes**: Button (full width) and Icon (compact for tables)
- **Toast Feedback**: Success/error notifications
- **Event Bubbling**: Proper handling in clickable rows

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
3. Add environment variables
4. Deploy

### Other Platforms

Build the production bundle:

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

- [ ] **Portfolio Management**: Track buy/sell transactions and calculate returns
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
- [ ] **Multi-Region Database**: Global data distribution for lower latency

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

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and TypeScript
