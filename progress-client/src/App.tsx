import { Switch, Route, Redirect } from "wouter";
import { api } from "./api";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClassPage from "./pages/ClassPage";
import StudentPage from "./pages/StudentPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!api.isLoggedIn()) return <Redirect to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/class/:classId">
        <ProtectedRoute><ClassPage /></ProtectedRoute>
      </Route>
      <Route path="/student/:studentId">
        <ProtectedRoute><StudentPage /></ProtectedRoute>
      </Route>
      <Route><Redirect to="/" /></Route>
    </Switch>
  );
}
