import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getList } from '../lib/api.js';
import { age, dayjs, fullName, money } from '../lib/format.js';
import { DentistSelect, useSettings } from '../components/forms/pickers.jsx';
import PatientForm from '../components/forms/PatientForm.jsx';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHead,
  Pagination,
  Select,
  TableSkeleton,
} from '../components/ui/index.jsx';
import { IconPatients, IconPlus, IconSearch } from '../lib/icons.jsx';

export default function Patients() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [dentist, setDentist] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const { data: settings } = useSettings();
  const symbol = settings?.locale?.currencySymbol ?? 'Rs';

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(term.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [term]);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'list', { search, status, dentist, sort, page }],
    queryFn: () =>
      getList('/patients', {
        params: { search: search || undefined, status: status || undefined, dentist: dentist || undefined, sort, page, limit: 20 },
      }),
    // Keeps the current page on screen while the next one loads, instead of
    // collapsing the table back to skeletons on every page change.
    placeholderData: keepPreviousData,
  });

  const patients = data?.data ?? [];

  return (
    <>
      <PageHead title="Patients" sub={data?.meta ? `${data.meta.total} files on record` : 'Patient files'}>
        <Button icon={IconPlus} variant="primary" onClick={() => setCreating(true)}>
          Register patient
        </Button>
      </PageHead>

      <Card flush>
        <div className="toolbar">
          <div className="toolbar__search">
            <IconSearch />
            <input
              type="search"
              value={term}
              placeholder="Search by name, file number or phone"
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search patients"
            />
          </div>

          <DentistSelect value={dentist} onChange={(value) => { setDentist(value); setPage(1); }} includeAll />

          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All files</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>

          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="-createdAt">Newest first</option>
            <option value="lastName">Name A–Z</option>
            <option value="-lastVisitAt">Recently seen</option>
            <option value="-balance">Largest balance</option>
          </Select>
        </div>

        <div className="table-wrap">
          <table className="table table--clickable">
            <thead>
              <tr>
                <th>Patient</th>
                <th>File no.</th>
                <th>Age</th>
                <th>Primary dentist</th>
                <th>Last visit</th>
                <th className="table__num">Balance</th>
                <th>Flags</th>
              </tr>
            </thead>

            {isLoading ? (
              <TableSkeleton cols={7} rows={8} />
            ) : (
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient._id} onClick={() => navigate(`/patients/${patient._id}`)}>
                    <td>
                      <div className="person">
                        <Avatar name={fullName(patient)} />
                        <div style={{ minWidth: 0 }}>
                          <div className="person__name">{fullName(patient)}</div>
                          <div className="person__meta">{patient.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="numeric muted">{patient.fileNo}</td>
                    <td className="numeric">{age(patient.dateOfBirth) ?? '—'}</td>
                    <td>{patient.primaryDentist?.name ?? <span className="muted">Unassigned</span>}</td>
                    <td className="muted">{patient.lastVisitAt ? dayjs(patient.lastVisitAt).format('D MMM YYYY') : 'Never'}</td>
                    <td className="table__num">
                      {patient.balance > 0 ? (
                        <strong style={{ color: 'var(--rose)' }}>{money(patient.balance, { symbol })}</strong>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {patient.allergies?.length > 0 && <Badge tone="rose">Allergy</Badge>}
                        {patient.medicalConditions?.length > 0 && <Badge tone="gold">Medical</Badge>}
                        {patient.tags?.slice(0, 1).map((tag) => (
                          <Badge key={tag} tone="neutral">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {!isLoading && !patients.length && (
            <EmptyState
              icon={IconPatients}
              title="No patients found"
              text={search ? `Nothing matches “${search}”. Try a file number or phone instead.` : 'Register your first patient to begin.'}
            >
              <Button variant="primary" icon={IconPlus} onClick={() => setCreating(true)} style={{ marginTop: 'var(--sp-2)' }}>
                Register patient
              </Button>
            </EmptyState>
          )}
        </div>

        <Pagination meta={data?.meta} onChange={setPage} />
      </Card>

      <PatientForm open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
