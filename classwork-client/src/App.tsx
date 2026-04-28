import { Switch, Route, Router, Redirect } from 'wouter';
import { Component, lazy, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { getCurrentRole } from '@/lib/api';

const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Course = lazy(() => import('@/pages/Course'));
const Lesson = lazy(() => import('@/pages/Lesson'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Students = lazy(() => import('@/pages/Students'));
const Jotter = lazy(() => import('@/pages/Jotter'));

function Loading() {
  return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>;
}

/**
 * Catches render-time exceptions (and lazy-chunk load failures) so a thrown
 * error shows a readable message instead of leaving the whole tab blank.
 * Without this, any uncaught render error in a route component unmounts the
 * entire React tree and the user sees an empty white screen with no clue what
 * happened. The "Reload" button forces a fresh fetch which also clears any
 * stale chunks the browser may have cached from a previous deploy.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Classwork] Render error caught by boundary:', error, info);
  }
  render() {
    if (this.state.error) {
      const msg = this.state.error.message || String(this.state.error);
      const isChunkError = /Loading chunk|Failed to fetch dynamically imported module|importing a module script failed/i.test(msg);
      return (
        <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
          <h1 style={{ fontSize: 22, marginTop: 0 }}>Something went wrong loading this page</h1>
          <p style={{ color: '#475569', lineHeight: 1.5 }}>
            {isChunkError
              ? 'This page tried to load some files that are no longer available — usually because a new version of the site was just deployed and your browser still has the old version cached. Reloading should fix it.'
              : 'A problem stopped the page from rendering. The details below may help your teacher report this.'}
          </p>
          <pre style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => { window.location.reload(); }}
              style={{ padding: '8px 14px', borderRadius: 8, background: '#0c2d8a', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >Reload page</button>
            <button
              onClick={() => { window.location.href = '/classwork/'; }}
              style={{ padding: '8px 14px', borderRadius: 8, background: '#fff', color: '#0c2d8a', border: '1px solid #0c2d8a', fontWeight: 600, cursor: 'pointer' }}
            >Back to dashboard</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Gate({ children }: { children: React.ReactNode }) {
  // Re-render when login state changes in another tab.
  const [, setTick] = useState(0);
  useEffect(() => {
    const onStorage = () => setTick((t) => t + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const role = getCurrentRole();
  if (role === 'guest') return <Redirect to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router base="/classwork">
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={() => <Gate><Home /></Gate>} />
          <Route path="/course/:course" component={() => <Gate><Course /></Gate>} />
          <Route path="/lesson/:id" component={() => <Gate><Lesson /></Gate>} />
          <Route path="/analytics/:course" component={() => <Gate><Analytics /></Gate>} />
          <Route path="/students" component={() => <Gate><Students /></Gate>} />
          <Route path="/jotter" component={() => <Gate><Jotter /></Gate>} />
          <Route path="/jotter/:studentId" component={() => <Gate><Jotter /></Gate>} />
          <Route>{() => <Redirect to="/" />}</Route>
          </Switch>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}
