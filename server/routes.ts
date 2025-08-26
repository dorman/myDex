import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPortfolioSchema, insertAssetSchema } from "@shared/schema";
import { z } from "zod";

interface CoinbaseTickerResponse {
  price: string;
  volume_24h: string;
  price_change_24h: string;
  price_change_percent_24h: string;
}

interface CoinbaseCandlesResponse {
  timestamp: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

// External API service for fetching real-time prices
class PriceService {
  private readonly COINBASE_BASE_URL = "https://api.coinbase.com/v2";
  private readonly COINBASE_PRO_URL = "https://api.exchange.coinbase.com";
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private readonly API_KEY = process.env.COINBASE_API_KEY;
  private readonly API_SECRET = process.env.COINBASE_API_SECRET;

  private getAuthHeaders(): HeadersInit {
    if (!this.API_KEY || !this.API_SECRET) {
      return {};
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    // For production, you'd need to create proper HMAC signature
    // For now, using API key in headers
    return {
      'CB-ACCESS-KEY': this.API_KEY,
      'CB-ACCESS-TIMESTAMP': timestamp.toString(),
      'Content-Type': 'application/json'
    };
  }

  async fetchCryptoPrice(symbol: string): Promise<{ price: number; change24h: number; changePercent24h: number } | null> {
    try {
      // Try authenticated API first, fallback to public
      const headers = this.getAuthHeaders();
      const cleanSymbol = symbol.replace('USDT', '').replace('USD', '');
      
      // Use Coinbase Pro API for better data if authenticated
      if (this.API_KEY) {
        try {
          const tickerResponse = await fetch(`${this.COINBASE_PRO_URL}/products/${cleanSymbol}-USD/ticker`, { headers });
          if (tickerResponse.ok) {
            const tickerData = await tickerResponse.json();
            const statsResponse = await fetch(`${this.COINBASE_PRO_URL}/products/${cleanSymbol}-USD/stats`, { headers });
            
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              const price = parseFloat(tickerData.price);
              const open24h = parseFloat(statsData.open);
              const change24h = price - open24h;
              const changePercent24h = ((change24h / open24h) * 100);
              
              return {
                price,
                change24h,
                changePercent24h
              };
            }
          }
        } catch (proError) {
          console.log('Pro API failed, falling back to public API');
        }
      }
      
      // Fallback to public API
      const response = await fetch(`${this.COINBASE_BASE_URL}/exchange-rates?currency=${cleanSymbol}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      const usdRate = parseFloat(data.data.rates.USD);
      
      // For change data, we'd need historical data or a different endpoint
      // For now, return basic price with 0 change (real implementation would fetch this)
      return {
        price: usdRate,
        change24h: 0,
        changePercent24h: 0
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  async fetchCryptoCandleData(symbol: string, days: number = 30): Promise<CoinbaseCandlesResponse[] | null> {
    try {
      if (!this.API_KEY) {
        console.log('No API key available for candle data');
        return null;
      }
      
      const headers = this.getAuthHeaders();
      const cleanSymbol = symbol.replace('USDT', '').replace('USD', '');
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
      
      // Use Coinbase Pro API for historical candle data
      const response = await fetch(
        `${this.COINBASE_PRO_URL}/products/${cleanSymbol}-USD/candles?start=${startTime}&end=${endTime}&granularity=86400`,
        { headers }
      );
      
      if (!response.ok) {
        console.error(`Candle data API error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      // Coinbase Pro returns [time, low, high, open, close, volume]
      return data.map((candle: number[]) => ({
        timestamp: candle[0],
        low: candle[1],
        high: candle[2],
        open: candle[3],
        close: candle[4],
        volume: candle[5]
      })).reverse(); // Reverse to get chronological order
      
    } catch (error) {
      console.error(`Error fetching candle data for ${symbol}:`, error);
      return null;
    }
  }

  // Fallback prices for popular assets when APIs are unavailable
  getFallbackPrice(symbol: string): { price: number; change24h: number; changePercent24h: number } | null {
    const fallbackPrices: Record<string, { price: number; change24h: number; changePercent24h: number }> = {
      'BTC': { price: 67842.30, change24h: 1547, changePercent24h: 2.34 },
      'ETH': { price: 3742.85, change24h: -1098, changePercent24h: -1.87 },
      'AAPL': { price: 189.76, change24h: 412, changePercent24h: 0.87 },
      'NVDA': { price: 924.37, change24h: 3847, changePercent24h: 3.42 },
      'XAUUSD': { price: 2687.42, change24h: 138, changePercent24h: 0.34 },
      'EURUSD': { price: 1.0847, change24h: -65, changePercent24h: -0.12 }
    };

    return fallbackPrices[symbol] || null;
  }
}

const priceService = new PriceService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Portfolio routes
  app.get("/api/portfolios", async (req, res) => {
    try {
      const portfolios = await storage.getPortfolios();
      res.json(portfolios);
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      res.status(500).json({ message: "Failed to fetch portfolios" });
    }
  });

