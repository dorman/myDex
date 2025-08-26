import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { portfolioApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";

const addAssetSchema = z.object({
  symbol: z.string().min(1, "Asset symbol is required"),
  name: z.string().min(1, "Asset name is required"),
  assetType: z.enum(["crypto", "stock", "commodity", "forex", "etf"], {
    required_error: "Please select an asset type",
  }),
  quantity: z.string().min(1, "Quantity is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Quantity must be a positive number"
  ),
});

type AddAssetForm = z.infer<typeof addAssetSchema>;

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
}

export default function AddAssetModal({ isOpen, onClose, portfolioId }: AddAssetModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<AddAssetForm>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      symbol: "",
      name: "",
      assetType: undefined,
      quantity: "",
    },
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/search-assets", searchQuery],
    queryFn: () => portfolioApi.searchAssets(searchQuery, form.watch("assetType")),
    enabled: searchQuery.length > 2,
  });

  const createAssetMutation = useMutation({
    mutationFn: (data: Omit<AddAssetForm, "assetType"> & { assetType: string }) =>
      portfolioApi.createAsset(portfolioId, {
        symbol: data.symbol,
        name: data.name,
        assetType: data.assetType,
        quantity: data.quantity,
        purchasePrice: "0",
        currentPrice: "0",
        totalValue: "0",
        gainLoss: "0",
        gainLossPercent: "0",
        dailyChange: "0",
        dailyChangePercent: "0",
        metadata: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId] });
      toast({
        title: "Asset Added",
        description: "The asset has been added to your portfolio successfully.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddAssetForm) => {
    createAssetMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setSearchQuery("");
    onClose();
  };

  const handleAssetSelect = (asset: any) => {
    form.setValue("symbol", asset.symbol);
    form.setValue("name", asset.name);
    form.setValue("assetType", asset.type);
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-dark-card border-dark-border text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Asset</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Asset Search */}
            <FormItem>
              <FormLabel className="text-gray-300">Search Asset</FormLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Enter symbol or name (e.g., BTC, AAPL, Gold)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-dark-bg border-dark-border text-white placeholder-gray-400"
                  data-testid="input-asset-search"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-dark-bg border border-dark-border rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map((asset) => (
                    <button
                      key={`${asset.symbol}-${asset.type}`}
                      type="button"
                      onClick={() => handleAssetSelect(asset)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 flex items-center justify-between transition-colors"
                      data-testid={`button-select-${asset.symbol}`}
                    >
                      <div>
                        <p className="font-medium text-white">{asset.name}</p>
                        <p className="text-sm text-gray-400">{asset.symbol} • {asset.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </FormItem>

            {/* Asset Type */}
            <FormField
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Asset Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-bg border-dark-border text-white" data-testid="select-asset-type">
                        <SelectValue placeholder="Select asset type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-bg border-dark-border">
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Symbol and Name */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Symbol</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., BTC"
                        {...field}
                        className="bg-dark-bg border-dark-border text-white placeholder-gray-400"
                        data-testid="input-symbol"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Bitcoin"
                        {...field}
                        className="bg-dark-bg border-dark-border text-white placeholder-gray-400"
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder="0.00"
                      {...field}
                      className="bg-dark-bg border-dark-border text-white placeholder-gray-400"
                      data-testid="input-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAssetMutation.isPending}
                className="bg-brand-green hover:bg-green-600 text-white"
                data-testid="button-add-asset"
              >
                {createAssetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Asset
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
