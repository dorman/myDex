import { apiRequest } from "@/lib/queryClient";
import type { Portfolio, Asset, InsertPortfolio, InsertAsset, User, UserFavorite, InsertUserFavorite } from "@shared/schema";
import type { AssetSearchResult, PortfolioAnalytics } from "@/types/portfolio";

// Authentication API
export const authApi = {
  signup: async (email: string, password: string, fullName: string) => {
    const response = await apiRequest("POST", "/api/auth/signup", {
      email,
      password,
      fullName,
    });
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", {
      email,
      password,
    });
    return response.json();
  },

  logout: async () => {
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  },

  getMe: async (): Promise<User> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};

// User favorites API
export const favoritesApi = {
  getUserFavorites: async (): Promise<UserFavorite[]> => {
    const response = await apiRequest("GET", "/api/user/favorites");
    return response.json();
  },

  addUserFavorite: async (data: Omit<InsertUserFavorite, "userId">): Promise<UserFavorite> => {
    const response = await apiRequest("POST", "/api/user/favorites", data);
    return response.json();
  },

  deleteUserFavorite: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/user/favorites/${id}`);
  },
};

export const portfolioApi = {
  getPortfolios: async (): Promise<Portfolio[]> => {
    const response = await apiRequest("GET", "/api/portfolios");
    return response.json();
  },

  getPortfolio: async (id: string): Promise<Portfolio> => {
    const response = await apiRequest("GET", `/api/portfolios/${id}`);
    return response.json();
  },

  createPortfolio: async (data: Omit<InsertPortfolio, "userId">): Promise<Portfolio> => {
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
  },

  getAssetChartData: async (symbol: string, days: number = 30): Promise<any[]> => {
    const response = await apiRequest("GET", `/api/assets/${symbol}/chart?days=${days}`);
    return response.json();
  }
};

// Convenience API export combining all APIs
export const api = {
  ...authApi,
  ...favoritesApi,
  ...portfolioApi,
};
