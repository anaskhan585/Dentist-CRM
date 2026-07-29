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

function Wordmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.4c-1.9 0-2.9.8-4.7.8-2.1 0-4 1.7-4 4.8 0 3.6 1.1 6.2 2 8.6.8 2.1 1.4 5 3.1 5 1.5 0 1.7-1.9 1.9-3.6.2-1.5.6-2.7 1.7-2.7s1.5 1.2 1.7 2.7c.2 1.7.4 3.6 1.9 3.6 1.7 0 2.3-2.9 3.1-5 .9-2.4 2-5 2-8.6 0-3.1-1.9-4.8-4-4.8-1.8 0-2.8-.8-4.7-.8Z"
        fill="var(--pine-deep)"
      />
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
          <Wordmark />
        </span>
        <div className="sidebar__wordmark">
          <strong>{clinicName ?? 'Vanguard Dental'}</strong>
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
