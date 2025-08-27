import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import { type Portfolio, type Asset, type PriceHistory, type InsertPortfolio, type InsertAsset, type InsertPriceHistory, type User, type UserFavorite, type InsertUser, type InsertUserFavorite, portfolios, assets, priceHistory, users, userFavorites } from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

let db: any = null;
let useDatabase = false;

// Try to connect to database, fallback to memory storage if it fails
if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
    useDatabase = true;
    console.log("Using database connection - testing connectivity...");
  } catch (error) {
    console.warn("Database connection setup failed, using in-memory storage:", error);
    useDatabase = false;
  }
} else {
  console.log("No DATABASE_URL provided, using in-memory storage");
  useDatabase = false;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // User favorites operations
  getUserFavorites(userId: string): Promise<UserFavorite[]>;
  createUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite>;
  deleteUserFavorite(id: string, userId: string): Promise<boolean>;

  // Portfolio operations
  getPortfolios(): Promise<Portfolio[]>;
  getUserPortfolios(userId: string): Promise<Portfolio[]>;
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio | undefined>;
  deletePortfolio(id: string): Promise<boolean>;

  // Asset operations
  getAssetsByPortfolio(portfolioId: string): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;

  // Price history operations
  getPriceHistory(assetId: string, limit?: number): Promise<PriceHistory[]>;
  createPriceHistory(price: InsertPriceHistory): Promise<PriceHistory>;
  getLatestPrices(symbols: string[]): Promise<PriceHistory[]>;
}

