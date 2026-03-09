import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Team from "./pages/Team";
import Timesheets from "./pages/Timesheets";
import Leave from "./pages/Leave";
import Risks from "./pages/Risks";
import Updates from "./pages/Updates";

import NotFound from "./pages/NotFound";
import Describe from "./pages/Describe";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/forecasting" element={<Forecasting />} />
            <Route path="/team" element={<Team />} />
            <Route path="/timesheets" element={<Timesheets />} />
            <Route path="/leave" element={<Leave />} />
            <Route path="/risks" element={<Risks />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/describe" element={<Describe />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
