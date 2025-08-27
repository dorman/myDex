import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset } from "@shared/schema";

interface PortfolioIndexChartProps {
  portfolioId: string;
  assets: Asset[];
  isLoading: boolean;
}

interface ChartDataPoint {
  date: string;
  indexValue: number;
  timestamp: number;
}

export default function PortfolioIndexChart({ assets, isLoading }: PortfolioIndexChartProps) {
  // Generate mock historical data for the index chart
  // In a real implementation, this would come from the API
  const chartData = useMemo(() => {
    if (assets.length === 0) return [];
    
    // Calculate total portfolio value
    const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.totalValue || '0'), 0);
    
    if (totalValue === 0) return [];
    
    // Generate 30 days of mock data
    const data: ChartDataPoint[] = [];
    const today = new Date();
    
    // Starting index value (normalized to 1000 for better visualization)
    let baseIndexValue = 1000;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate some realistic volatility
      // Use weighted average of asset changes to influence the index
      let totalWeightedChange = 0;
      let totalWeight = 0;
      
      assets.forEach(asset => {
        const weight = parseFloat(asset.totalValue || '0') / totalValue;
        const assetChange = parseFloat(asset.dailyChangePercent || '0') / 100;
        
        totalWeightedChange += assetChange * weight;
        totalWeight += weight;
      });
      
      // Apply some random walk with trend based on weighted portfolio performance
      const trend = totalWeightedChange * 30; // Amplify for 30-day view
      const randomWalk = (Math.random() - 0.5) * 0.02; // Small random component
      const volatilityFactor = Math.sin(i * 0.3) * 0.01; // Some cyclical movement
      
      const dailyReturn = trend + randomWalk + volatilityFactor;
      
      if (i === 29) {
        // First day
        baseIndexValue = 1000;
      } else {
        // Apply cumulative returns
        baseIndexValue = baseIndexValue * (1 + dailyReturn);
      }
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        indexValue: baseIndexValue,
        timestamp: date.getTime(),
      });
    }
    
    return data;
  }, [assets]);

  const currentIndexValue = chartData.length > 0 ? chartData[chartData.length - 1].indexValue : 1000;
  const startIndexValue = chartData.length > 0 ? chartData[0].indexValue : 1000;
  const indexChange = ((currentIndexValue - startIndexValue) / startIndexValue) * 100;
  const isPositive = indexChange >= 0;

  if (isLoading) {
    return (
      <div className="h-96 w-full">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 bg-gray-600 mb-2" />
          <Skeleton className="h-4 w-24 bg-gray-600" />
        </div>
        <Skeleton className="h-80 w-full bg-gray-600" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Portfolio Data</h3>
          <p className="text-sm text-gray-400">
            Add assets to your portfolio to see the performance index.
          </p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const changeFromStart = ((data.indexValue - startIndexValue) / startIndexValue) * 100;
      
      return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{label}</p>
          <p className="text-sm text-gray-300">
            Index Value: <span className="text-white font-semibold">{data.indexValue.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            Change: 
            <span className={`font-semibold ml-1 ${
              changeFromStart >= 0 ? 'text-brand-green' : 'text-brand-red'
            }`}>
              {changeFromStart >= 0 ? '+' : ''}{changeFromStart.toFixed(2)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Header Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white" data-testid="portfolio-index-value">
              {currentIndexValue.toFixed(2)}
            </h3>
            <p className={`text-sm font-semibold ${
              isPositive ? 'text-brand-green' : 'text-brand-red'
            }`} data-testid="portfolio-index-change">
              {isPositive ? '+' : ''}{indexChange.toFixed(2)}% (30D)
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Portfolio Index</p>
            <p className="text-sm text-gray-300">
              Base: 1000 • Assets: {assets.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80" data-testid="portfolio-index-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              strokeOpacity={0.3}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={['dataMin - 10', 'dataMax + 10']}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={startIndexValue} 
              stroke="#6B7280" 
              strokeDasharray="2 2" 
              strokeOpacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="indexValue"
              stroke={isPositive ? "#10B981" : "#F43F5E"}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: isPositive ? "#10B981" : "#F43F5E",
                strokeWidth: 0
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-0.5 ${isPositive ? 'bg-brand-green' : 'bg-brand-red'}`}></div>
            <span>Portfolio Index</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-gray-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #6B7280 0, #6B7280 2px, transparent 2px, transparent 4px)' }}></div>
            <span>Baseline (1000)</span>
          </div>
        </div>
        <span>Last 30 days</span>
      </div>
    </div>
  );
}
