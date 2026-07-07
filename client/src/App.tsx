import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Books from "@/pages/books";
import SavedBooks from "@/pages/saved-books";
import PrivacyPolicy from "@/pages/privacy-policy";
import Navbar from "@/components/layout/Navbar";
import { DeviceProvider } from "./contexts/DeviceContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { syncDeviceIdCookie } from "./lib/deviceId";
import AdminPage from "@/pages/admin";
import Debug from "@/pages/debug";
import Settings from "@/pages/settings";
import HistoryPage from "@/pages/history";


function Router() {
  return (
    <WouterRouter>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/books" component={Books} />
        <Route path="/reading-list" component={SavedBooks} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/debug" component={Debug} />
        <Route path="/settings" component={Settings} />
        <Route path="/history" component={HistoryPage} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Initialize device ID on app load
  useEffect(() => {
    // Ensure device ID is set and synced with cookies
    syncDeviceIdCookie();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <ThemeProvider>
          <TooltipProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Navbar 
                sidebarOpen={sidebarOpen} 
                toggleSidebar={toggleSidebar}
              />
              <div className="flex flex-1">
                {/* Overlay when sidebar is open (all devices) */}
                {sidebarOpen && (
                  <div 
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black bg-opacity-50 z-10"
                  />
                )}
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                  <Router />
                </main>
              </div>
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </DeviceProvider>
    </QueryClientProvider>
  );
}

export default App;
