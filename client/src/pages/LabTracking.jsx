import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getList, patch } from '../lib/api.js';
import { date, dayjs, fullName, money } from '../lib/format.js';
import { LAB_STAGES } from '../lib/constants.js';
import { useSaveMutation } from '../lib/useSaveMutation.js';
import { useSettings } from '../components/forms/pickers.jsx';
import LabCaseForm from '../components/forms/LabCaseForm.jsx';
import { Avatar, Badge, Button, Card, EmptyState, PageHead, Segmented, Skeleton } from '../components/ui/index.jsx';
import { IconAlert, IconLab, IconPlus } from '../lib/icons.jsx';

function dueLabel(labCase) {
  const due = dayjs(labCase.dueAt);
  const days = due.diff(dayjs().startOf('day'), 'day');
  if (labCase.stage === 'delivered') return { text: `Delivered`, tone: 'moss' };
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'rose' };
  if (days === 0) return { text: 'Due today', tone: 'clay' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'gold' };
  return { text: `Due ${due.format('D MMM')}`, tone: 'neutral' };
}

function CaseCard({ labCase, symbol, onEdit, onDragStart }) {
  const due = dueLabel(labCase);

  return (
    <article
      className="labcard"
      draggable
      onDragStart={(event) => onDragStart(event, labCase)}
      onClick={() => onEdit(labCase)}
      data-priority={labCase.priority}
    >
      <header className="labcard__head">
        <span className="labcard__no numeric">{labCase.caseNo}</span>
        {labCase.priority === 'urgent' && (
          <span className="labcard__urgent" title="Urgent">
            <IconAlert />
          </span>
        )}
      </header>

      <strong className="labcard__work">{labCase.workType}</strong>
      {labCase.shade && <span className="labcard__shade">Shade {labCase.shade}</span>}

      <div className="labcard__patient">
        <Avatar name={fullName(labCase.patient)} size="sm" />
        <span className="truncate">{fullName(labCase.patient)}</span>
      </div>

      <p className="labcard__lab truncate">{labCase.lab?.name}</p>

      {labCase.teeth?.length > 0 && <p className="labcard__teeth numeric">Teeth {labCase.teeth.join(', ')}</p>}

      <footer className="labcard__foot">
        <Badge tone={due.tone} dot>
          {due.text}
        </Badge>
        {labCase.cost > 0 && <span className="numeric muted">{money(labCase.cost, { symbol, short: true })}</span>}
      </footer>
    </article>
  );
}

export default function LabTracking() {
  const [view, setView] = useState('board');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState(null);

  const { data: settings } = useSettings();
  const symbol = settings?.locale?.currencySymbol ?? 'Rs';

  const { data, isLoading } = useQuery({
    queryKey: ['lab-cases'],
    queryFn: () => getList('/lab-cases', { params: { limit: 100 } }),
  });

  const moveStage = useSaveMutation({
    mutationFn: ({ id, stage }) => patch(`/lab-cases/${id}`, { stage }),
    invalidate: ['lab-cases', 'dashboard'],
    successMessage: 'Case moved',
  });

  const cases = data?.data ?? [];
  const overdue = cases.filter((labCase) => labCase.isOverdue).length;

  const onDragStart = (event, labCase) => {
    event.dataTransfer.setData('text/plain', labCase._id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (event, stage) => {
    event.preventDefault();
    setDragOver(null);
    const id = event.dataTransfer.getData('text/plain');
    const labCase = cases.find((item) => item._id === id);
    if (labCase && labCase.stage !== stage) moveStage.mutate({ id, stage });
  };

  return (
    <>
      <PageHead
        title="Lab Tracking"
        sub={
          isLoading
            ? 'Loading cases…'
            : `${cases.filter((c) => c.stage !== 'delivered').length} cases in progress${overdue ? ` · ${overdue} overdue` : ''}`
        }
      >
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'board', label: 'Board' },
            { value: 'table', label: 'Table' },
          ]}
        />
        <Button icon={IconPlus} variant="primary" onClick={() => setCreating(true)}>
          New lab case
        </Button>
      </PageHead>

      {view === 'board' ? (
        isLoading ? (
          <div className="labboard">
            {LAB_STAGES.map((stage) => (
              <div className="labboard__column" key={stage.key}>
                <Skeleton height={120} radius="var(--r-md)" />
              </div>
            ))}
          </div>
        ) : (
          <div className="labboard">
            {LAB_STAGES.map((stage) => {
              const stageCases = cases.filter((labCase) => labCase.stage === stage.key);
              return (
                <section
                  key={stage.key}
                  className="labboard__column"
                  data-over={dragOver === stage.key}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(stage.key);
                  }}
                  onDragLeave={() => setDragOver((current) => (current === stage.key ? null : current))}
                  onDrop={(event) => onDrop(event, stage.key)}
                >
                  <header className="labboard__head">
                    <div>
                      <strong>{stage.label}</strong>
                      <span>{stage.hint}</span>
                    </div>
                    <span className="labboard__count numeric">{stageCases.length}</span>
                  </header>

                  <div className="labboard__cards">
                    {stageCases.map((labCase) => (
                      <CaseCard key={labCase._id} labCase={labCase} symbol={symbol} onEdit={setEditing} onDragStart={onDragStart} />
                    ))}
                    {!stageCases.length && <p className="labboard__empty">Drop a case here</p>}
                  </div>
                </section>
              );
            })}
          </div>
        )
      ) : (
        <Card flush>
          <div className="table-wrap">
            <table className="table table--clickable">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Patient</th>
                  <th>Work</th>
                  <th>Laboratory</th>
                  <th>Clinician</th>
                  <th>Stage</th>
                  <th>Due</th>
                  <th className="table__num">Cost</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((labCase) => {
                  const due = dueLabel(labCase);
                  return (
                    <tr key={labCase._id} onClick={() => setEditing(labCase)}>
                      <td className="numeric">{labCase.caseNo}</td>
                      <td>
                        <div className="person">
                          <Avatar name={fullName(labCase.patient)} size="sm" />
                          <span className="person__name">{fullName(labCase.patient)}</span>
                        </div>
                      </td>
                      <td>
                        {labCase.workType}
                        {labCase.shade && <span className="muted"> · {labCase.shade}</span>}
                      </td>
                      <td className="muted">{labCase.lab?.name}</td>
                      <td className="muted">{labCase.dentist?.name}</td>
                      <td>
                        <Badge tone="sky">{LAB_STAGES.find((stage) => stage.key === labCase.stage)?.label}</Badge>
                      </td>
                      <td>
                        <Badge tone={due.tone} dot>
                          {due.text}
                        </Badge>
                      </td>
                      <td className="table__num numeric">{money(labCase.cost, { symbol })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!isLoading && !cases.length && (
              <EmptyState icon={IconLab} title="No lab cases" text="Crowns, dentures and aligners you send out will be tracked here." />
            )}
          </div>
        </Card>
      )}

      <LabCaseForm open={creating} onClose={() => setCreating(false)} />
      <LabCaseForm open={Boolean(editing)} onClose={() => setEditing(null)} labCase={editing} />
    </>
  );
}
