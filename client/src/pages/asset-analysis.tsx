import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Settings, TrendingUp, BarChart3, Wallet } from "lucide-react";
import { Link } from "wouter";
import UserDropdown from "@/components/UserDropdown";
import PortfolioIndexChart from "@/components/portfolio-index-chart";
import AssetCandlestickChart from "@/components/asset-candlestick-chart";
import type { Asset } from "@shared/schema";

export default function AssetAnalysis() {
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const { toast } = useToast();
  
  // For this demo, we'll use a default portfolio ID
  const defaultPortfolioId = "default-portfolio";
  
  const { data: portfolios = [], isLoading: isLoadingPortfolios } = useQuery({
    queryKey: ["/api/portfolios"],
    queryFn: () => portfolioApi.getPortfolios(),
  });

  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ["/api/portfolios", defaultPortfolioId],
    queryFn: () => portfolioApi.getPortfolio(defaultPortfolioId),
    enabled: portfolios.length > 0 || !isLoadingPortfolios,
  });

  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ["/api/portfolios", defaultPortfolioId, "assets"],
    queryFn: () => portfolioApi.getAssets(defaultPortfolioId),
    enabled: !!portfolio,
  });

  // Set document title
  useEffect(() => {
    document.title = "Asset Analysis - myDex";
  }, []);

  // Set default selected asset when assets load
  useEffect(() => {
    if (assets.length > 0 && !selectedAsset) {
      setSelectedAsset(assets[0].symbol);
    }
  }, [assets, selectedAsset]);

  const selectedAssetData = useMemo(() => {
    return assets.find(asset => asset.symbol === selectedAsset);
  }, [assets, selectedAsset]);

  const isLoading = isLoadingPortfolios || isLoadingPortfolio || isLoadingAssets;

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans">
      {/* Navigation */}
      <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
                <h1 className="text-xl font-bold text-gradient">myDex</h1>
              </div>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-1">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white font-medium">
                    <Wallet className="h-4 w-4 mr-2" />
                    Portfolio
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-white bg-brand-green/20 font-medium">
                  Analysis
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-2"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-2"
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <UserDropdown />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Asset Analysis</h1>
          <p className="text-gray-400">
            Analyze your portfolio performance and individual asset charts
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="index" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-dark-card border-dark-border">
            <TabsTrigger 
              value="index" 
              className="flex items-center space-x-2 data-[state=active]:bg-brand-green data-[state=active]:text-white"
              data-testid="tab-index-view"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Portfolio Index</span>
            </TabsTrigger>
            <TabsTrigger 
              value="individual" 
              className="flex items-center space-x-2 data-[state=active]:bg-brand-green data-[state=active]:text-white"
              data-testid="tab-individual-view"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Individual Assets</span>
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Index Tab */}
          <TabsContent value="index" className="mt-6">
            <div className="grid gap-6">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-brand-green" />
                    Portfolio Performance Index
                  </CardTitle>
                  <p className="text-sm text-gray-400">
                    Combined performance of all assets weighted by portfolio value
                  </p>
                </CardHeader>
                <CardContent>
                  <PortfolioIndexChart 
                    portfolioId={defaultPortfolioId}
                    assets={assets}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>

              {/* Portfolio Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Assets</p>
                        <p className="text-2xl font-bold text-white" data-testid="text-total-assets">
                          {assets.length}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Best Performer</p>
                        {assets.length > 0 && (
                          <>
                            <p className="text-lg font-bold text-white">
                              {assets.reduce((best, asset) => 
                                parseFloat(asset.dailyChangePercent || '0') > parseFloat(best.dailyChangePercent || '0') 
                                  ? asset : best
                              ).symbol}
                            </p>
                            <p className="text-sm text-brand-green">
                              +{parseFloat(assets.reduce((best, asset) => 
                                parseFloat(asset.dailyChangePercent || '0') > parseFloat(best.dailyChangePercent || '0') 
                                  ? asset : best
                              ).dailyChangePercent || '0').toFixed(2)}%
                            </p>
                          </>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Asset Classes</p>
                        <p className="text-2xl font-bold text-white">
                          {new Set(assets.map(asset => asset.assetType)).size}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Individual Assets Tab */}
          <TabsContent value="individual" className="mt-6">
            <div className="grid gap-6">
              {/* Asset Selector */}
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Select Asset</h3>
                      <p className="text-sm text-gray-400">
                        Choose an asset to view its detailed candlestick chart and volume data
                      </p>
                    </div>
                    <div className="w-64">
                      <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                        <SelectTrigger className="bg-dark-bg border-dark-border text-white" data-testid="select-asset">
                          <SelectValue placeholder="Select an asset..." />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          {assets.map((asset) => (
                            <SelectItem 
                              key={asset.id} 
                              value={asset.symbol}
                              className="text-white hover:bg-slate-700"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{asset.symbol}</span>
                                <span className="text-gray-400">• {asset.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Chart */}
              {selectedAssetData && (
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-white flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-brand-green" />
                      {selectedAssetData.name} ({selectedAssetData.symbol})
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-400">
                        Current Price: 
                        <span className="text-white font-semibold ml-1">
                          ${parseFloat(selectedAssetData.currentPrice || '0').toLocaleString()}
                        </span>
                      </span>
                      <span className={`flex items-center ${
                        parseFloat(selectedAssetData.dailyChangePercent || '0') >= 0 
                          ? 'text-brand-green' 
                          : 'text-brand-red'
                      }`}>
                        24h Change: 
                        <span className="font-semibold ml-1">
                          {parseFloat(selectedAssetData.dailyChangePercent || '0') >= 0 ? '+' : ''}
                          {parseFloat(selectedAssetData.dailyChangePercent || '0').toFixed(2)}%
                        </span>
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AssetCandlestickChart 
                      asset={selectedAssetData}
                      portfolioId={defaultPortfolioId}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>
              )}

              {/* No assets state */}
              {assets.length === 0 && !isLoading && (
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No assets available</h3>
                    <p className="text-sm text-gray-400">
                      Add assets to your portfolio to view their individual charts and analysis.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
