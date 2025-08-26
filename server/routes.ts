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
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests

  async fetchCryptoPrice(symbol: string): Promise<{ price: number; change24h: number; changePercent24h: number } | null> {
    try {
      const response = await fetch(`${this.COINBASE_BASE_URL}/exchange-rates?currency=${symbol.replace('USDT', '').replace('USD', '')}`);
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
      // Note: Coinbase Pro API would be needed for candle data
      // This is a placeholder for the structure
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (days * 24 * 60 * 60);
      
      // In a real implementation, you'd use Coinbase Pro API:
      // const response = await fetch(`https://api.pro.coinbase.com/products/${symbol}-USD/candles?start=${startTime}&end=${endTime}&granularity=86400`);
      
      return null; // Placeholder - would return actual candle data
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
      
      // Mock search results - in real implementation, this would search external APIs
      const mockResults = [
        { symbol: "BTC", name: "Bitcoin", type: "crypto", icon: "bitcoin" },
        { symbol: "ETH", name: "Ethereum", type: "crypto", icon: "ethereum" },
        { symbol: "AAPL", name: "Apple Inc.", type: "stock", icon: "apple" },
        { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock", icon: "nvidia" },
        { symbol: "XAUUSD", name: "Gold", type: "commodity", icon: "coins" },
        { symbol: "EURUSD", name: "EUR/USD", type: "forex", icon: "dollar-sign" }
      ].filter(asset => 
        (!query || asset.name.toLowerCase().includes(query.toString().toLowerCase()) || 
         asset.symbol.toLowerCase().includes(query.toString().toLowerCase())) &&
        (!type || asset.type === type)
      );
      
      res.json(mockResults);
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
      const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.totalValue), 0);
      const allocationByType: Record<string, { value: number; percentage: number; count: number }> = {};
      
      for (const asset of assets) {
        const assetValue = parseFloat(asset.totalValue);
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
      const sortedAssets = assets.sort((a, b) => parseFloat(b.dailyChangePercent) - parseFloat(a.dailyChangePercent));
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

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to update portfolio totals
async function updatePortfolioTotals(portfolioId: string) {
  try {
    const assets = await storage.getAssetsByPortfolio(portfolioId);
    
    const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.totalValue), 0);
    const totalGainLoss = assets.reduce((sum, asset) => sum + parseFloat(asset.gainLoss), 0);
    const totalCost = assets.reduce((sum, asset) => sum + (parseFloat(asset.quantity) * parseFloat(asset.purchasePrice)), 0);
    const dailyChange = assets.reduce((sum, asset) => sum + parseFloat(asset.dailyChange), 0);
    
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
