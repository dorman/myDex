# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

myDex is a React-based investment portfolio management application that allows users to track, analyze, and manage their investments across multiple asset classes including cryptocurrencies, stocks, commodities, forex, and ETFs. The application features real-time price updates, advanced charting capabilities, multi-asset portfolio tracking, and comprehensive analytics dashboard.

## Development Commands

### Start Development Server
```bash
npm run dev
```
Starts the development server with hot module replacement. The application runs on port 5000 by default.

### Build for Production
```bash
npm run build
```
Builds both the client-side React application and server-side Node.js application for production deployment.

### Start Production Server
```bash
npm start
```
Runs the production build. Requires `npm run build` to be executed first.

### Type Checking
```bash
npm run check
```
Runs TypeScript compiler in check mode to validate types without emitting files.

### Database Operations
```bash
# Push schema changes to database
npm run db:push
```
Uses Drizzle Kit to push database schema changes to the PostgreSQL database.

## Architecture Overview

### Full-Stack TypeScript Application
- **Frontend**: React 18 with TypeScript, Vite build tooling, and Tailwind CSS
- **Backend**: Node.js/Express server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Shared Types**: Common schema definitions in `shared/schema.ts` used by both client and server

### Directory Structure
```
├── client/              # React frontend application
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── hooks/       # Custom React hooks
│       ├── lib/         # Utility libraries and API client
│       ├── pages/       # Route components
│       └── types/       # TypeScript type definitions
├── server/              # Express backend application
│   ├── index.ts         # Main server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database layer abstraction
│   └── vite.ts          # Vite integration for development
├── shared/              # Shared code between client and server
│   └── schema.ts        # Database schema and Zod validation schemas
└── migrations/          # Database migration files (generated)
```

### Database Schema
The application uses three main entities:
- **Portfolios**: Core portfolio metadata with calculated performance metrics
- **Assets**: Individual asset holdings with quantity, purchase price, and current valuation
- **Price History**: OHLC price data for chart visualization

All database operations use Drizzle ORM with shared Zod schemas for validation between client and server.

### API Integration
- **Primary Data Source**: Coinbase API for cryptocurrency price feeds with built-in rate limiting
- **Fallback Strategy**: Intelligent API routing with fallback support for different asset types
- **Price Updates**: Manual and automatic price updates with live calculation of gains/losses

### State Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with Zod validation
- **Wouter**: Lightweight client-side routing

### UI Framework
- **Component Library**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS utility-first approach
- **Icons**: Lucide React for consistent visual elements
- **Charts**: Recharts for portfolio analytics and asset price visualization

### Development Environment
The application is designed to run in development mode with:
- Hot module replacement for fast development cycles
- Integrated TypeScript compilation with strict mode
- Shared type definitions between frontend and backend
- Database schema management with Drizzle Kit

### Key Features
- Multi-asset portfolio tracking (crypto, stocks, commodities, forex, ETFs)
- Real-time price updates with manual refresh capability
- Interactive charts with historical price data
- Portfolio analytics with asset allocation and performance metrics
- Asset search functionality across multiple asset classes
- Responsive design with mobile-first approach

## Environment Variables

The application requires the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string (required)
- `COINBASE_API_KEY`: Coinbase API key for enhanced rate limits (optional)
- `COINBASE_API_SECRET`: Coinbase API secret (optional)
- `PORT`: Server port (defaults to 5000)

## Notes

- The application uses ES modules throughout (set in package.json)
- All database operations are type-safe through Drizzle ORM
- The server integrates Vite in development for seamless full-stack development
- Price data includes fallback mechanisms for when external APIs are unavailable
- The application is designed for deployment on platforms that support Node.js applications
