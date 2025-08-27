# MyDex - Portfolio Tracking Application

A full-stack portfolio tracking application built with React, TypeScript, and Node.js. Track your cryptocurrency and stock investments with real-time price updates, advanced analytics, and beautiful visualizations.

## 🚀 Features

### Core Functionality
- **Portfolio Management**: Create and manage multiple investment portfolios
- **Asset Tracking**: Add cryptocurrencies, stocks, and other assets to your portfolios
- **Real-time Pricing**: Live price updates from CoinGecko API
- **Advanced Analytics**: Comprehensive portfolio analytics with gain/loss calculations
- **Asset Analysis**: Detailed asset analysis with candlestick charts

### User Experience
- **Guest Mode**: Use the app without registration for demo purposes
- **User Authentication**: Secure authentication with Supabase
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Eye-friendly dark theme
- **Asset Search**: Search and discover new assets to add to your portfolio
- **Favorites**: Save frequently viewed assets for quick access

### Technical Features
- **Real-time Updates**: Automatic portfolio refresh and price updates
- **Database Integration**: Persistent data storage with PostgreSQL
- **Error Handling**: Graceful error handling with fallback mechanisms
- **TypeScript**: Full type safety across the entire application

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Recharts** - Beautiful and composable charts
- **React Query** - Powerful data fetching and caching
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe backend development
- **Drizzle ORM** - Type-safe SQL toolkit

### Database & Authentication
- **PostgreSQL** - Robust relational database
- **Supabase** - Backend-as-a-Service for auth and database hosting
- **Supabase Auth** - User authentication and authorization

### External APIs
- **CoinGecko API** - Cryptocurrency price data and market information

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/mydex.git
cd mydex
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Client-side (Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server Configuration
PORT=5000

# Optional: Coinbase API for enhanced rate limits
COINBASE_API_KEY=your-api-key
COINBASE_API_SECRET=your-api-secret
```

### 4. Database Setup
Run database migrations:
```bash
npx drizzle-kit push
```

### 5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🚀 Production Deployment

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

## 📁 Project Structure

```
mydex/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/           # Utility libraries
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript type definitions
├── server/                 # Backend Express server
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared code between client/server
│   └── schema.ts          # Database schema definitions
└── lib/                   # Shared utilities
```

## 🔑 Key Features Explained

### Guest Mode
Users can try the application without creating an account. Guest portfolios are temporary and reset between sessions.

### Real-time Price Updates
The application fetches live cryptocurrency prices from CoinGecko API and updates portfolio values automatically.

### Advanced Analytics
- Portfolio value tracking over time
- Asset allocation visualization
- Gain/loss calculations with percentages
- Performance comparisons

### Asset Analysis
Detailed analysis pages for individual assets featuring:
- Price history charts
- Candlestick charts for technical analysis
- Historical performance metrics
- Market data and statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for cryptocurrency price data
- [Supabase](https://supabase.com/) for backend infrastructure
- [TailwindCSS](https://tailwindcss.com/) for the amazing utility-first CSS framework
- [Recharts](https://recharts.org/) for beautiful chart components

## 📞 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

**Built with ❤️ using modern web technologies**
