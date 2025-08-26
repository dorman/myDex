# Overview

This is a React-based investment portfolio management application that allows users to track, analyze, and manage their investments across multiple asset classes including cryptocurrencies, stocks, commodities, forex, and ETFs. The application features real-time price updates, advanced charting capabilities, multi-asset portfolio tracking, and comprehensive analytics dashboard.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for build tooling and development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **UI Components**: Radix UI primitives with custom Tailwind styling through shadcn/ui

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with structured error responses
- **Logging**: Custom request/response logging with performance metrics

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Data Validation**: Zod schemas shared between client and server for type safety

## Database Schema Design
- **Portfolios Table**: Core portfolio metadata with calculated totals and performance metrics
- **Assets Table**: Individual asset holdings with quantity, purchase price, and current valuation
- **Price History Table**: OHLC (Open, High, Low, Close) price data for chart visualization
- **Relationships**: Foreign key constraints linking assets to portfolios and price history to assets

## External API Integration
- **Primary Data Source**: Coinbase API for cryptocurrency price feeds
- **Rate Limiting**: Built-in request throttling and error handling
- **Fallback Strategy**: Intelligent API routing with failover support for different asset types
- **Price Updates**: Automatic updates every 2 minutes with manual refresh capability

## Real-time Features
- **Price Monitoring**: Scheduled price updates with visual indicators
- **Portfolio Analytics**: Live calculation of gains/losses, performance metrics, and asset allocation
- **Chart Updates**: Dynamic candlestick and volume charts with 30-day historical data

## Development Tooling
- **Build System**: Vite with React plugin and runtime error overlay
- **Code Quality**: TypeScript strict mode with path mapping for clean imports
- **Development Server**: Hot module replacement with middleware integration
- **Asset Handling**: Static file serving with proper caching headers

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and migration management

## External APIs
- **Coinbase API**: Primary source for cryptocurrency market data and pricing
- **Rate Limiting**: Custom implementation for API request throttling

## UI/UX Libraries
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library for consistent visual elements

## Development Tools
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition
- **Wouter**: Lightweight routing for single-page application navigation

## Build and Deployment
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast TypeScript compilation and bundling
- **PostCSS**: CSS processing with Tailwind and Autoprefixer