// In-memory storage for fallback
class MemoryStorage implements IStorage {
  private usersStore: User[] = [];
  private userFavoritesStore: UserFavorite[] = [];
  private portfoliosStore: Portfolio[] = [];
  private assetsStore: Asset[] = [];
  private priceHistoryStore: PriceHistory[] = [];

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.usersStore.find(u => u.id === id);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      fullName: user.fullName || null,
      avatarUrl: user.avatarUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.usersStore.push(newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const index = this.usersStore.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    this.usersStore[index] = {
      ...this.usersStore[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.usersStore[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.usersStore.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.usersStore.splice(index, 1);
    // Also delete associated data
    this.userFavoritesStore = this.userFavoritesStore.filter(f => f.userId !== id);
    this.portfoliosStore = this.portfoliosStore.filter(p => p.userId !== id);
    return true;
  }

  // User favorites operations
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return this.userFavoritesStore
      .filter(f => f.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite> {
    const newFavorite: UserFavorite = {
      ...favorite,
      id: uuidv4(),
      metadata: favorite.metadata || null,
      createdAt: new Date(),
    };
    this.userFavoritesStore.push(newFavorite);
    return newFavorite;
  }

  async deleteUserFavorite(id: string, userId: string): Promise<boolean> {
    const index = this.userFavoritesStore.findIndex(f => f.id === id && f.userId === userId);
    if (index === -1) return false;
    
    this.userFavoritesStore.splice(index, 1);
    return true;
  }

  // Portfolio operations
  async getPortfolios(): Promise<Portfolio[]> {
    return [...this.portfoliosStore].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    return this.portfoliosStore
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    return this.portfoliosStore.find(p => p.id === id);
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    // Use the provided ID or generate a new one
    const portfolioId = portfolio.id || uuidv4();
    const newPortfolio: Portfolio = {
      ...portfolio,
      id: portfolioId,
      description: portfolio.description || null,
      totalValue: portfolio.totalValue || "0.00",
      totalGainLoss: portfolio.totalGainLoss || "0.00",
      totalGainLossPercent: portfolio.totalGainLossPercent || "0.0000",
      dailyChange: portfolio.dailyChange || "0.00",
      dailyChangePercent: portfolio.dailyChangePercent || "0.0000",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.portfoliosStore.push(newPortfolio);
    return newPortfolio;
  }

  async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio | undefined> {
    const index = this.portfoliosStore.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.portfoliosStore[index] = {
      ...this.portfoliosStore[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.portfoliosStore[index];
  }

  async deletePortfolio(id: string): Promise<boolean> {
    const index = this.portfoliosStore.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.portfoliosStore.splice(index, 1);
    // Also delete associated assets
    this.assetsStore = this.assetsStore.filter(a => a.portfolioId !== id);
    return true;
  }

  // Asset operations
  async getAssetsByPortfolio(portfolioId: string): Promise<Asset[]> {
    return this.assetsStore
      .filter(a => a.portfolioId === portfolioId)
      .sort((a, b) => parseFloat(b.totalValue || '0') - parseFloat(a.totalValue || '0'));
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    return this.assetsStore.find(a => a.id === id);
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const newAsset: Asset = {
      ...asset,
      id: uuidv4(),
      metadata: asset.metadata || null,
      currentPrice: asset.currentPrice || "0.00",
      totalValue: asset.totalValue || "0.00",
      gainLoss: asset.gainLoss || "0.00",
      gainLossPercent: asset.gainLossPercent || "0.0000",
      dailyChange: asset.dailyChange || "0.00",
      dailyChangePercent: asset.dailyChangePercent || "0.0000",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.assetsStore.push(newAsset);
    return newAsset;
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined> {
    const index = this.assetsStore.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.assetsStore[index] = {
      ...this.assetsStore[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.assetsStore[index];
  }

  async deleteAsset(id: string): Promise<boolean> {
    const index = this.assetsStore.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.assetsStore.splice(index, 1);
    return true;
  }

  // Price history operations
  async getPriceHistory(assetId: string, limit: number = 30): Promise<PriceHistory[]> {
    return this.priceHistoryStore
      .filter(p => p.assetId === assetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createPriceHistory(price: InsertPriceHistory): Promise<PriceHistory> {
    const newPrice: PriceHistory = {
      ...price,
      id: uuidv4(),
      volume: price.volume || null,
    };
    this.priceHistoryStore.push(newPrice);
    return newPrice;
  }

  async getLatestPrices(symbols: string[]): Promise<PriceHistory[]> {
    const results: PriceHistory[] = [];
    for (const symbol of symbols) {
      const latest = this.priceHistoryStore
        .filter(p => p.symbol === symbol)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      if (latest) results.push(latest);
    }
    return results;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // User favorites operations
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt));
  }

  async createUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite> {
    const result = await db.insert(userFavorites).values(favorite).returning();
    return result[0];
  }

  async deleteUserFavorite(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(userFavorites)
      .where(eq(userFavorites.id, id) && eq(userFavorites.userId, userId));
    return result.rowCount > 0;
  }

  // Portfolio operations
  async getPortfolios(): Promise<Portfolio[]> {
    return await db.select().from(portfolios).orderBy(desc(portfolios.createdAt));
  }

  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    return await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .orderBy(desc(portfolios.createdAt));
  }

  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    const result = await db.select().from(portfolios).where(eq(portfolios.id, id));
    return result[0];
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    const result = await db.insert(portfolios).values(portfolio).returning();
    return result[0];
  }

  async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio | undefined> {
    const result = await db
      .update(portfolios)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(portfolios.id, id))
      .returning();
    return result[0];
  }

  async deletePortfolio(id: string): Promise<boolean> {
    const result = await db.delete(portfolios).where(eq(portfolios.id, id));
    return result.rowCount > 0;
  }

  // Asset operations
  async getAssetsByPortfolio(portfolioId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId))
      .orderBy(desc(assets.totalValue));
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const result = await db.select().from(assets).where(eq(assets.id, id));
    return result[0];
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const result = await db.insert(assets).values(asset).returning();
    return result[0];
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined> {
    const result = await db
      .update(assets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return result[0];
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id));
    return result.rowCount > 0;
  }

  // Price history operations
  async getPriceHistory(assetId: string, limit: number = 30): Promise<PriceHistory[]> {
    return await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.assetId, assetId))
      .orderBy(desc(priceHistory.timestamp))
      .limit(limit);
  }

  async createPriceHistory(price: InsertPriceHistory): Promise<PriceHistory> {
    const result = await db.insert(priceHistory).values(price).returning();
    return result[0];
  }

  async getLatestPrices(symbols: string[]): Promise<PriceHistory[]> {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const result = await db
          .select()
          .from(priceHistory)
          .where(eq(priceHistory.symbol, symbol))
          .orderBy(desc(priceHistory.timestamp))
          .limit(1);
        return result[0];
      })
    );
    return results.filter(Boolean);
  }
}

export const storage = useDatabase ? new DatabaseStorage() : new MemoryStorage();
