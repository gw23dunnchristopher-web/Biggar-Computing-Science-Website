import React, { Component } from "react";
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

interface EBState { error: Error | null; info: string }
class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { error: null, info: '' };
  static getDerivedStateFromError(error: Error): Partial<EBState> {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info: info.componentStack ?? '' });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff3f3', minHeight: '100vh' }}>
          <h2 style={{ color: '#c42b1c', marginBottom: 8 }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#333', fontSize: 13 }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#666', fontSize: 11, marginTop: 12 }}>
            {this.state.info}
          </pre>
          <button
            onClick={() => { this.setState({ error: null, info: '' }); }}
            style={{ marginTop: 16, padding: '6px 16px', background: '#c42b1c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
