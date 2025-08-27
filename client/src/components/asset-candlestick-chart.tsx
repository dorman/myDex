import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset } from "@shared/schema";

interface AssetCandlestickChartProps {
  asset: Asset;
  portfolioId: string;
  isLoading: boolean;
}

interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface CandlestickBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: CandlestickData;
}

// Custom Candlestick component
const Candlestick = ({ x, y, width, height, payload }: CandlestickBarProps) => {
  const { open, high, low, close } = payload;
  const isPositive = close >= open;
  
  // Calculate positions
  const candleWidth = Math.max(width * 0.6, 1);
  const candleX = x + (width - candleWidth) / 2;
  
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyHeight = Math.abs(close - open);
  
  // Scale factors (this would normally come from the chart's scale)
  const maxValue = Math.max(high, open, close);
  const minValue = Math.min(low, open, close);
  const valueRange = maxValue - minValue;
  
  if (valueRange === 0) return null;
  
  const scaleY = (value: number) => y + height - ((value - minValue) / valueRange) * height;
  
  return (
    <g>
      {/* High-low line (wick) */}
      <line
        x1={x + width / 2}
        y1={scaleY(high)}
        x2={x + width / 2}
        y2={scaleY(low)}
        stroke={isPositive ? "#10B981" : "#F43F5E"}
        strokeWidth={1}
      />
      
      {/* Candle body */}
      <rect
        x={candleX}
        y={scaleY(bodyBottom)}
        width={candleWidth}
        height={bodyHeight === 0 ? 1 : ((bodyBottom - bodyTop) / valueRange) * height}
        fill={isPositive ? "#10B981" : "#F43F5E"}
        stroke={isPositive ? "#10B981" : "#F43F5E"}
        strokeWidth={1}
        opacity={isPositive ? 0.8 : 1}
      />
    </g>
  );
};

