import { NavLink } from 'react-router-dom';
import {
  IconCalendar,
  IconChevronLeft,
  IconDashboard,
  IconLab,
  IconMessages,
  IconPatients,
  IconPreferences,
  IconRecords,
  IconReports,
  IconUsers,
} from '../../lib/icons.jsx';
import { Avatar } from '../ui/index.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { ROLES } from '../../lib/constants.js';

/**
 * Navigation mirrors the practice's previous system exactly — same tabs, same
 * order — so nobody has to relearn where anything lives. The section headings
 * are new, but they only group the existing order; nothing was moved.
 */
const NAV = [
  {
    section: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: IconDashboard, end: true }],
  },
  {
    section: 'Day to day',
    items: [
      { to: '/appointments', label: 'Appointments', icon: IconCalendar, badge: 'appointments' },
      { to: '/patients', label: 'Patients', icon: IconPatients },
    ],
  },
  {
    section: 'Clinical',
    items: [
      { to: '/health-records', label: 'Health Records', icon: IconRecords },
      { to: '/lab-tracking', label: 'Lab Tracking', icon: IconLab, badge: 'lab' },
    ],
  },
  {
    section: 'Practice',
    items: [
      { to: '/users', label: 'Users', icon: IconUsers },
      { to: '/messages', label: 'Messages', icon: IconMessages, badge: 'messages' },
      { to: '/preferences', label: 'Preferences', icon: IconPreferences },
      { to: '/reports', label: 'Reports', icon: IconReports },
    ],
  },
];

/** The "v" and swoosh lifted from the Vive logo, as a square mark for the rail. */
function ViveMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <g stroke="var(--brand)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 8 L16 16.5 L21.5 8" strokeWidth="3.2" />
        <path d="M4.5 19 C 7 27, 25 28, 27.5 17.5" strokeWidth="3" />
      </g>
    </svg>
  );
}

export default function Sidebar({ collapsed, onToggle, onNavigate, counts = {}, clinicName }) {
  const { user } = useAuth();

  const badgeFor = (key) => {
    const value = counts[key];
    return value > 0 ? value : null;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark">
          <ViveMark />
        </span>
        <div className="sidebar__wordmark">
          <img src="/brand/vive-logo-white.png" alt={clinicName ?? 'Vive Dental Clinic'} />
          <span>Practice CRM</span>
        </div>
      </div>

      <button
        type="button"
        className="sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={`${collapsed ? 'Expand' : 'Collapse'} sidebar  ( [ )`}
      >
        <IconChevronLeft />
      </button>

      <nav className="sidebar__scroll" aria-label="Main">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="sidebar__section">{group.section}</p>
            {group.items.map((item) => {
              const badge = item.badge ? badgeFor(item.badge) : null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  data-tip={item.label}
                  onClick={onNavigate}
                  className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
                >
                  <span className="nav-item__icon">
                    <item.icon />
                  </span>
                  <span className="nav-item__label">{item.label}</span>
                  {badge && (
                    <span className="nav-item__badge" data-tone={item.badge === 'lab' ? 'alert' : undefined}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <NavLink to="/preferences" className="sidebar__user" onClick={onNavigate}>
          <Avatar name={user?.name} colour={user?.colour} initials={user?.avatarInitials} size="sm" />
          <span className="sidebar__user-meta">
            <strong>{user?.name}</strong>
            <span>{ROLES[user?.role]?.label ?? user?.role}</span>
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
