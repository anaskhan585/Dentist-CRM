import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import AppointmentForm from '../forms/AppointmentForm.jsx';
import PatientForm from '../forms/PatientForm.jsx';
import InvoiceForm from '../forms/InvoiceForm.jsx';
import { get } from '../../lib/api.js';

const COLLAPSE_KEY = 'vanguard.sidebar-collapsed';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const location = useLocation();

  const toggle = useCallback(() => {
    setCollapsed((value) => {
      localStorage.setItem(COLLAPSE_KEY, String(!value));
      return !value;
    });
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // "[" toggles the rail — handy when charting with one hand on the mouse.
  useEffect(() => {
    const onKeyDown = (event) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '[') {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const { data: overview } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => get('/dashboard/overview'),
    staleTime: 60000,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => get('/settings'),
    staleTime: 5 * 60000,
  });

  const counts = {
    appointments: overview?.stats?.todayAppointments?.value ?? 0,
    messages: overview?.stats?.unreadMessages ?? 0,
    lab: overview?.stats?.overdueLabCases ?? 0,
  };

  return (
    <div className="shell" data-collapsed={collapsed} data-mobile-open={mobileOpen}>
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        onNavigate={() => setMobileOpen(false)}
        counts={counts}
        clinicName={settings?.clinic?.name}
      />
      <div className="sidebar__scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <div className="shell__main">
        <Topbar
          onOpenMobile={() => setMobileOpen(true)}
          onNewAppointment={() => setModal('appointment')}
          onNewPatient={() => setModal('patient')}
          onNewInvoice={() => setModal('invoice')}
          unread={counts.messages}
        />
        <main className="shell__content">
          <Outlet />
        </main>
      </div>

      <AppointmentForm open={modal === 'appointment'} onClose={() => setModal(null)} />
      <PatientForm open={modal === 'patient'} onClose={() => setModal(null)} />
      <InvoiceForm open={modal === 'invoice'} onClose={() => setModal(null)} />
    </div>
  );
}
