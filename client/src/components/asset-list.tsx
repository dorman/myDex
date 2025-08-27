import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Trash2, BarChart3 } from "lucide-react";
import type { Asset } from "@shared/schema";

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
  portfolioId: string;
}

const getAssetIcon = (assetType: string, symbol: string) => {
  switch (assetType) {
    case "crypto":
      if (symbol === "BTC") return "₿";
      if (symbol === "ETH") return "Ξ";
      return "₿";
    case "stock":
      return symbol.slice(0, 2);
    case "commodity":
      return "🏆";
    case "forex":
      return "$";
    default:
      return "📈";
  }
};

const getAssetIconColor = (assetType: string) => {
  switch (assetType) {
    case "crypto":
      return "bg-orange-500";
    case "stock":
      return "bg-blue-500";
    case "commodity":
      return "bg-yellow-500";
    case "forex":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

export default function AssetList({ assets, isLoading, portfolioId }: AssetListProps) {
  const [deletingAsset, setDeletingAsset] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteAssetMutation = useMutation({
    mutationFn: portfolioApi.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId] });
      toast({
        title: "Asset Deleted",
        description: "The asset has been removed from your portfolio.",
      });
      setDeletingAsset(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the asset. Please try again.",
        variant: "destructive",
      });
      setDeletingAsset(null);
    },
  });

  const handleDeleteAsset = (assetId: string) => {
    setDeletingAsset(assetId);
    deleteAssetMutation.mutate(assetId);
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  const formatPercent = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return `${numValue >= 0 ? "+" : ""}${numValue.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-dark-card border-dark-border rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-full bg-gray-600" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16 bg-gray-600" />
                  <Skeleton className="h-3 w-12 bg-gray-600" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 bg-gray-600 rounded" />
            </div>
            <div className="space-y-3">
              <div>
                <Skeleton className="h-3 w-12 bg-gray-600 mb-1" />
                <Skeleton className="h-4 w-20 bg-gray-600" />
              </div>
              <div>
                <Skeleton className="h-3 w-8 bg-gray-600 mb-1" />
                <Skeleton className="h-4 w-16 bg-gray-600" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 bg-gray-600 mb-1" />
                <Skeleton className="h-4 w-14 bg-gray-600" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-300">No assets found</h3>
          <p className="text-sm text-gray-400">
            Add your first asset to start tracking your portfolio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
      {assets.map((asset) => {
        const dailyChangePercent = parseFloat(asset.dailyChangePercent || '0');
        const dailyChange = parseFloat(asset.dailyChange || '0');
        const isPositive = dailyChangePercent >= 0;
        
        return (
          <div
            key={asset.id}
            className="bg-dark-card border-dark-border rounded-xl p-6 border hover:border-gray-500 transition-all duration-200 hover:shadow-lg group"
            data-testid={`card-asset-${asset.symbol}`}
          >
            {/* Header with Asset Info and Delete Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${getAssetIconColor(asset.assetType)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                  {getAssetIcon(asset.assetType, asset.symbol)}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm" data-testid={`text-asset-name-${asset.symbol}`}>
                    {asset.name}
                  </p>
                  <p className="text-xs text-gray-400" data-testid={`text-asset-symbol-${asset.symbol}`}>
                    {asset.symbol} • {asset.assetType.toUpperCase()}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAsset(asset.id);
                }}
                disabled={deletingAsset === asset.id}
                data-testid={`button-delete-${asset.symbol}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Asset Details */}
            <div className="space-y-3">
              {/* Holdings */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Holdings</p>
                <p className="font-semibold text-white" data-testid={`text-asset-quantity-${asset.symbol}`}>
                  {parseFloat(asset.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  <span className="text-sm text-gray-400 ml-1">
                    {asset.assetType === "stock" ? "shares" : asset.symbol}
                  </span>
                </p>
              </div>

              {/* Current Price */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Price</p>
                <p className="font-semibold text-white" data-testid={`text-asset-price-${asset.symbol}`}>
                  {formatCurrency(asset.currentPrice || '0')}
                </p>
              </div>

              {/* 24h Change */}
              <div>
                <p className="text-xs text-gray-400 mb-1">24h Change</p>
                <div className={`flex items-center ${
                  isPositive ? "text-brand-green" : "text-brand-red"
                }`} data-testid={`text-asset-change-${asset.symbol}`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  <span className="font-semibold text-sm">
                    {formatPercent(dailyChangePercent)}
                  </span>
                  <span className="text-xs ml-2">
                    ({dailyChange >= 0 ? "+" : ""}{formatCurrency(dailyChange)})
                  </span>
                </div>
              </div>

              {/* Total Value */}
              <div className="border-t border-dark-border pt-3">
                <p className="text-xs text-gray-400 mb-1">Total Value</p>
                <p className="font-bold text-white text-lg" data-testid={`text-asset-value-${asset.symbol}`}>
                  {formatCurrency(asset.totalValue || '0')}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
