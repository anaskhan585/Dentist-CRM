import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, getList } from '../../lib/api.js';
import { fullName } from '../../lib/format.js';
import { Avatar, Select } from '../ui/index.jsx';
import { IconSearch } from '../../lib/icons.jsx';

/** Cached list of clinicians — small, changes rarely, used by nearly every form. */
export function useDentists() {
  return useQuery({
    queryKey: ['users', 'clinicians'],
    queryFn: () => get('/users', { params: { active: 'true' } }),
    staleTime: 5 * 60000,
    select: (users) => users.filter((user) => ['dentist', 'admin', 'hygienist'].includes(user.role)),
  });
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => get('/settings'), staleTime: 5 * 60000 });
}

export function DentistSelect({ value, onChange, includeAll, error, ...props }) {
  const { data: dentists = [] } = useDentists();
  return (
    <Select value={value ?? ''} onChange={(event) => onChange(event.target.value)} error={error} {...props}>
      {includeAll ? <option value="">All clinicians</option> : <option value="">Select a clinician</option>}
      {dentists.map((dentist) => (
        <option key={dentist._id} value={dentist._id}>
          {dentist.name}
          {dentist.specialty ? ` — ${dentist.specialty}` : ''}
        </option>
      ))}
    </Select>
  );
}

/**
 * Type-ahead patient picker. A plain <select> is unusable once a practice has a
 * few thousand files, so this searches server-side as you type.
 */
export function PatientPicker({ value, onChange, error, placeholder = 'Search by name, file no. or phone' }) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 200);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data: results } = useQuery({
    queryKey: ['patients', 'picker', debounced],
    queryFn: () => getList('/patients', { params: { search: debounced, limit: 8, status: 'active' } }),
    enabled: open,
    staleTime: 20000,
  });

  // Resolve the selected id back to a name when the form opens pre-filled.
  // This shares a cache entry with the patient file page, so it has to cache
  // the whole payload and narrow it here — unwrapping inside queryFn wrote a
  // bare patient over the file's bundle and left that page "not found".
  const { data: selected } = useQuery({
    queryKey: ['patients', value],
    queryFn: () => get(`/patients/${value}`),
    select: (payload) => payload?.patient,
    enabled: Boolean(value),
    staleTime: 60000,
  });

  const patients = results?.data ?? [];

  if (value && selected && !open) {
    return (
      <div className="picker-chosen">
        <Avatar name={fullName(selected)} size="sm" />
        <span className="picker-chosen__meta">
          <strong>{fullName(selected)}</strong>
          <span>
            {selected.fileNo} · {selected.phone}
          </span>
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            onChange('');
            setTerm('');
            setOpen(true);
          }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="picker" ref={ref}>
      <IconSearch className="picker__icon" />
      <input
        className="input"
        style={{ paddingLeft: 34 }}
        value={term}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        onChange={(event) => setTerm(event.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="picker__list">
          {!patients.length && <p className="picker__note">{debounced ? 'No matching patients' : 'Start typing to search'}</p>}
          {patients.map((patient) => (
            <button
              key={patient._id}
              type="button"
              className="picker__row"
              onClick={() => {
                onChange(patient._id);
                setOpen(false);
                setTerm('');
              }}
            >
              <Avatar name={fullName(patient)} size="sm" />
              <span className="picker-chosen__meta">
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
  );
}
