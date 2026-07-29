import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '../lib/api.js';
import { age, date, dayjs, fullName, money, time, titleCase } from '../lib/format.js';
import { APPOINTMENT_STATUS, INVOICE_STATUS, LAB_STAGES, RECORD_TYPES, TOOTH_STATUS } from '../lib/constants.js';
import { useAuth } from '../lib/auth.jsx';
import { useSaveMutation } from '../lib/useSaveMutation.js';
import { useSettings } from '../components/forms/pickers.jsx';
import Odontogram from '../components/Odontogram.jsx';
import PatientForm from '../components/forms/PatientForm.jsx';
import AppointmentForm from '../components/forms/AppointmentForm.jsx';
import HealthRecordForm from '../components/forms/HealthRecordForm.jsx';
import InvoiceForm from '../components/forms/InvoiceForm.jsx';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHead,
  EmptyState,
  Field,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from '../components/ui/index.jsx';
import {
  IconAlert,
  IconBilling,
  IconCalendar,
  IconChevronLeft,
  IconEdit,
  IconLab,
  IconMail,
  IconPhone,
  IconPlus,
  IconRecords,
  IconTooth,
} from '../lib/icons.jsx';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'chart', label: 'Dental chart' },
  { key: 'records', label: 'Health records' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'billing', label: 'Billing' },
  { key: 'lab', label: 'Lab work' },
];

/* --- Tooth editor --------------------------------------------------------- */

