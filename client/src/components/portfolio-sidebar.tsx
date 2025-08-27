import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import AssetChart from "@/components/asset-chart";
import type { PortfolioAnalytics } from "@/types/portfolio";

interface PortfolioSidebarProps {
  analytics?: PortfolioAnalytics;
  portfolioId: string;
}

export default function PortfolioSidebar({ analytics, portfolioId }: PortfolioSidebarProps) {
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePricesMutation = useMutation({
    mutationFn: () => portfolioApi.updatePrices(portfolioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      toast({
        title: "Prices Updated",
        description: "All asset prices have been updated successfully.",
      });
      setIsUpdatingPrices(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update prices. Please try again.",
        variant: "destructive",
      });
      setIsUpdatingPrices(false);
    },
  });

  const handleUpdatePrices = () => {
    setIsUpdatingPrices(true);
    updatePricesMutation.mutate();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "crypto":
        return "bg-gradient-primary";
      case "stock":
        return "bg-gradient-secondary";
      case "commodity":
        return "bg-brand-peach";
      case "forex":
        return "bg-brand-purple";
      default:
        return "bg-gradient-primary";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "crypto":
        return "Cryptocurrency";
      case "stock":
        return "Stocks";
      case "commodity":
        return "Commodities";
      case "forex":
        return "Forex";
      default:
        return type;
    }
  };

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Card className="bg-dark-card border-dark-border">
          <CardHeader>
            <Skeleton className="h-5 w-32 bg-gray-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-4 h-4 rounded-full bg-gray-600" />
                  <Skeleton className="h-4 w-24 bg-gray-600" />
                </div>
                <Skeleton className="h-4 w-12 bg-gray-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Asset Allocation */}
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="asset-allocation">
            {Object.entries(analytics.allocation).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 ${getTypeColor(type)} rounded-full`}></div>
                  <span className="text-sm text-gray-300">{getTypeLabel(type)}</span>
                </div>
                <span className="text-sm font-semibold text-white" data-testid={`percentage-${type}`}>
                  {(data?.percentage || 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.bestPerformer && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Best Performer</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white" data-testid="text-best-performer">
                    {analytics.bestPerformer.symbol}
                  </p>
                  <p className="text-xs text-brand-green" data-testid="text-best-performer-change">
                    {parseFloat(analytics.bestPerformer.change || '0') >= 0 ? "+" : ""}{parseFloat(analytics.bestPerformer.change || '0').toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
            
            {analytics.worstPerformer && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Worst Performer</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white" data-testid="text-worst-performer">
                    {analytics.worstPerformer.symbol}
                  </p>
                  <p className="text-xs text-brand-red" data-testid="text-worst-performer-change">
                    {parseFloat(analytics.worstPerformer.change || '0') >= 0 ? "+" : ""}{parseFloat(analytics.worstPerformer.change || '0').toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Last Updated</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-white" data-testid="text-last-updated">
                  {new Date(analytics.lastUpdated).toLocaleString()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpdatePrices}
                  disabled={isUpdatingPrices}
                  className="text-xs text-brand-green hover:text-green-300 hover:bg-green-500/10 p-0 h-auto"
                  data-testid="button-update-prices"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isUpdatingPrices ? "animate-spin" : ""}`} />
                  Update Prices
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Market Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-brand-green">Live</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Performance Chart */}
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">30-Day Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetChart portfolioId={portfolioId} />
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400">7D</p>
              <p className="text-sm font-semibold text-brand-green">+2.1%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">30D</p>
              <p className="text-sm font-semibold text-brand-green">+8.7%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">YTD</p>
              <p className="text-sm font-semibold text-brand-green">+21.3%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
