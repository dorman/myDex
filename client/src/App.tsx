import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Portfolio from "@/pages/portfolio";
import AssetAnalysis from "@/pages/asset-analysis";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/" component={Portfolio} />
        <Route path="/portfolio/:id?" component={Portfolio} />
        <Route path="/analysis" component={AssetAnalysis} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
