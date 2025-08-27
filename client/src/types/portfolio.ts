export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'commodity' | 'forex' | 'etf';
  icon: string;
}

export interface PortfolioAnalytics {
  allocation: Record<string, {
    value: number;
    percentage: number;
    count: number;
  }>;
  bestPerformer: {
    symbol: string;
    name: string;
    change: string;
  } | null;
  worstPerformer: {
    symbol: string;
    name: string;
    change: string;
  } | null;
  totalAssets: number;
  totalValue: number;
  lastUpdated: string;
}

export interface ChartData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioIndexData {
  timestamp: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioIndexData {
  timestamp: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioIndexData {
  timestamp: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioIndexData {
  timestamp: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
