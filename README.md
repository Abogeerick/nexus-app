# 💰 Nexus Finance Analyst

**MVP SaaS Product** — A comprehensive financial portfolio tracker for Kenyan users, aggregating stocks, crypto, bank balances, Mpesa, and custom assets with smart analytics and goal planning.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-MVP-orange.svg)

---

## 🎯 Project Overview

Nexus Finance Analyst helps users track and analyze their complete financial picture across multiple asset types:

- 📊 **Multi-Asset Tracking**: Stocks, crypto, cash, bank accounts, Mpesa, and custom assets
- 💱 **Multi-Currency Support**: KES-first with real-time FX rates
- 📈 **Smart Analytics**: Performance metrics, allocation charts, risk indicators
- 🎯 **Goal Planning**: Monte Carlo simulations and what-if scenarios
- 📱 **Kenya-Ready**: Built-in Mpesa CSV parser and KES currency support

**Core Principle**: 100% free tier — no paid APIs required for MVP

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: React 19

### Backend
- **API Routes**: Next.js API routes
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js (email/password + OAuth)
- **Email**: Free SMTP (Gmail/Mailtrap)

### External Services (Free Tier)
- **Crypto Prices**: CoinGecko API
- **Stock Prices**: Finnhub/Alpha Vantage/Yahoo Finance
- **FX Rates**: exchangerate.host

### Development Tools
- **Linting**: ESLint 9
- **Formatting**: Prettier 3
- **Type Checking**: TypeScript 5
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

---

## 📁 Project Structure

```
nexus-app/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/             # API routes
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── charts/         # Chart components
│   │   ├── forms/          # Form components
│   │   └── layout/         # Layout components (Navbar, Footer)
│   ├── modules/            # Business logic modules
│   │   ├── auth/          # Authentication logic
│   │   ├── portfolio/     # Portfolio management
│   │   ├── goals/         # Financial goals
│   │   └── transactions/  # Transaction processing
│   ├── lib/               # Utility functions
│   │   ├── fetchers/     # API data fetchers
│   │   ├── formatters/   # Data formatters
│   │   ├── helpers/      # Helper functions
│   │   └── validators/   # Input validation
│   └── styles/           # Global styles
├── prisma/               # Database schema
├── public/              # Static assets
├── .env.example         # Environment variables template
└── docker-compose.yml   # Docker configuration
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v18+ (recommended: v20+)
- **npm**: v9+ or **pnpm**: v8+
- **PostgreSQL**: v14+ (or Docker)
- **Git**: v2.30+

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/nexus-app.git
   cd nexus-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Set up the database** (coming in next sprint):
   ```bash
   # Using Docker
   docker-compose up -d postgres
   
   # Run migrations
   npm run db:migrate
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Check TypeScript types |
| `npm test` | Run tests (coming soon) |

---

## 🔧 Configuration

### ESLint + Prettier

The project uses ESLint for linting and Prettier for code formatting. Configuration files:

- `eslint.config.mjs` — ESLint rules
- `.prettierrc` — Prettier configuration
- `.prettierignore` — Files to skip formatting

### TypeScript

TypeScript is configured with strict mode enabled. See `tsconfig.json` for details.

---

## 🌍 Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nexus_finance"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Email
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-username"
SMTP_PASSWORD="your-password"

# External APIs (all free tier)
FINNHUB_API_KEY="your-free-key"
ALPHA_VANTAGE_API_KEY="your-free-key"
```

---

## 🐳 Docker Setup

Run the entire stack with Docker:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🧪 Testing

Testing will be added in Sprint 13:
- Unit tests for parsers (Mpesa, CSV)
- Integration tests for API routes
- E2E tests for critical flows

---

## 🚢 Deployment

### Free Hosting Options

1. **Vercel** (Recommended for Next.js)
2. **Render** (Free tier with PostgreSQL)
3. **Railway** (Free tier with 500 hours/month)
4. **Fly.io** (Free tier available)

See deployment guide (coming soon) for detailed instructions.

---

## 📅 Development Roadmap

### ✅ Sprint 1: Project Setup
- [x] Next.js + TypeScript + Tailwind
- [x] Folder structure
- [x] ESLint + Prettier
- [x] Landing page
- [x] Git initialization

### 🔄 Sprint 2: Authentication (Next)
- [ ] Email/password signup & login
- [ ] Email verification
- [ ] Password reset
- [ ] Admin role

### 📋 Upcoming Sprints
- Sprint 3: Database & Prisma schema
- Sprint 4: Mpesa CSV parser
- Sprint 5: Manual data ingestion
- Sprint 6: Price fetchers (crypto + stocks)
- Sprint 7: Multi-currency support
- Sprint 8: Net worth calculations
- Sprint 9: Analytics dashboard
- Sprint 10: Financial goals & Monte Carlo
- Sprint 11: Admin panel
- Sprint 12: Docker setup
- Sprint 13: Testing
- Sprint 14: CI/CD
- Sprint 15: Documentation & deployment

---

## 🤝 Contributing

This is an MVP project. Contributions welcome after initial release.

---

## 📄 License

MIT License - See LICENSE file for details

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the Kenyan fintech community**