export default function AssetCandlestickChart({ asset, isLoading }: AssetCandlestickChartProps) {
  // Generate mock OHLCV data for the selected asset
  // In a real implementation, this would come from the API
  const candlestickData = useMemo(() => {
    if (!asset) return [];
    
    const currentPrice = parseFloat(asset.currentPrice || '0');
    if (currentPrice === 0) return [];
    
    // Generate 30 days of mock OHLCV data
    const data: CandlestickData[] = [];
    const today = new Date();
    let previousClose = currentPrice * 0.95; // Start slightly lower
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic OHLCV data
      const volatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
      const trend = parseFloat(asset.dailyChangePercent || '0') / 100 / 30; // Distribute daily change over 30 days
      const randomWalk = (Math.random() - 0.5) * volatility;
      
      // Calculate open (previous day's close with some gap)
      const gapSize = (Math.random() - 0.5) * 0.005; // Small overnight gap
      const open = previousClose * (1 + gapSize);
      
      // Calculate close based on trend and random walk
      const close = open * (1 + trend + randomWalk);
      
      // Calculate high and low
      const intraday_volatility = volatility * 0.5;
      const high = Math.max(open, close) * (1 + Math.random() * intraday_volatility);
      const low = Math.min(open, close) * (1 - Math.random() * intraday_volatility);
      
      // Generate volume (higher volume on bigger price movements)
      const priceMovement = Math.abs((close - open) / open);
      const baseVolume = 1000000 + Math.random() * 2000000; // 1-3M base volume
      const volume = baseVolume * (1 + priceMovement * 5); // Higher volume on bigger moves
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close),
        volume: Math.floor(volume),
        timestamp: date.getTime(),
      });
      
      previousClose = close;
    }
    
    return data;
  }, [asset]);

  const priceRange = useMemo(() => {
    if (candlestickData.length === 0) return { min: 0, max: 0 };
    
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    
    candlestickData.forEach(item => {
      min = Math.min(min, item.low);
      max = Math.max(max, item.high);
    });
    
    // Add 2% padding
    const padding = (max - min) * 0.02;
    return {
      min: min - padding,
      max: max + padding
    };
  }, [candlestickData]);

  const volumeMax = useMemo(() => {
    if (candlestickData.length === 0) return 0;
    return Math.max(...candlestickData.map(d => d.volume));
  }, [candlestickData]);

  if (isLoading) {
    return (
      <div className="h-[600px] w-full">
        <div className="mb-6">
          <Skeleton className="h-6 w-40 bg-gray-600 mb-2" />
          <Skeleton className="h-4 w-32 bg-gray-600" />
        </div>
        <Skeleton className="h-96 w-full bg-gray-600 mb-4" />
        <Skeleton className="h-32 w-full bg-gray-600" />
      </div>
    );
  }

  if (!asset || candlestickData.length === 0) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Chart Data</h3>
          <p className="text-sm text-gray-400">
            Chart data is not available for this asset.
          </p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CandlestickData;
      const priceChange = data.close - data.open;
      const priceChangePercent = ((data.close - data.open) / data.open) * 100;
      const isPositive = priceChange >= 0;
      
      return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg min-w-48">
          <p className="text-white font-semibold mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Open:</span>
              <span className="text-white font-semibold">${data.open.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">High:</span>
              <span className="text-white font-semibold">${data.high.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Low:</span>
              <span className="text-white font-semibold">${data.low.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Close:</span>
              <span className="text-white font-semibold">${data.close.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Volume:</span>
              <span className="text-white font-semibold">{data.volume.toLocaleString()}</span>
            </div>
            <div className="border-t border-dark-border pt-1 mt-1">
              <div className="flex justify-between">
                <span className="text-gray-300">Change:</span>
                <span className={`font-semibold ${
                  isPositive ? 'text-brand-green' : 'text-brand-red'
                }`}>
                  {isPositive ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">30-Day Price Chart</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-300">
                H: <span className="text-white font-semibold">${Math.max(...candlestickData.map(d => d.high)).toFixed(2)}</span>
              </span>
              <span className="text-gray-300">
                L: <span className="text-white font-semibold">${Math.min(...candlestickData.map(d => d.low)).toFixed(2)}</span>
              </span>
              <span className="text-gray-300">
                Avg Vol: <span className="text-white font-semibold">{(candlestickData.reduce((sum, d) => sum + d.volume, 0) / candlestickData.length).toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="h-96 mb-6" data-testid="candlestick-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={candlestickData}
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
              yAxisId="price"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={[priceRange.min, priceRange.max]}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Custom Candlesticks */}
            {candlestickData.map((entry, index) => {
              const isPositive = entry.close >= entry.open;
              const candleWidth = 8;
              const wickWidth = 1;
              
              // Calculate pixel positions based on chart domain
              const chartWidth = 100 / candlestickData.length; // Approximate percentage per candle
              const xPosition = (index + 0.5) * chartWidth;
              
              return (
                <g key={`candle-${index}`}>
                  {/* High-Low wick line */}
                  <line
                    x1={`${xPosition}%`}
                    y1={`${((priceRange.max - entry.high) / (priceRange.max - priceRange.min)) * 100}%`}
                    x2={`${xPosition}%`}
                    y2={`${((priceRange.max - entry.low) / (priceRange.max - priceRange.min)) * 100}%`}
                    stroke={isPositive ? "#10B981" : "#F43F5E"}
                    strokeWidth={wickWidth}
                  />
                  
                  {/* Open-Close candle body */}
                  <rect
                    x={`${xPosition - candleWidth/2}%`}
                    y={`${((priceRange.max - Math.max(entry.open, entry.close)) / (priceRange.max - priceRange.min)) * 100}%`}
                    width={candleWidth}
                    height={`${(Math.abs(entry.close - entry.open) / (priceRange.max - priceRange.min)) * 100}%`}
                    fill={isPositive ? "#10B981" : "#F43F5E"}
                    stroke={isPositive ? "#10B981" : "#F43F5E"}
                    strokeWidth={1}
                    opacity={isPositive ? 0.8 : 1}
                  />
                </g>
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="h-32" data-testid="volume-chart">
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-300">Volume</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={candlestickData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
            />
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              domain={[0, volumeMax]}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Bar 
              dataKey="volume" 
              fill="#6B7280"
              opacity={0.6}
              radius={[1, 1, 0, 0]}
            >
              {candlestickData.map((entry, index) => (
                <Cell 
                  key={`volume-cell-${index}`} 
                  fill={entry.close >= entry.open ? "#10B981" : "#F43F5E"}
                  opacity={0.4}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-brand-green opacity-80"></div>
            <span>Bullish (Close {'>'} Open)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-brand-red"></div>
            <span>Bearish (Close {'<'} Open)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-2 bg-gray-500 opacity-60"></div>
            <span>Volume</span>
          </div>
        </div>
        <span>Last 30 days</span>
      </div>
    </div>
  );
}
