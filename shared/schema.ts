import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).default("0.00"),
  totalGainLoss: decimal("total_gain_loss", { precision: 15, scale: 2 }).default("0.00"),
  totalGainLossPercent: decimal("total_gain_loss_percent", { precision: 8, scale: 4 }).default("0.0000"),
  dailyChange: decimal("daily_change", { precision: 15, scale: 2 }).default("0.00"),
  dailyChangePercent: decimal("daily_change_percent", { precision: 8, scale: 4 }).default("0.0000"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // crypto, stock, commodity, forex, etf
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 2 }).default("0.00"),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).default("0.00"),
  gainLoss: decimal("gain_loss", { precision: 15, scale: 2 }).default("0.00"),
  gainLossPercent: decimal("gain_loss_percent", { precision: 8, scale: 4 }).default("0.0000"),
  dailyChange: decimal("daily_change", { precision: 15, scale: 2 }).default("0.00"),
  dailyChangePercent: decimal("daily_change_percent", { precision: 8, scale: 4 }).default("0.0000"),
  metadata: jsonb("metadata"), // Store additional data like icon, exchange, etc.
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").notNull().references(() => assets.id),
  symbol: text("symbol").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  open: decimal("open", { precision: 15, scale: 2 }).notNull(),
  high: decimal("high", { precision: 15, scale: 2 }).notNull(),
  low: decimal("low", { precision: 15, scale: 2 }).notNull(),
  close: decimal("close", { precision: 15, scale: 2 }).notNull(),
  volume: decimal("volume", { precision: 20, scale: 8 }).default("0.00000000"),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
});

export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