function ToothModal({ tooth, entry, patientId, onClose }) {
  const [status, setStatus] = useState(entry?.status ?? 'healthy');
  const [surfaces, setSurfaces] = useState(entry?.surfaces ?? []);
  const [note, setNote] = useState(entry?.note ?? '');
  const queryClient = useQueryClient();

  const save = useSaveMutation({
    mutationFn: (payload) => patch(`/patients/${patientId}/tooth-chart`, payload),
    successMessage: `Tooth ${tooth} updated`,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
      onClose();
    },
  });

  const toggleSurface = (surface) =>
    setSurfaces((current) => (current.includes(surface) ? current.filter((s) => s !== surface) : [...current, surface]));

  return (
    <Modal
      open
      onClose={onClose}
      size="narrow"
      title={`Tooth ${tooth}`}
      sub="FDI notation"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={() => save.mutate({ tooth, status, surfaces, note })}
          >
            Save
          </Button>
        </>
      }
    >
      <Field label="Condition">
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          {Object.entries(TOOTH_STATUS).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Surfaces" hint="Mesial, Occlusal, Distal, Buccal, Lingual" className="span-2" style={{ marginTop: 'var(--sp-4)' }}>
        <div className="day-picker">
          {['M', 'O', 'D', 'B', 'L'].map((surface) => (
            <button
              key={surface}
              type="button"
              className="day-picker__day"
              aria-pressed={surfaces.includes(surface)}
              onClick={() => toggleSurface(surface)}
            >
              {surface}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Note" style={{ marginTop: 'var(--sp-4)' }}>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} style={{ minHeight: 60 }} />
      </Field>
    </Modal>
  );
}

/* --- Page ----------------------------------------------------------------- */

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canChart } = useAuth();
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [booking, setBooking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [invoicing, setInvoicing] = useState(false);
  const [toothEdit, setToothEdit] = useState(null);

  const { data: settings } = useSettings();
  const symbol = settings?.locale?.currencySymbol ?? 'Rs';

  const { data, isLoading } = useQuery({
    queryKey: ['patients', id],
    queryFn: () => get(`/patients/${id}`),
  });

  if (isLoading) {
    return (
      <Card>
        <div className="card__body">
          <Skeleton height={68} width={68} radius="50%" />
          <Skeleton height={26} width="30%" style={{ marginTop: 20 }} />
          <Skeleton height={14} width="18%" style={{ marginTop: 10 }} />
        </div>
      </Card>
    );
  }

  const { patient, appointments = [], records = [], invoices = [], labCases = [] } = data ?? {};
  if (!patient) return <EmptyState title="Patient not found" text="This file may have been removed." />;

  const alerts = [
    ...(patient.allergies ?? []).map((item) => ({ tone: 'rose', label: `Allergy: ${item}` })),
    ...(patient.medicalConditions ?? []).map((item) => ({ tone: 'gold', label: item })),
  ];

  return (
    <>
      <button className="backlink" onClick={() => navigate('/patients')}>
        <IconChevronLeft /> All patients
      </button>

      <Card className="patient-hero">
        <div className="patient-hero__main">
          <Avatar name={fullName(patient)} size="xl" />
          <div className="patient-hero__id">
            <h1 className="patient-hero__name display">{fullName(patient)}</h1>
            <p className="patient-hero__meta numeric">
              {patient.fileNo}
              {age(patient.dateOfBirth) !== null && <> · {age(patient.dateOfBirth)} yrs</>}
              {patient.gender !== 'undisclosed' && <> · {titleCase(patient.gender)}</>}
              {patient.bloodGroup && <> · {patient.bloodGroup}</>}
            </p>
            <div className="patient-hero__contact">
              <a href={`tel:${patient.phone}`}>
                <IconPhone /> {patient.phone}
              </a>
              {patient.email && (
                <a href={`mailto:${patient.email}`}>
                  <IconMail /> {patient.email}
                </a>
              )}
            </div>
            {patient.tags?.length > 0 && (
              <div className="patient-hero__tags">
                {patient.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="patient-hero__side">
          <div className="patient-hero__stats">
            <div>
              <span className="eyebrow">Balance</span>
              <strong className="numeric" style={{ color: patient.balance > 0 ? 'var(--rose)' : 'var(--ink)' }}>
                {money(patient.balance, { symbol })}
              </strong>
            </div>
            <div>
              <span className="eyebrow">Last visit</span>
              <strong>{patient.lastVisitAt ? date(patient.lastVisitAt, 'D MMM YYYY') : 'Never'}</strong>
            </div>
            <div>
              <span className="eyebrow">Dentist</span>
              <strong>{patient.primaryDentist?.name ?? 'Unassigned'}</strong>
            </div>
          </div>

          <div className="patient-hero__actions">
            <Button icon={IconCalendar} onClick={() => setBooking(true)}>
              Book
            </Button>
            <Button icon={IconEdit} onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="patient-hero__alerts">
            <IconAlert />
            {alerts.map((alert) => (
              <Badge key={alert.label} tone={alert.tone}>
                {alert.label}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <nav className="tabs" aria-label="Patient sections">
        {TABS.map((item) => (
          <button key={item.key} className="tabs__tab" aria-current={tab === item.key} onClick={() => setTab(item.key)}>
            {item.label}
            {item.key === 'records' && records.length > 0 && <span className="tabs__count numeric">{records.length}</span>}
            {item.key === 'lab' && labCases.length > 0 && <span className="tabs__count numeric">{labCases.length}</span>}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="detail-grid">
          <Card>
            <CardHead title="Medical summary" />
            <div className="card__body">
              <dl className="datalist">
                <div>
                  <dt>Allergies</dt>
                  <dd>{patient.allergies?.length ? patient.allergies.join(', ') : 'None recorded'}</dd>
                </div>
                <div>
                  <dt>Conditions</dt>
                  <dd>{patient.medicalConditions?.length ? patient.medicalConditions.join(', ') : 'None recorded'}</dd>
                </div>
                <div>
                  <dt>Medications</dt>
                  <dd>{patient.medications?.length ? patient.medications.join(', ') : 'None recorded'}</dd>
                </div>
                <div>
                  <dt>Date of birth</dt>
                  <dd>{date(patient.dateOfBirth)}</dd>
                </div>
                <div>
                  <dt>Emergency contact</dt>
                  <dd>
                    {patient.emergencyContact?.name
                      ? `${patient.emergencyContact.name} (${patient.emergencyContact.relation}) · ${patient.emergencyContact.phone}`
                      : 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt>Insurance</dt>
                  <dd>
                    {patient.insurance?.provider
                      ? `${patient.insurance.provider} · ${patient.insurance.policyNo ?? ''}`
                      : 'Self-funded'}
                  </dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>
                    {[patient.address?.line1, patient.address?.city, patient.address?.postalCode].filter(Boolean).join(', ') ||
                      'Not provided'}
                  </dd>
                </div>
              </dl>

              {patient.notes && (
                <div className="callout">
                  <span className="eyebrow">Front-desk note</span>
                  <p>{patient.notes}</p>
                </div>
              )}
            </div>
          </Card>

          <Card flush>
            <CardHead title="Recent activity" sub="Latest visits and notes" />
            {appointments.length || records.length ? (
              <ol className="timeline">
                {[
                  ...appointments.slice(0, 5).map((item) => ({
                    id: item._id,
                    at: item.startAt,
                    icon: IconCalendar,
                    title: item.treatment,
                    meta: `${item.dentist?.name} · ${APPOINTMENT_STATUS[item.status]?.label}`,
                  })),
                  ...records.slice(0, 5).map((item) => ({
                    id: item._id,
                    at: item.recordedAt,
                    icon: IconRecords,
                    title: item.title,
                    meta: `${RECORD_TYPES[item.recordType]?.label} · ${item.author?.name}`,
                  })),
                ]
                  .sort((a, b) => new Date(b.at) - new Date(a.at))
                  .slice(0, 8)
                  .map((entry) => (
                    <li key={entry.id}>
                      <span className="timeline__marker">
                        <entry.icon />
                      </span>
                      <div className="timeline__body">
                        <strong>{entry.title}</strong>
                        <span>{entry.meta}</span>
                      </div>
                      <time className="timeline__when">{date(entry.at, 'D MMM YY')}</time>
                    </li>
                  ))}
              </ol>
            ) : (
              <EmptyState title="No history yet" text="Visits and clinical notes will appear here." />
            )}
          </Card>
        </div>
      )}

      {tab === 'chart' && (
        <Card>
          <CardHead
            title="Dental chart"
            sub={canChart ? 'Select a tooth to record its condition' : 'Read-only — charting is limited to clinicians'}
          >
            <Badge tone="pine">
              <IconTooth style={{ width: 13, height: 13 }} /> FDI notation
            </Badge>
          </CardHead>
          <div className="card__body">
            <Odontogram
              chart={patient.toothChart ?? []}
              readOnly={!canChart}
              onSelect={(tooth, entry) => setToothEdit({ tooth, entry })}
            />
          </div>
        </Card>
      )}

      {tab === 'records' && (
        <Card flush>
          <CardHead title="Health records" sub={`${records.length} entries on file`}>
            <Button size="sm" icon={IconPlus} variant="primary" onClick={() => setRecording(true)}>
              Add record
            </Button>
          </CardHead>
          {records.length ? (
            <ul className="record-list">
              {records.map((record) => (
                <li key={record._id}>
                  <div className="record-list__head">
                    <Badge tone={RECORD_TYPES[record.recordType]?.tone}>{RECORD_TYPES[record.recordType]?.label}</Badge>
                    <strong>{record.title}</strong>
                    <time className="muted">{date(record.recordedAt, 'D MMM YYYY')}</time>
                  </div>
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
                    {record.prescriptions?.length > 0 && (
                      <span className="muted">
                        Rx: {record.prescriptions.map((item) => `${item.drug} ${item.frequency ?? ''}`).join('; ')}
                      </span>
                    )}
                    <span className="muted">— {record.author?.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={IconRecords} title="No clinical records" text="Notes written during appointments will collect here.">
              <Button variant="primary" icon={IconPlus} onClick={() => setRecording(true)} style={{ marginTop: 'var(--sp-2)' }}>
                Add the first record
              </Button>
            </EmptyState>
          )}
        </Card>
      )}

      {tab === 'appointments' && (
        <Card flush>
          <CardHead title="Appointment history" sub={`${appointments.length} visits`}>
            <Button size="sm" icon={IconPlus} variant="primary" onClick={() => setBooking(true)}>
              Book
            </Button>
          </CardHead>
          {appointments.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Treatment</th>
                    <th>Clinician</th>
                    <th>Chair</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>
                        <strong className="numeric">{date(appointment.startAt, 'D MMM YYYY')}</strong>
                        <span className="person__meta" style={{ display: 'block' }}>{time(appointment.startAt)}</span>
                      </td>
                      <td>{appointment.treatment}</td>
                      <td>{appointment.dentist?.name}</td>
                      <td className="muted">{appointment.chair}</td>
                      <td>
                        <Badge tone={APPOINTMENT_STATUS[appointment.status]?.tone} dot>
                          {APPOINTMENT_STATUS[appointment.status]?.label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={IconCalendar} title="No appointments yet" text="Book this patient in to get started." />
          )}
        </Card>
      )}

      {tab === 'billing' && (
        <Card flush>
          <CardHead title="Invoices" sub={`Outstanding balance ${money(patient.balance, { symbol })}`}>
            <Button size="sm" icon={IconPlus} variant="primary" onClick={() => setInvoicing(true)}>
              New invoice
            </Button>
          </CardHead>
          {invoices.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Issued</th>
                    <th>Items</th>
                    <th className="table__num">Total</th>
                    <th className="table__num">Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td className="numeric">
                        <Link to="/reports" style={{ fontWeight: 600 }}>
                          {invoice.invoiceNo}
                        </Link>
                      </td>
                      <td className="muted">{date(invoice.issuedAt, 'D MMM YYYY')}</td>
                      <td className="muted truncate" style={{ maxWidth: 240 }}>
                        {invoice.items?.map((item) => item.description).join(', ')}
                      </td>
                      <td className="table__num">{money(invoice.total, { symbol })}</td>
                      <td className="table__num">
                        {invoice.balance > 0 ? (
                          <strong style={{ color: 'var(--rose)' }}>{money(invoice.balance, { symbol })}</strong>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <Badge tone={INVOICE_STATUS[invoice.status]?.tone} dot>
                          {INVOICE_STATUS[invoice.status]?.label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={IconBilling} title="Nothing invoiced" text="Charges raised for this patient will appear here." />
          )}
        </Card>
      )}

      {tab === 'lab' && (
        <Card flush>
          <CardHead title="Lab work" sub={`${labCases.length} cases`} />
          {labCases.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Work</th>
                    <th>Laboratory</th>
                    <th>Stage</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {labCases.map((labCase) => (
                    <tr key={labCase._id}>
                      <td className="numeric">{labCase.caseNo}</td>
                      <td>
                        {labCase.workType}
                        {labCase.shade && <span className="muted"> · shade {labCase.shade}</span>}
                      </td>
                      <td className="muted">{labCase.lab?.name}</td>
                      <td>
                        <Badge tone="sky">{LAB_STAGES.find((stage) => stage.key === labCase.stage)?.label}</Badge>
                      </td>
                      <td className={labCase.isOverdue ? '' : 'muted'}>
                        {labCase.isOverdue ? (
                          <strong style={{ color: 'var(--rose)' }}>{date(labCase.dueAt, 'D MMM')} · overdue</strong>
                        ) : (
                          date(labCase.dueAt, 'D MMM YYYY')
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={IconLab} title="No lab cases" text="Crowns, dentures and aligners ordered for this patient show up here." />
          )}
        </Card>
      )}

      <PatientForm open={editing} onClose={() => setEditing(false)} patient={patient} />
      <AppointmentForm open={booking} onClose={() => setBooking(false)} prefill={{ patient: patient._id }} />
      <HealthRecordForm open={recording} onClose={() => setRecording(false)} patientId={patient._id} />
      <InvoiceForm open={invoicing} onClose={() => setInvoicing(false)} patientId={patient._id} />
      {toothEdit && (
        <ToothModal tooth={toothEdit.tooth} entry={toothEdit.entry} patientId={patient._id} onClose={() => setToothEdit(null)} />
      )}
    </>
  );
}
