import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { portfolioApi } from "@/lib/api";
import PortfolioSummary from "@/components/portfolio-summary";
import AssetList from "@/components/asset-list";
import PortfolioSidebar from "@/components/portfolio-sidebar";
import AddAssetModal from "@/components/add-asset-modal";
import UserDropdown from "@/components/UserDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Bell, Settings, User, Search, Filter, X, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import type { AssetSearchResult } from "@shared/schema";

export default function Portfolio() {
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasTriedCreatingPortfolio, setHasTriedCreatingPortfolio] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { toast } = useToast();
  
  const { data: portfolios = [], isLoading: isLoadingPortfolios } = useQuery({
    queryKey: ["/api/portfolios"],
    queryFn: () => portfolioApi.getPortfolios(),
  });

  // Use the first portfolio from the user's portfolios, or guest-portfolio for guests
  const currentPortfolioId = portfolios.length > 0 ? portfolios[0].id : "guest-portfolio";
  
  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ["/api/portfolios", currentPortfolioId],
    queryFn: () => portfolioApi.getPortfolio(currentPortfolioId),
    enabled: !isLoadingPortfolios && !!currentPortfolioId,
  });

  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ["/api/portfolios", currentPortfolioId, "assets"],
    queryFn: () => portfolioApi.getAssets(currentPortfolioId),
    enabled: !!portfolio && !!currentPortfolioId,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/portfolios", currentPortfolioId, "analytics"],
    queryFn: () => portfolioApi.getAnalytics(currentPortfolioId),
    enabled: !!portfolio && !!currentPortfolioId,
  });

  // Create portfolio mutation
  const createPortfolioMutation = useMutation({
    mutationFn: () => portfolioApi.createPortfolio({
      name: "My Portfolio",
      description: "Primary investment portfolio",
    }),
    onSuccess: async () => {
      // Invalidate and refetch the portfolios query
      await queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      toast({
        title: "Portfolio Created",
        description: "Your default portfolio has been created.",
      });
    },
    onError: (error) => {
      console.error('Portfolio creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create default portfolio.",
        variant: "destructive",
      });
    },
  });

  // Search for new assets to add
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['/api/search-assets', searchQuery],
    queryFn: () => portfolioApi.searchAssets(searchQuery),
    enabled: searchQuery.trim().length > 0,
  });

  // Add asset mutation
  const addAssetMutation = useMutation({
    mutationFn: (assetData: { symbol: string; name: string; assetType: string; quantity: string }) =>
      portfolioApi.createAsset(currentPortfolioId, {
        symbol: assetData.symbol,
        name: assetData.name,
        assetType: assetData.assetType,
        quantity: assetData.quantity,
        purchasePrice: "0",
        currentPrice: "0",
        totalValue: "0",
        gainLoss: "0",
        gainLossPercent: "0",
        dailyChange: "0",
        dailyChangePercent: "0",
        metadata: null,
      }),
    onSuccess: async () => {
      // Invalidate queries in sequence to avoid race conditions
      await queryClient.invalidateQueries({ queryKey: ['/api/portfolios', currentPortfolioId, 'assets'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/portfolios', currentPortfolioId, 'analytics'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/portfolios', currentPortfolioId] });
      // Also invalidate the main portfolios list to refresh totals
      await queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      setSearchQuery("");
      setShowSearchResults(false);
      toast({
        title: "Asset Added",
        description: "Asset has been added to your portfolio.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add asset to portfolio.",
        variant: "destructive",
      });
    },
  });

  // Set document title
  useEffect(() => {
    document.title = "myDex";
  }, []);

  // Initialize default portfolio if none exists - using useEffect to prevent infinite loop
  useEffect(() => {
    if (!isLoadingPortfolios && portfolios.length === 0 && !hasTriedCreatingPortfolio && !createPortfolioMutation.isPending) {
      setHasTriedCreatingPortfolio(true);
      createPortfolioMutation.mutate();
    }
  }, [isLoadingPortfolios, portfolios.length, hasTriedCreatingPortfolio, createPortfolioMutation]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  // Handle adding asset from search results
  const handleAddAsset = (asset: AssetSearchResult, quantity: string = "1") => {
    addAssetMutation.mutate({
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.type,
      quantity,
    });
  };

  // Filter existing assets when not searching
  const filteredAssets = useMemo(() => {
    if (showSearchResults) return [];
    return assets.filter(asset =>
      searchQuery === "" ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery, showSearchResults]);

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
                <Button variant="ghost" size="sm" className="text-white bg-brand-green/20 font-medium">
                  Portfolio
                </Button>
                <Link to="/analysis">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white font-medium">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analysis
                  </Button>
                </Link>
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
        {/* Portfolio Summary */}
        <PortfolioSummary 
          portfolio={portfolio} 
          analytics={analytics}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <PortfolioSidebar 
              analytics={analytics}
              portfolioId={currentPortfolioId}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {showSearchResults ? 'Search Results' : 'Portfolio Holdings'}
              </h2>
              {!showSearchResults && (
                <Button
                  onClick={() => setIsAddAssetModalOpen(true)}
                  variant="ghost"
                  className="text-gray-400 hover:text-white font-medium"
                  data-testid="button-add-asset"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manual Add
                </Button>
              )}
            </div>
            
            <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
              <div className="p-4 border-b border-dark-border">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search and add assets..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="pl-10 pr-10 bg-dark-bg border-dark-border text-white placeholder-gray-400"
                      data-testid="input-search-assets"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearchResults(false);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-0 h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {!showSearchResults && (
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Filter className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {showSearchResults ? (
                <div className="p-4">
                  {isSearching ? (
                    <div className="text-center py-8 text-gray-400">
                      Searching assets...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((asset) => (
                        <div
                          key={asset.symbol}
                          className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {asset.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{asset.symbol}</div>
                              <div className="text-gray-400 text-sm">{asset.name}</div>
                            </div>
                            <div className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
                              {asset.type.toUpperCase()}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddAsset(asset)}
                            disabled={addAssetMutation.isPending}
                            className="bg-gradient-primary hover:bg-purple-600 text-white"
                            size="sm"
                            data-testid={`button-add-${asset.symbol.toLowerCase()}`}
                          >
                            {addAssetMutation.isPending ? "Adding..." : "Add"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No assets found. Try a different search term.
                    </div>
                  )}
                </div>
              ) : (
                <AssetList 
                  assets={filteredAssets} 
                  isLoading={isLoading}
                  portfolioId={currentPortfolioId}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        portfolioId={currentPortfolioId}
      />
    </div>
  );
}
