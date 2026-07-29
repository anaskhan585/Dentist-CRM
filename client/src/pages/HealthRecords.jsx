import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getList } from '../lib/api.js';
import { date, fullName } from '../lib/format.js';
import { RECORD_TYPES } from '../lib/constants.js';
import HealthRecordForm from '../components/forms/HealthRecordForm.jsx';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHead,
  Pagination,
  Select,
  Skeleton,
} from '../components/ui/index.jsx';
import { IconPlus, IconRecords, IconSearch } from '../lib/icons.jsx';

export default function HealthRecords() {
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [recordType, setRecordType] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(term.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [term]);

  const { data, isLoading } = useQuery({
    queryKey: ['health-records', { search, recordType, page }],
    queryFn: () =>
      getList('/health-records', {
        params: { search: search || undefined, recordType: recordType || undefined, page, limit: 15 },
      }),
    placeholderData: keepPreviousData,
  });

  const records = data?.data ?? [];

  return (
    <>
      <PageHead title="Health Records" sub={data?.meta ? `${data.meta.total} clinical entries across the practice` : 'Clinical notes'}>
        <Button icon={IconPlus} variant="primary" onClick={() => setCreating(true)}>
          New record
        </Button>
      </PageHead>

      <Card flush>
        <div className="toolbar">
          <div className="toolbar__search">
            <IconSearch />
            <input
              type="search"
              value={term}
              placeholder="Search by title, diagnosis or complaint"
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search records"
            />
          </div>

          <Select value={recordType} onChange={(event) => { setRecordType(event.target.value); setPage(1); }}>
            <option value="">All record types</option>
            {Object.entries(RECORD_TYPES).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <div style={{ padding: 'var(--sp-5)', display: 'grid', gap: 'var(--sp-4)' }}>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} height={64} radius="var(--r-md)" />
            ))}
          </div>
        ) : records.length ? (
          <ul className="record-list record-list--compact">
            {records.map((record) => {
              const open = expanded === record._id;
              return (
                <li key={record._id}>
                  <button className="record-list__toggle" onClick={() => setExpanded(open ? null : record._id)} aria-expanded={open}>
                    <Badge tone={RECORD_TYPES[record.recordType]?.tone}>{RECORD_TYPES[record.recordType]?.label}</Badge>
                    <span className="record-list__title truncate">{record.title}</span>
                    <span className="record-list__patient">
                      <Avatar name={fullName(record.patient)} size="sm" />
                      <span className="truncate">{fullName(record.patient)}</span>
                    </span>
                    <time className="muted">{date(record.recordedAt, 'D MMM YYYY')}</time>
                  </button>

                  {open && (
                    <div className="record-list__detail">
                      <dl className="record-list__soap">
                        {record.chiefComplaint && (
                          <div>
                            <dt>Complaint</dt>
                            <dd>{record.chiefComplaint}</dd>
                          </div>
                        )}
                        {record.findings && (
                          <div>
                            <dt>Findings</dt>
                            <dd>{record.findings}</dd>
                          </div>
                        )}
                        {record.diagnosis && (
                          <div>
                            <dt>Diagnosis</dt>
                            <dd>{record.diagnosis}</dd>
                          </div>
                        )}
                        {record.treatmentDone && (
                          <div>
                            <dt>Treatment</dt>
                            <dd>{record.treatmentDone}</dd>
                          </div>
                        )}
                        {record.plan && (
                          <div>
                            <dt>Plan</dt>
                            <dd>{record.plan}</dd>
                          </div>
                        )}
                      </dl>
                      <div className="record-list__foot">
                        {record.teeth?.length > 0 && <span className="muted numeric">Teeth {record.teeth.join(', ')}</span>}
                        <span className="muted">Recorded by {record.author?.name}</span>
                        {record.patient?._id && (
                          <Link to={`/patients/${record.patient._id}`} className="btn btn--ghost btn--sm">
                            Open patient file
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={IconRecords}
            title="No records found"
            text={search ? `Nothing matches “${search}”.` : 'Clinical notes written during appointments will collect here.'}
          />
        )}

        <Pagination meta={data?.meta} onChange={setPage} />
      </Card>

      <HealthRecordForm open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
