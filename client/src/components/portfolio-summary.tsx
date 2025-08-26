import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Wallet, BarChart3 } from "lucide-react";
import type { Portfolio } from "@shared/schema";
import type { PortfolioAnalytics } from "@/types/portfolio";

interface PortfolioSummaryProps {
  portfolio?: Portfolio;
  analytics?: PortfolioAnalytics;
  isLoading: boolean;
}

export default function PortfolioSummary({ portfolio, analytics, isLoading }: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-32 bg-gray-600" />
                <Skeleton className="h-8 w-8 rounded-lg bg-gray-600" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-8 w-40 bg-gray-600" />
                <Skeleton className="h-4 w-24 bg-gray-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalValue = parseFloat(portfolio?.totalValue || "0");
  const dailyChange = parseFloat(portfolio?.dailyChange || "0");
  const dailyChangePercent = parseFloat(portfolio?.dailyChangePercent || "0");
  const totalGainLoss = parseFloat(portfolio?.totalGainLoss || "0");
  const totalGainLossPercent = parseFloat(portfolio?.totalGainLossPercent || "0");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Portfolio Value */}
      <Card className="bg-dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Total Portfolio Value</h3>
            <div className="w-8 h-8 bg-gradient-primary bg-opacity-20 rounded-lg flex items-center justify-center">
              <Wallet className="text-brand-purple h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white" data-testid="text-total-value">
              {formatCurrency(totalValue)}
            </p>
            <p className={`text-sm font-medium flex items-center ${
              dailyChange >= 0 ? "text-brand-purple" : "text-brand-red"
            }`}>
              <TrendingUp className={`text-xs mr-1 h-3 w-3 ${
                dailyChange < 0 ? "rotate-180" : ""
              }`} />
              <span data-testid="text-daily-change">
                {dailyChange >= 0 ? "+" : ""}{formatCurrency(dailyChange)} ({formatPercent(dailyChangePercent)})
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Gain/Loss */}
      <Card className="bg-dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Total Gain/Loss</h3>
            <div className="w-8 h-8 bg-gradient-secondary bg-opacity-20 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-brand-peach h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-3xl font-bold ${
              totalGainLoss >= 0 ? "text-brand-purple" : "text-brand-red"
            }`} data-testid="text-total-gain-loss">
              {totalGainLoss >= 0 ? "+" : ""}{formatCurrency(totalGainLoss)}
            </p>
            <p className="text-sm font-medium text-gray-400">
              <span data-testid="text-total-gain-loss-percent">
                {formatPercent(totalGainLossPercent)} all time
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assets Count */}
      <Card className="bg-dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Assets Count</h3>
            <div className="w-8 h-8 bg-gradient-primary bg-opacity-20 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-gradient h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white" data-testid="text-asset-count">
              {analytics?.totalAssets || 0}
            </p>
            <p className="text-sm font-medium text-gray-400">
              Across {Object.keys(analytics?.allocation || {}).length || 0} asset classes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
