import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './lib/auth.jsx';
import { Button, EmptyState } from './components/ui/index.jsx';

// Everything past the dashboard is split out — the shell and today's list paint
// first, the rest arrives while the user is reading it.
const Appointments = lazy(() => import('./pages/Appointments.jsx'));
const Patients = lazy(() => import('./pages/Patients.jsx'));
const PatientDetail = lazy(() => import('./pages/PatientDetail.jsx'));
const HealthRecords = lazy(() => import('./pages/HealthRecords.jsx'));
const LabTracking = lazy(() => import('./pages/LabTracking.jsx'));
const Users = lazy(() => import('./pages/Users.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const Preferences = lazy(() => import('./pages/Preferences.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));

function Splash() {
  return (
    <div className="splash">
      <span className="spinner" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Splash />;
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function NotFound() {
  return (
    <EmptyState title="Page not found" text="That screen does not exist — check the address or head back to the dashboard.">
      <Button variant="primary" onClick={() => window.location.assign('/')} style={{ marginTop: 'var(--sp-2)' }}>
        Back to dashboard
      </Button>
    </EmptyState>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="appointments"
          element={
            <Suspense fallback={<Splash />}>
              <Appointments />
            </Suspense>
          }
        />
        <Route
          path="patients"
          element={
            <Suspense fallback={<Splash />}>
              <Patients />
            </Suspense>
          }
        />
        <Route
          path="patients/:id"
          element={
            <Suspense fallback={<Splash />}>
              <PatientDetail />
            </Suspense>
          }
        />
        <Route
          path="health-records"
          element={
            <Suspense fallback={<Splash />}>
              <HealthRecords />
            </Suspense>
          }
        />
        <Route
          path="lab-tracking"
          element={
            <Suspense fallback={<Splash />}>
              <LabTracking />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <Suspense fallback={<Splash />}>
              <Users />
            </Suspense>
          }
        />
        <Route
          path="messages"
          element={
            <Suspense fallback={<Splash />}>
              <Messages />
            </Suspense>
          }
        />
        <Route
          path="preferences"
          element={
            <Suspense fallback={<Splash />}>
              <Preferences />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <Suspense fallback={<Splash />}>
              <Reports />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
