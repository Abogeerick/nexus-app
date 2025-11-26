# 💰 Nexus Financial - AI-Powered Financial Management Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Production-ready-success.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)

**A comprehensive, production-ready SaaS platform for financial portfolio management with AI-powered transaction categorization, multi-currency support, and real-time analytics.**

[Features](#-key-features) • [Tech Stack](#-technology-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Skills Showcase](#-skills-showcase)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Skills Showcase](#-skills-showcase)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Project Overview

**Nexus Financial** is a full-stack financial management platform designed specifically for Kenyan users, providing comprehensive tools to track, analyze, and optimize personal finances across multiple asset types. The platform combines modern web technologies with AI-powered insights to deliver a seamless financial management experience.

### Core Value Propositions

- **Unified Financial Dashboard**: Aggregate M-PESA, bank accounts, investments, crypto, and custom assets in one place
- **AI-Powered Categorization**: Automatic transaction classification using rule-based and ML models
- **Real-Time Analytics**: Advanced analytics with interactive charts, spending trends, and budget tracking
- **Multi-Currency Support**: Native KES support with real-time FX conversion
- **Enterprise-Grade Security**: Bank-level encryption, secure authentication, and data protection
- **Mobile-First Design**: Fully responsive with dark mode support

---

## ✨ Key Features

### 🔐 Authentication & Security

- **Secure Authentication System**
  - Email/password authentication with NextAuth.js v5
  - Email verification workflow
  - Password reset functionality with secure tokens
  - JWT-based session management
  - Role-based access control (USER/ADMIN)
  - Protected routes with middleware

- **Security Features**
  - Bcrypt password hashing
  - CSRF protection
  - SQL injection prevention via Prisma ORM
  - XSS protection
  - Secure token generation and validation

### 💳 M-PESA Transaction Management

- **Multi-Format Import**
  - CSV file parsing (official M-PESA exports)
  - PDF statement parsing with OCR
  - SMS/text message parsing
  - Manual transaction entry
  - Auto-format detection

- **Intelligent Processing**
  - Duplicate transaction detection (multiple algorithms)
  - Transaction code extraction and validation
  - Merchant name normalization
  - Date/time normalization across formats
  - Amount and balance parsing

- **AI-Powered Categorization**
  - Rule-based classification (offline, fast)
  - Merchant name normalization
  - Category suggestions (Groceries, Dining, Transport, Utilities, etc.)
  - Recurring payment detection
  - Extensible ML model support (Transformers.js)

### 📊 Analytics & Insights

- **Financial Analytics Dashboard**
  - Income vs. expenses visualization
  - Category breakdown with pie charts
  - Monthly spending trends
  - Top merchants analysis
  - Savings rate calculation
  - Custom date range filtering

- **Budget Management**
  - Category-based budgets
  - Monthly/weekly budget tracking
  - Budget vs. actual spending
  - Budget alerts and notifications
  - Budget history tracking

- **Data Export**
  - CSV export functionality
  - Filtered data export
  - Custom date range exports
  - Transaction history reports

### 💰 Portfolio Management

- **Multi-Asset Tracking**
  - M-PESA balance tracking
  - Bank account management
  - Investment portfolio (stocks, bonds, mutual funds)
  - Cryptocurrency tracking
  - Custom asset types

- **Real-Time Price Updates**
  - Crypto price fetching (CoinGecko API)
  - Stock price integration
  - Currency exchange rates
  - Portfolio valuation

### 🎨 User Experience

- **Modern UI/UX**
  - Framer Motion animations
  - Responsive design (mobile, tablet, desktop)
  - Dark mode support (system preference sync)
  - Loading states and transitions
  - Route transition animations
  - Interactive charts (Recharts)

- **Navigation & Layout**
  - Collapsible sidebar navigation
  - Mobile-responsive menu
  - Breadcrumb navigation
  - Quick action buttons
  - User profile management

---

## 🚀 Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.2 | React framework with App Router, SSR, SSG |
| **React** | 19.2.0 | UI library with latest features |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Framer Motion** | 12.23.24 | Animation library for smooth transitions |
| **Recharts** | 3.4.1 | Composable charting library |
| **Lucide React** | 0.554.0 | Icon library |
| **next-themes** | 0.4.6 | Dark mode support |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.0.2 | Serverless API endpoints |
| **NextAuth.js** | 5.0.0-beta.30 | Authentication & session management |
| **Prisma ORM** | 6.19.0 | Type-safe database access |
| **PostgreSQL** | 14+ | Relational database |
| **Node.js** | 18+ | Runtime environment |

### AI & Machine Learning

| Technology | Version | Purpose |
|------------|---------|---------|
| **@xenova/transformers** | 2.17.2 | ML model inference (client-side) |
| **Custom Classifiers** | - | Rule-based transaction categorization |
| **Merchant Normalizer** | - | Merchant name standardization |

### Data Processing

| Technology | Version | Purpose |
|------------|---------|---------|
| **pdf2json** | 3.1.4 | PDF parsing and text extraction |
| **Custom Parsers** | - | M-PESA CSV, SMS, text parsing |
| **Duplicate Detector** | - | Transaction deduplication algorithms |

### Security & Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| **bcryptjs** | 3.0.3 | Password hashing |
| **jsonwebtoken** | 9.0.2 | JWT token generation |
| **nodemailer** | 7.0.10 | Email sending (verification, reset) |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.x | Code linting |
| **Prettier** | 3.6.2 | Code formatting |
| **TypeScript** | 5.x | Type checking |
| **tsx** | 4.20.6 | TypeScript execution |
| **dotenv-cli** | 11.0.0 | Environment variable management |

### External APIs & Services

- **CoinGecko API**: Cryptocurrency price data
- **Exchange Rate APIs**: Currency conversion
- **SMTP Services**: Email delivery (Gmail, Mailtrap)

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Landing    │  │  Dashboard   │  │   Auth       │      │
│  │    Page      │  │   Pages      │  │   Pages      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘             │
│                              │                                │
│                    ┌─────────▼─────────┐                      │
│                    │  React Components │                      │
│                    │  (Framer Motion)  │                      │
│                    └─────────┬─────────┘                      │
└──────────────────────────────┼──────────────────────────────┘
                                │
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js App Router                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │              API Routes Layer                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │   Auth   │  │  M-PESA   │  │ Portfolio│        │    │
│  │  │  Routes  │  │  Routes   │  │  Routes  │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘        │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                                │
┌──────────────────────────────▼──────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Parsers   │  │  Classifiers │  │  Analytics   │      │
│  │  (CSV/PDF)  │  │     (AI)     │  │   Engine     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────┬──────────────────────────────┘
                                │
┌──────────────────────────────▼──────────────────────────────┐
│                    Data Access Layer                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Prisma ORM                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │  Users   │  │Transactions│ │  Assets │         │    │
│  │  └──────────┘  └──────────┘  └──────────┘         │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                                │
┌──────────────────────────────▼──────────────────────────────┐
│                    PostgreSQL Database                       │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

- **Server-Side Rendering (SSR)**: Next.js App Router for optimal performance
- **API Routes**: RESTful API endpoints for data operations
- **Type Safety**: End-to-end TypeScript with Prisma-generated types
- **Component-Based Architecture**: Reusable React components
- **Middleware Pattern**: Route protection and authentication
- **Service Layer**: Business logic separation from API routes

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (recommended: v20+)
- **npm**: v9+ or **pnpm**: v8+
- **PostgreSQL**: v14+ (or Docker)
- **Git**: v2.30+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/nexus-app.git
   cd nexus-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/nexus_finance"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-min-32-chars"
   
   # Email (SMTP)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password"
   
   # External APIs (Optional)
   COINGECKO_API_KEY="your-api-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # (Optional) Seed demo data
   npm run db:seed:demo
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Account

- **Email**: `demo@nexus.ke`
- **Password**: `Demo@2025`

---

## 📁 Project Structure

```
nexus-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                     # API routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   ├── mpesa/              # M-PESA transaction APIs
│   │   │   ├── accounts/           # Account management APIs
│   │   │   ├── assets/             # Asset management APIs
│   │   │   └── dashboard/          # Dashboard data APIs
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── signin/             # Sign in page
│   │   │   ├── signup/             # Sign up page
│   │   │   ├── forgot-password/    # Password reset
│   │   │   └── verify-email/       # Email verification
│   │   ├── dashboard/              # Dashboard pages
│   │   │   ├── mpesa/              # M-PESA management
│   │   │   │   ├── analytics/     # Analytics page
│   │   │   │   ├── budgets/       # Budget management
│   │   │   │   └── export/        # Data export
│   │   │   ├── investments/        # Investment tracking
│   │   │   ├── cards/             # Bank accounts
│   │   │   └── settings/          # User settings
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css             # Global styles
│   ├── components/                  # React components
│   │   ├── auth/                   # Auth components
│   │   ├── layout/                 # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── loading/                # Loading components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── LoadingOverlay.tsx
│   │   │   ├── RouteLoader.tsx
│   │   │   └── ButtonLoader.tsx
│   │   ├── mpesa/                  # M-PESA components
│   │   │   ├── MpesaUpload.tsx
│   │   │   ├── MpesaPDFUpload.tsx
│   │   │   ├── MpesaTransactions.tsx
│   │   │   └── MpesaAnalytics.tsx
│   │   ├── charts/                 # Chart components
│   │   └── ui/                     # Reusable UI components
│   ├── lib/                         # Utility libraries
│   │   ├── ai/                     # AI/ML modules
│   │   │   ├── mpesa-classifier.ts
│   │   │   ├── transformers-classifier.ts
│   │   │   └── merchant-normalizer.ts
│   │   ├── auth/                   # Authentication utilities
│   │   │   ├── auth.ts
│   │   │   ├── auth.config.ts
│   │   │   ├── password.ts
│   │   │   ├── jwt.ts
│   │   │   └── email.ts
│   │   ├── parsers/                # Data parsers
│   │   │   ├── mpesa-csv.ts
│   │   │   ├── mpesa-pdf.ts
│   │   │   ├── mpesa-text.ts
│   │   │   ├── mpesa-parser.ts
│   │   │   ├── mpesa-normalizer.ts
│   │   │   └── mpesa-duplicate-detector.ts
│   │   ├── fetchers/               # External API fetchers
│   │   │   └── price.ts
│   │   ├── prisma.ts               # Prisma client
│   │   └── utils.ts                # General utilities
│   ├── types/                       # TypeScript types
│   │   ├── mpesa.ts
│   │   └── next-auth.d.ts
│   ├── middleware.ts                # Next.js middleware
│   └── modules/                     # Business logic modules
│       ├── auth/
│       ├── portfolio/
│       ├── transactions/
│       └── goals/
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── seed.ts                     # Database seeds
│   ├── seed-mpesa.ts               # M-PESA demo data
│   └── seed-mpesa-demo.ts          # Full demo dataset
├── public/                          # Static assets
│   └── samples/                    # Sample files
├── docs/                            # Documentation
│   ├── SETUP-GUIDE.md
│   ├── MPESA-MODULE-GUIDE.md
│   ├── MPESA-PDF-SUPPORT.md
│   └── MPESA-QUICK-START.md
├── scripts/                         # Utility scripts
├── .env.example                     # Environment template
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address

### M-PESA Endpoints

- `POST /api/mpesa/parse` - Parse M-PESA statements (CSV/PDF/Text)
- `GET /api/mpesa/transactions` - Get transactions with filters
- `PATCH /api/mpesa/transactions/[id]` - Update transaction
- `DELETE /api/mpesa/transactions/[id]` - Delete transaction
- `POST /api/mpesa/classify` - Classify transactions with AI
- `GET /api/mpesa/analytics` - Get analytics data
- `GET /api/mpesa/budgets` - Get budgets
- `POST /api/mpesa/budgets` - Create budget
- `PATCH /api/mpesa/budgets/[id]` - Update budget
- `DELETE /api/mpesa/budgets/[id]` - Delete budget

### Portfolio Endpoints

- `GET /api/accounts` - Get user accounts
- `POST /api/accounts` - Create account
- `GET /api/assets` - Get user assets
- `POST /api/assets` - Create asset
- `GET /api/dashboard/summary` - Get dashboard summary

---

## 💼 Skills Showcase

This project demonstrates proficiency in the following technologies and skills:

### Frontend Development
- ✅ **Next.js 16** - App Router, Server Components, API Routes
- ✅ **React 19** - Latest React features, hooks, context
- ✅ **TypeScript** - Type-safe development, interfaces, generics
- ✅ **Tailwind CSS 4** - Utility-first styling, responsive design
- ✅ **Framer Motion** - Complex animations, page transitions
- ✅ **Recharts** - Data visualization, interactive charts
- ✅ **Responsive Design** - Mobile-first approach, breakpoints

### Backend Development
- ✅ **Next.js API Routes** - RESTful API design, middleware
- ✅ **Prisma ORM** - Type-safe database access, migrations
- ✅ **PostgreSQL** - Relational database design, queries
- ✅ **NextAuth.js** - Authentication, session management
- ✅ **JWT** - Token-based authentication
- ✅ **bcrypt** - Password hashing and security

### AI & Machine Learning
- ✅ **Transformers.js** - Client-side ML model inference
- ✅ **Rule-Based Classification** - Pattern matching, keyword detection
- ✅ **Natural Language Processing** - Text parsing, entity extraction
- ✅ **Data Normalization** - Merchant name standardization

### Data Processing
- ✅ **PDF Parsing** - OCR, text extraction from PDFs
- ✅ **CSV Processing** - File parsing, data transformation
- ✅ **Text Parsing** - Regex patterns, format detection
- ✅ **Duplicate Detection** - Multiple algorithm implementation

### Security
- ✅ **Authentication** - Email/password, JWT tokens
- ✅ **Authorization** - Role-based access control
- ✅ **Password Security** - Hashing, validation, reset flows
- ✅ **Email Verification** - Secure token generation
- ✅ **CSRF Protection** - Security middleware
- ✅ **SQL Injection Prevention** - ORM usage

### DevOps & Tools
- ✅ **Git** - Version control, branching strategies
- ✅ **ESLint** - Code linting, best practices
- ✅ **Prettier** - Code formatting
- ✅ **TypeScript** - Type checking
- ✅ **Environment Management** - .env files, secrets

### Software Engineering
- ✅ **Clean Architecture** - Separation of concerns
- ✅ **Component Design** - Reusable, modular components
- ✅ **API Design** - RESTful principles
- ✅ **Database Design** - Schema design, relationships
- ✅ **Error Handling** - Try-catch, error boundaries
- ✅ **Code Organization** - Folder structure, naming conventions

### UI/UX Design
- ✅ **Modern Design** - Clean, professional interface
- ✅ **Dark Mode** - Theme switching, system preference
- ✅ **Loading States** - User feedback, animations
- ✅ **Accessibility** - Semantic HTML, ARIA labels
- ✅ **User Experience** - Intuitive navigation, feedback

### Testing & Quality
- ✅ **Type Safety** - TypeScript strict mode
- ✅ **Code Quality** - ESLint, Prettier
- ✅ **Documentation** - README, code comments

---

## 🚢 Deployment

### Recommended Platforms

1. **Vercel** (Recommended for Next.js)
   - Automatic deployments
   - Serverless functions
   - Edge network
   - Free tier available

2. **Railway**
   - PostgreSQL included
   - Simple deployment
   - Free tier available

3. **Render**
   - PostgreSQL support
   - Auto-deploy from Git
   - Free tier available

### Deployment Steps

1. **Prepare environment variables**
   ```bash
   # Set all required env vars in your hosting platform
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

4. **Deploy**
   - Connect your Git repository
   - Configure environment variables
   - Deploy!

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Check TypeScript types |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |
| `npm run db:seed:demo` | Seed demo data |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact & Support

- **GitHub Issues**: [Open an issue](https://github.com/your-username/nexus-app/issues)
- **Email**: support@nexus-financial.com

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- All open-source contributors whose libraries made this possible

---

<div align="center">

**Built with ❤️ for the Kenyan fintech community**

⭐ Star this repo if you find it helpful!

</div>
