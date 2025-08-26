import { apiRequest } from "@/lib/queryClient";
import type { Portfolio, Asset, InsertPortfolio, InsertAsset } from "@shared/schema";
import type { AssetSearchResult, PortfolioAnalytics } from "@/types/portfolio";

export const portfolioApi = {
  getPortfolios: async (): Promise<Portfolio[]> => {
    const response = await apiRequest("GET", "/api/portfolios");
    return response.json();
  },

  getPortfolio: async (id: string): Promise<Portfolio> => {
    const response = await apiRequest("GET", `/api/portfolios/${id}`);
    return response.json();
  },

  createPortfolio: async (data: InsertPortfolio): Promise<Portfolio> => {
    const response = await apiRequest("POST", "/api/portfolios", data);
    return response.json();
  },

  getAssets: async (portfolioId: string): Promise<Asset[]> => {
    const response = await apiRequest("GET", `/api/portfolios/${portfolioId}/assets`);
    return response.json();
  },

  createAsset: async (portfolioId: string, data: Omit<InsertAsset, "portfolioId">): Promise<Asset> => {
    const response = await apiRequest("POST", `/api/portfolios/${portfolioId}/assets`, data);
    return response.json();
  },

  deleteAsset: async (assetId: string): Promise<void> => {
    await apiRequest("DELETE", `/api/assets/${assetId}`);
  },

  updatePrices: async (portfolioId: string): Promise<void> => {
    await apiRequest("POST", `/api/portfolios/${portfolioId}/update-prices`);
  },

  searchAssets: async (query: string, type?: string): Promise<AssetSearchResult[]> => {
    const params = new URLSearchParams({ query });
    if (type) params.append("type", type);
    
    const response = await apiRequest("GET", `/api/search-assets?${params}`);
    return response.json();
  },

  getAnalytics: async (portfolioId: string): Promise<PortfolioAnalytics> => {
    const response = await apiRequest("GET", `/api/portfolios/${portfolioId}/analytics`);
    return response.json();
  }
};
