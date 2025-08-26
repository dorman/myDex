import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/lib/api";
import PortfolioSummary from "@/components/portfolio-summary";
import AssetList from "@/components/asset-list";
import PortfolioSidebar from "@/components/portfolio-sidebar";
import AddAssetModal from "@/components/add-asset-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Bell, Settings, User, Search, Filter } from "lucide-react";

export default function Portfolio() {
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasTriedCreatingPortfolio, setHasTriedCreatingPortfolio] = useState(false);
  const { toast } = useToast();
  
  // For this demo, we'll use a default portfolio ID
  // In a real app, this would come from routing or user selection
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

  const { data: analytics } = useQuery({
    queryKey: ["/api/portfolios", defaultPortfolioId, "analytics"],
    queryFn: () => portfolioApi.getAnalytics(defaultPortfolioId),
    enabled: !!portfolio,
  });

  // Create default portfolio if none exists
  const createDefaultPortfolio = async () => {
    try {
      await portfolioApi.createPortfolio({
        name: "My Portfolio",
        description: "Primary investment portfolio",
      });
      toast({
        title: "Portfolio Created",
        description: "Your default portfolio has been created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create default portfolio.",
        variant: "destructive",
      });
    }
  };

  // Initialize default portfolio if none exists - using useEffect to prevent infinite loop
  useEffect(() => {
    if (!isLoadingPortfolios && portfolios.length === 0 && !hasTriedCreatingPortfolio) {
      setHasTriedCreatingPortfolio(true);
      createDefaultPortfolio();
    }
  }, [isLoadingPortfolios, portfolios.length, hasTriedCreatingPortfolio]);

  const filteredAssets = assets.filter(asset =>
    searchQuery === "" ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isLoadingPortfolios || isLoadingPortfolio || isLoadingAssets;

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans">
      {/* Navigation */}
      <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-brand-green to-blue-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
                <h1 className="text-xl font-bold text-white">InvestTrack Pro</h1>
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
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Portfolio Holdings</h2>
              <Button
                onClick={() => setIsAddAssetModalOpen(true)}
                className="bg-brand-green hover:bg-green-600 text-white font-medium"
                data-testid="button-add-asset"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </div>
            
            <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
              <div className="p-4 border-b border-dark-border">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-dark-bg border-dark-border text-white placeholder-gray-400"
                      data-testid="input-search-assets"
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <AssetList 
                assets={filteredAssets} 
                isLoading={isLoading}
                portfolioId={defaultPortfolioId}
              />
            </div>
          </div>

          {/* Sidebar */}
          <PortfolioSidebar 
            analytics={analytics}
            portfolioId={defaultPortfolioId}
          />
        </div>
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        portfolioId={defaultPortfolioId}
      />
    </div>
  );
}
