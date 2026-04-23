import { Switch, Route, Router, Redirect } from 'wouter';
import { lazy, Suspense, useEffect, useState } from 'react';
import { getCurrentRole } from '@/lib/api';

const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Course = lazy(() => import('@/pages/Course'));
const Lesson = lazy(() => import('@/pages/Lesson'));
const Analytics = lazy(() => import('@/pages/Analytics'));

function Loading() {
  return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>;
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
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={() => <Gate><Home /></Gate>} />
          <Route path="/course/:course" component={() => <Gate><Course /></Gate>} />
          <Route path="/lesson/:id" component={() => <Gate><Lesson /></Gate>} />
          <Route path="/analytics/:course" component={() => <Gate><Analytics /></Gate>} />
          <Route>{() => <Redirect to="/" />}</Route>
        </Switch>
      </Suspense>
    </Router>
  );
}