  app.get("/api/portfolios/:id", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/portfolios", async (req, res) => {
    try {
      const validatedData = insertPortfolioSchema.parse(req.body);
      const portfolio = await storage.createPortfolio(validatedData);
      res.status(201).json(portfolio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid portfolio data", errors: error.errors });
      }
      console.error("Error creating portfolio:", error);
      res.status(500).json({ message: "Failed to create portfolio" });
    }
  });

  // Asset routes
  app.get("/api/portfolios/:portfolioId/assets", async (req, res) => {
    try {
      const assets = await storage.getAssetsByPortfolio(req.params.portfolioId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.post("/api/portfolios/:portfolioId/assets", async (req, res) => {
    try {
      const assetData = {
        ...req.body,
        portfolioId: req.params.portfolioId
      };
      const validatedData = insertAssetSchema.parse(assetData);
      
      // Fetch current price for the asset
      const priceData = await priceService.fetchCryptoPrice(validatedData.symbol) 
        || priceService.getFallbackPrice(validatedData.symbol);
      
      if (priceData) {
        validatedData.currentPrice = priceData.price.toString();
        validatedData.dailyChange = priceData.change24h.toString();
        validatedData.dailyChangePercent = priceData.changePercent24h.toString();
        
        // Calculate total value and gain/loss
        const quantity = parseFloat(validatedData.quantity);
        const currentPrice = priceData.price;
        const purchasePrice = parseFloat(validatedData.purchasePrice);
        
        validatedData.totalValue = (quantity * currentPrice).toString();
        validatedData.gainLoss = (quantity * (currentPrice - purchasePrice)).toString();
        validatedData.gainLossPercent = (((currentPrice - purchasePrice) / purchasePrice) * 100).toString();
      }
      
      const asset = await storage.createAsset(validatedData);
      
      // Update portfolio totals
      await updatePortfolioTotals(req.params.portfolioId);
      
      res.status(201).json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid asset data", errors: error.errors });
      }
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const deleted = await storage.deleteAsset(req.params.id);
      if (deleted) {
        // Update portfolio totals after deletion
        await updatePortfolioTotals(asset.portfolioId);
        res.json({ message: "Asset deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete asset" });
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Price update route
  app.post("/api/portfolios/:portfolioId/update-prices", async (req, res) => {
    try {
      const assets = await storage.getAssetsByPortfolio(req.params.portfolioId);
      
      for (const asset of assets) {
        const priceData = await priceService.fetchCryptoPrice(asset.symbol) 
          || priceService.getFallbackPrice(asset.symbol);
        
        if (priceData) {
          const quantity = parseFloat(asset.quantity);
          const currentPrice = priceData.price;
          const purchasePrice = parseFloat(asset.purchasePrice);
          
          await storage.updateAsset(asset.id, {
            currentPrice: currentPrice.toString(),
            dailyChange: priceData.change24h.toString(),
            dailyChangePercent: priceData.changePercent24h.toString(),
            totalValue: (quantity * currentPrice).toString(),
            gainLoss: (quantity * (currentPrice - purchasePrice)).toString(),
            gainLossPercent: (((currentPrice - purchasePrice) / purchasePrice) * 100).toString()
          });
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Update portfolio totals
      await updatePortfolioTotals(req.params.portfolioId);
      
      res.json({ message: "Prices updated successfully" });
    } catch (error) {
      console.error("Error updating prices:", error);
      res.status(500).json({ message: "Failed to update prices" });
    }
  });

  // Asset search route
  app.get("/api/search-assets", async (req, res) => {
    try {
      const { query, type } = req.query;
      
      // Comprehensive asset database for search
      const allAssets = [
        // Major Cryptocurrencies
        { symbol: "BTC", name: "Bitcoin", type: "crypto", icon: "bitcoin" },
        { symbol: "ETH", name: "Ethereum", type: "crypto", icon: "ethereum" },
        { symbol: "XRP", name: "Ripple", type: "crypto", icon: "cryptocurrency" },
        { symbol: "ADA", name: "Cardano", type: "crypto", icon: "cryptocurrency" },
        { symbol: "SOL", name: "Solana", type: "crypto", icon: "cryptocurrency" },
        { symbol: "DOGE", name: "Dogecoin", type: "crypto", icon: "cryptocurrency" },
        { symbol: "DOT", name: "Polkadot", type: "crypto", icon: "cryptocurrency" },
        { symbol: "SHIB", name: "Shiba Inu", type: "crypto", icon: "cryptocurrency" },
        { symbol: "AVAX", name: "Avalanche", type: "crypto", icon: "cryptocurrency" },
        { symbol: "LINK", name: "Chainlink", type: "crypto", icon: "cryptocurrency" },
        { symbol: "MATIC", name: "Polygon", type: "crypto", icon: "cryptocurrency" },
        { symbol: "UNI", name: "Uniswap", type: "crypto", icon: "cryptocurrency" },
        { symbol: "LTC", name: "Litecoin", type: "crypto", icon: "cryptocurrency" },
        { symbol: "BCH", name: "Bitcoin Cash", type: "crypto", icon: "cryptocurrency" },
        { symbol: "BNB", name: "Binance Coin", type: "crypto", icon: "cryptocurrency" },
        { symbol: "ATOM", name: "Cosmos", type: "crypto", icon: "cryptocurrency" },
        { symbol: "FTT", name: "FTX Token", type: "crypto", icon: "cryptocurrency" },
        { symbol: "NEAR", name: "NEAR Protocol", type: "crypto", icon: "cryptocurrency" },
        { symbol: "ALGO", name: "Algorand", type: "crypto", icon: "cryptocurrency" },
        { symbol: "VET", name: "VeChain", type: "crypto", icon: "cryptocurrency" },
        { symbol: "ICP", name: "Internet Computer", type: "crypto", icon: "cryptocurrency" },
        { symbol: "THETA", name: "THETA", type: "crypto", icon: "cryptocurrency" },
        { symbol: "XLM", name: "Stellar", type: "crypto", icon: "cryptocurrency" },
        { symbol: "HBAR", name: "Hedera", type: "crypto", icon: "cryptocurrency" },
        { symbol: "FIL", name: "Filecoin", type: "crypto", icon: "cryptocurrency" },
        { symbol: "TRX", name: "TRON", type: "crypto", icon: "cryptocurrency" },
        { symbol: "ETC", name: "Ethereum Classic", type: "crypto", icon: "cryptocurrency" },
        { symbol: "MANA", name: "Decentraland", type: "crypto", icon: "cryptocurrency" },
        { symbol: "SAND", name: "The Sandbox", type: "crypto", icon: "cryptocurrency" },
        
        // Stocks
        { symbol: "AAPL", name: "Apple Inc.", type: "stock", icon: "apple" },
        { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", icon: "search" },
        { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", icon: "monitor" },
        { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", icon: "package" },
        { symbol: "TSLA", name: "Tesla Inc.", type: "stock", icon: "zap" },
        { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock", icon: "cpu" },
        { symbol: "META", name: "Meta Platforms Inc.", type: "stock", icon: "share" },
        { symbol: "NFLX", name: "Netflix Inc.", type: "stock", icon: "play" },
        { symbol: "AMD", name: "Advanced Micro Devices", type: "stock", icon: "cpu" },
        { symbol: "INTC", name: "Intel Corporation", type: "stock", icon: "cpu" },
        
        // Commodities
        { symbol: "XAUUSD", name: "Gold", type: "commodity", icon: "coins" },
        { symbol: "XAGUSD", name: "Silver", type: "commodity", icon: "coins" },
        { symbol: "CRUDE", name: "Crude Oil", type: "commodity", icon: "fuel" },
        { symbol: "NATGAS", name: "Natural Gas", type: "commodity", icon: "flame" },
        
        // Forex
        { symbol: "EURUSD", name: "EUR/USD", type: "forex", icon: "dollar-sign" },
        { symbol: "GBPUSD", name: "GBP/USD", type: "forex", icon: "dollar-sign" },
        { symbol: "USDJPY", name: "USD/JPY", type: "forex", icon: "dollar-sign" },
        { symbol: "AUDUSD", name: "AUD/USD", type: "forex", icon: "dollar-sign" },
        
        // ETFs
        { symbol: "SPY", name: "SPDR S&P 500 ETF", type: "etf", icon: "trending-up" },
        { symbol: "QQQ", name: "Invesco QQQ Trust", type: "etf", icon: "trending-up" },
        { symbol: "VTI", name: "Vanguard Total Stock Market ETF", type: "etf", icon: "trending-up" },
        { symbol: "IWM", name: "iShares Russell 2000 ETF", type: "etf", icon: "trending-up" }
      ];
      
      // If no query, return empty array (don't show all assets)
      if (!query || String(query).trim().length === 0) {
        return res.json([]);
      }
      
      const searchTerm = String(query).toLowerCase().trim();
      
      // Filter assets based on query - match symbol or name, including partial matches
      const filteredResults = allAssets.filter(asset => {
        const symbolMatch = asset.symbol.toLowerCase().includes(searchTerm);
        const nameMatch = asset.name.toLowerCase().includes(searchTerm);
        const typeMatch = !type || asset.type === String(type);
        
        return (symbolMatch || nameMatch) && typeMatch;
      });
      
      // Sort results: exact symbol matches first, then partial symbol matches, then name matches
      filteredResults.sort((a, b) => {
        const aSymbolExact = a.symbol.toLowerCase() === searchTerm;
        const bSymbolExact = b.symbol.toLowerCase() === searchTerm;
        const aSymbolStart = a.symbol.toLowerCase().startsWith(searchTerm);
        const bSymbolStart = b.symbol.toLowerCase().startsWith(searchTerm);
        
        if (aSymbolExact && !bSymbolExact) return -1;
        if (bSymbolExact && !aSymbolExact) return 1;
        if (aSymbolStart && !bSymbolStart) return -1;
        if (bSymbolStart && !aSymbolStart) return 1;
        
        return a.symbol.localeCompare(b.symbol);
      });
      
      // Limit results to prevent overwhelming UI
      const results = filteredResults.slice(0, 10);
      
      res.json(results);
    } catch (error) {
      console.error("Error searching assets:", error);
      res.status(500).json({ message: "Failed to search assets" });
    }
  });

  // Portfolio analytics route
  app.get("/api/portfolios/:portfolioId/analytics", async (req, res) => {
    try {
      const assets = await storage.getAssetsByPortfolio(req.params.portfolioId);
      
      // Calculate allocation by asset type
      const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.totalValue || '0'), 0);
      const allocationByType: Record<string, { value: number; percentage: number; count: number }> = {};
      
      for (const asset of assets) {
        const assetValue = parseFloat(asset.totalValue || '0');
        if (!allocationByType[asset.assetType]) {
          allocationByType[asset.assetType] = { value: 0, percentage: 0, count: 0 };
        }
        allocationByType[asset.assetType].value += assetValue;
        allocationByType[asset.assetType].count += 1;
      }
      
      // Calculate percentages
      for (const type in allocationByType) {
        allocationByType[type].percentage = (allocationByType[type].value / totalValue) * 100;
      }
      
      // Find best and worst performers
      const sortedAssets = assets.sort((a, b) => parseFloat(b.dailyChangePercent || '0') - parseFloat(a.dailyChangePercent || '0'));
      const bestPerformer = sortedAssets[0];
      const worstPerformer = sortedAssets[sortedAssets.length - 1];
      
      res.json({
        allocation: allocationByType,
        bestPerformer: bestPerformer ? {
          symbol: bestPerformer.symbol,
          name: bestPerformer.name,
          change: bestPerformer.dailyChangePercent
        } : null,
        worstPerformer: worstPerformer ? {
          symbol: worstPerformer.symbol,
          name: worstPerformer.name,
          change: worstPerformer.dailyChangePercent
        } : null,
        totalAssets: assets.length,
        totalValue,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching portfolio analytics:", error);
      res.status(500).json({ message: "Failed to fetch portfolio analytics" });
    }
  });

  // Historical chart data route
  app.get("/api/assets/:symbol/chart", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { days = "30" } = req.query;
      
      const candleData = await priceService.fetchCryptoCandleData(symbol, parseInt(String(days)));
      
      if (!candleData) {
        // Return mock data for development if API fails
        const mockData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          const basePrice = symbol === 'BTC' ? 67000 : symbol === 'ETH' ? 3700 : 100;
          const variance = 0.05; // 5% variance
          
          return {
            timestamp: Math.floor(date.getTime() / 1000),
            open: basePrice * (1 + (Math.random() - 0.5) * variance),
            high: basePrice * (1 + (Math.random() - 0.3) * variance),
            low: basePrice * (1 + (Math.random() - 0.7) * variance), 
            close: basePrice * (1 + (Math.random() - 0.5) * variance),
            volume: Math.random() * 1000000
          };
        });
        
        return res.json(mockData);
      }
      
      res.json(candleData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to update portfolio totals
async function updatePortfolioTotals(portfolioId: string) {
  try {
    const assets = await storage.getAssetsByPortfolio(portfolioId);
    
    const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.totalValue || '0'), 0);
    const totalGainLoss = assets.reduce((sum, asset) => sum + parseFloat(asset.gainLoss || '0'), 0);
    const totalCost = assets.reduce((sum, asset) => sum + (parseFloat(asset.quantity || '0') * parseFloat(asset.purchasePrice || '0')), 0);
    const dailyChange = assets.reduce((sum, asset) => sum + parseFloat(asset.dailyChange || '0'), 0);
    
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;
    
    await storage.updatePortfolio(portfolioId, {
      totalValue: totalValue.toString(),
      totalGainLoss: totalGainLoss.toString(),
      totalGainLossPercent: totalGainLossPercent.toString(),
      dailyChange: dailyChange.toString(),
      dailyChangePercent: dailyChangePercent.toString()
    });
  } catch (error) {
    console.error("Error updating portfolio totals:", error);
  }
}
