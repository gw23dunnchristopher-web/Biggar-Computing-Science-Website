import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/Home";
import { EmbedView } from "@/pages/EmbedView";
import { DatabaseView } from "@/pages/DatabaseView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function Router() {
  const searchParams = new URLSearchParams(window.location.search);
  const embedToken = searchParams.get("embed");
  const embedMode = searchParams.get("mode") as 'sql' | null;

  if (embedToken) {
    return <EmbedView token={embedToken} initialMode={embedMode === 'sql' ? 'sql' : undefined} />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/databases/:id/*?" component={DatabaseView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
