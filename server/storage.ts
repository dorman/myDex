import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import { type Portfolio, type Asset, type PriceHistory, type InsertPortfolio, type InsertAsset, type InsertPriceHistory, portfolios, assets, priceHistory } from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // Portfolio operations
  getPortfolios(): Promise<Portfolio[]>;
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

export class DatabaseStorage implements IStorage {
  // Portfolio operations
  async getPortfolios(): Promise<Portfolio[]> {
    return await db.select().from(portfolios).orderBy(desc(portfolios.createdAt));
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

export const storage = new DatabaseStorage();
