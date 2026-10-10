import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getList } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { fullName } from '../../lib/format.js';
import {
  IconBell,
  IconBilling,
  IconCalendar,
  IconChevronDown,
  IconLogout,
  IconMenu,
  IconPatients,
  IconPlus,
  IconPreferences,
  IconSearch,
} from '../../lib/icons.jsx';
import { Avatar, Dropdown, IconButton } from '../ui/index.jsx';
import { ROLES } from '../../lib/constants.js';

/** Debounced patient lookup — the front desk searches by name or phone constantly. */
function useSearch(term) {
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 220);
    return () => clearTimeout(timer);
  }, [term]);

  return useQuery({
    queryKey: ['search', debounced],
    queryFn: () => getList('/patients', { params: { search: debounced, limit: 6 } }),
    enabled: debounced.length >= 2,
    staleTime: 20000,
  });
}

export default function Topbar({ onOpenMobile, onNewAppointment, onNewPatient, onNewInvoice, unread = 0 }) {
  const [term, setTerm] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { data: results, isFetching } = useSearch(term);

  // ⌘K / Ctrl-K jumps to search from anywhere.
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        inputRef.current?.blur();
        setFocused(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openPatient = (id) => {
    setTerm('');
    setFocused(false);
    inputRef.current?.blur();
    navigate(`/patients/${id}`);
  };

  const patients = results?.data ?? [];
  const showResults = focused && term.trim().length >= 2;

  return (
    <header className="topbar">
      <button className="topbar__burger" onClick={onOpenMobile} aria-label="Open navigation">
        <IconMenu />
      </button>

      <div className="topbar__search">
        <IconSearch />
        <input
          ref={inputRef}
          type="search"
          value={term}
          placeholder="Search patients by name, file no. or phone"
          aria-label="Search patients"
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 140)}
        />
        {!term && <kbd className="topbar__kbd">⌘K</kbd>}

        {showResults && (
          <div className="search-results">
            {isFetching && !patients.length && <p className="search-results__note">Searching…</p>}
            {!isFetching && !patients.length && <p className="search-results__note">No patients match “{term}”.</p>}
            {patients.map((patient) => (
              <button key={patient._id} className="search-results__row" onMouseDown={() => openPatient(patient._id)}>
                <Avatar name={fullName(patient)} size="sm" />
                <span className="search-results__meta">
                  <strong>{fullName(patient)}</strong>
                  <span>
                    {patient.fileNo} · {patient.phone}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="topbar__spacer" />

      <div className="topbar__actions">
        <Dropdown
          trigger={({ toggle }) => (
            <button className="btn btn--primary btn--sm" onClick={toggle}>
              <IconPlus />
              <span className="topbar__new-label">New</span>
              <IconChevronDown style={{ width: 13, height: 13, opacity: 0.7 }} />
            </button>
          )}
        >
          <button className="menu__item" onClick={onNewAppointment}>
            <IconCalendar /> Appointment
          </button>
          <button className="menu__item" onClick={onNewPatient}>
            <IconPatients /> Patient
          </button>
          {isAdmin && (
            <button className="menu__item" onClick={onNewInvoice}>
              <IconBilling /> Invoice
            </button>
          )}
        </Dropdown>

        <div className="topbar__divider" />

        <button className="icon-btn" aria-label="Messages" title="Messages" onClick={() => navigate('/messages')}>
          <IconBell />
          {unread > 0 && <span className="icon-btn__dot" />}
        </button>

        <Dropdown
          trigger={({ toggle }) => (
            <button className="topbar__profile" onClick={toggle} aria-label="Account menu">
              <Avatar name={user?.name} colour={user?.colour} initials={user?.avatarInitials} size="sm" />
              <IconChevronDown style={{ width: 14, height: 14, color: 'var(--ink-3)' }} />
            </button>
          )}
        >
          <div className="menu__head">
            <strong style={{ display: 'block', fontSize: 'var(--text-base)' }}>{user?.name}</strong>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-3)' }}>
              {ROLES[user?.role]?.label} · {user?.email}
            </span>
          </div>
          <button className="menu__item" onClick={() => navigate('/preferences')}>
            <IconPreferences /> Preferences
          </button>
          <div className="menu__sep" />
          <button className="menu__item" data-tone="danger" onClick={logout}>
            <IconLogout /> Sign out
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
