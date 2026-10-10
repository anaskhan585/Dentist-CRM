import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, getList, patch } from '../lib/api.js';
import { dayjs, fullName, time } from '../lib/format.js';
import { APPOINTMENT_STATUS } from '../lib/constants.js';
import { useSaveMutation } from '../lib/useSaveMutation.js';
import { DentistSelect, useSettings } from '../components/forms/pickers.jsx';
import AppointmentForm from '../components/forms/AppointmentForm.jsx';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  EmptyState,
  PageHead,
  Segmented,
  Select,
  TableSkeleton,
} from '../components/ui/index.jsx';
import {
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconEdit,
  IconGrid,
  IconList,
  IconMore,
  IconPlus,
} from '../lib/icons.jsx';

const toMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

/* --- Day view ------------------------------------------------------------- */

function DayView({ appointments, chairs, dayStart, dayEnd, onEdit }) {
  const startMinutes = toMinutes(dayStart);
  const endMinutes = toMinutes(dayEnd);
  const totalMinutes = Math.max(60, endMinutes - startMinutes);
  const pxPerMinute = 1.5;

  const hours = [];
  for (let m = Math.ceil(startMinutes / 60) * 60; m <= endMinutes; m += 60) hours.push(m);

  const now = dayjs();
  const nowMinutes = now.hour() * 60 + now.minute();
  const showNow = appointments.some((appointment) => dayjs(appointment.startAt).isSame(now, 'day'));

  return (
    <div className="dayview">
      <div className="dayview__gutter" style={{ height: totalMinutes * pxPerMinute }}>
        {hours.map((minute) => (
          <span key={minute} className="dayview__hour numeric" style={{ top: (minute - startMinutes) * pxPerMinute }}>
            {dayjs().startOf('day').add(minute, 'minute').format('h A')}
          </span>
        ))}
      </div>

      <div className="dayview__board">
        <div className="dayview__heads">
          {chairs.map((chair) => (
            <div key={chair} className="dayview__head">
              {chair}
            </div>
          ))}
        </div>

        <div className="dayview__columns" style={{ height: totalMinutes * pxPerMinute }}>
          {hours.map((minute) => (
            <span key={minute} className="dayview__gridline" style={{ top: (minute - startMinutes) * pxPerMinute }} />
          ))}

          {showNow && nowMinutes >= startMinutes && nowMinutes <= endMinutes && (
            <span className="dayview__now" style={{ top: (nowMinutes - startMinutes) * pxPerMinute }}>
              <i />
            </span>
          )}

          {chairs.map((chair) => (
            <div key={chair} className="dayview__column">
              {appointments
                .filter((appointment) => (appointment.chair ?? chairs[0]) === chair)
                .map((appointment) => {
                  const start = dayjs(appointment.startAt);
                  const offset = (start.hour() * 60 + start.minute() - startMinutes) * pxPerMinute;
                  const height = Math.max(24, appointment.durationMinutes * pxPerMinute - 3);
                  const status = APPOINTMENT_STATUS[appointment.status];

                  return (
                    <button
                      key={appointment._id}
                      className="slot"
                      data-status={appointment.status}
                      style={{
                        top: Math.max(0, offset),
                        height,
                        '--slot-colour': appointment.dentist?.colour ?? 'var(--brand)',
                      }}
                      onClick={() => onEdit(appointment)}
                      title={`${time(appointment.startAt)} · ${fullName(appointment.patient)} · ${appointment.treatment}`}
                    >
                      <span className="slot__time numeric">{time(appointment.startAt)}</span>
                      <span className="slot__name truncate">{fullName(appointment.patient)}</span>
                      {height > 48 && <span className="slot__treatment truncate">{appointment.treatment}</span>}
                      {height > 70 && <span className="slot__status">{status?.label}</span>}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Page ----------------------------------------------------------------- */

export default function Appointments() {
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [view, setView] = useState('day');
  const [dentist, setDentist] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const { data: settings } = useSettings();
  const chairs = settings?.scheduling?.chairs ?? ['Chair 1', 'Chair 2', 'Chair 3'];
  const dayStart = settings?.scheduling?.dayStart ?? '09:00';
  const dayEnd = settings?.scheduling?.dayEnd ?? '19:00';

  const dayQuery = useQuery({
    queryKey: ['appointments', 'day', date],
    queryFn: () => get('/appointments/day', { params: { date } }),
    enabled: view === 'day',
  });

  const listQuery = useQuery({
    queryKey: ['appointments', 'list', date, dentist, status],
    queryFn: () =>
      getList('/appointments', {
        params: {
          from: dayjs(date).startOf('day').toISOString(),
          to: dayjs(date).add(14, 'day').endOf('day').toISOString(),
          dentist: dentist || undefined,
          status: status || undefined,
          limit: 100,
        },
      }),
    enabled: view === 'list',
  });

  const setStatusMutation = useSaveMutation({
    mutationFn: ({ id, ...body }) => patch(`/appointments/${id}`, body),
    invalidate: ['appointments', 'dashboard'],
    successMessage: 'Appointment updated',
  });

  const appointments = useMemo(() => {
    const list = dayQuery.data ?? [];
    return list.filter(
      (appointment) =>
        (!dentist || appointment.dentist?._id === dentist) && (!status || appointment.status === status)
    );
  }, [dayQuery.data, dentist, status]);

  const isToday = dayjs(date).isSame(dayjs(), 'day');
  const shift = (days) => setDate((current) => dayjs(current).add(days, 'day').format('YYYY-MM-DD'));

  return (
    <>
      <PageHead
        title="Appointments"
        sub={
          view === 'day'
            ? `${appointments.length} booked on ${dayjs(date).format('dddd, D MMMM')}`
            : 'Everything booked over the next fortnight'
        }
      >
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'list', label: 'List' },
          ]}
        />
        <Button icon={IconPlus} variant="primary" onClick={() => setCreating(true)}>
          New appointment
        </Button>
      </PageHead>

      <Card flush>
        <div className="toolbar">
          <div className="datenav">
            <button className="datenav__arrow" onClick={() => shift(-1)} aria-label="Previous day">
              <IconChevronLeft />
            </button>
            <input
              className="datenav__input numeric"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Choose date"
            />
            <button className="datenav__arrow" onClick={() => shift(1)} aria-label="Next day">
              <IconChevronRight />
            </button>
            {!isToday && (
              <Button size="sm" onClick={() => setDate(dayjs().format('YYYY-MM-DD'))}>
                Today
              </Button>
            )}
          </div>

          <div className="toolbar__spacer" style={{ flex: 1 }} />

          <DentistSelect value={dentist} onChange={setDentist} includeAll />

          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Any status</option>
            {Object.entries(APPOINTMENT_STATUS).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>

          <span className="toolbar__viewicon">{view === 'day' ? <IconGrid /> : <IconList />}</span>
        </div>

        {view === 'day' ? (
          dayQuery.isLoading ? (
            <div style={{ padding: 'var(--sp-8)' }}>Loading the diary…</div>
          ) : appointments.length ? (
            <DayView
              appointments={appointments}
              chairs={chairs}
              dayStart={dayStart}
              dayEnd={dayEnd}
              onEdit={setEditing}
            />
          ) : (
            <EmptyState
              icon={IconCalendar}
              title="Nothing booked"
              text={`No appointments on ${dayjs(date).format('D MMMM')} matching these filters.`}
            >
              <Button variant="primary" icon={IconPlus} onClick={() => setCreating(true)} style={{ marginTop: 'var(--sp-2)' }}>
                Book one
              </Button>
            </EmptyState>
          )
        ) : (
          <div className="table-wrap">
            <table className="table table--clickable">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Patient</th>
                  <th>Treatment</th>
                  <th>Clinician</th>
                  <th>Chair</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              {listQuery.isLoading ? (
                <TableSkeleton cols={7} />
              ) : (
                <tbody>
                  {(listQuery.data?.data ?? []).map((appointment) => {
                    const meta = APPOINTMENT_STATUS[appointment.status];
                    return (
                      <tr key={appointment._id} onClick={() => setEditing(appointment)}>
                        <td>
                          <strong className="numeric">{dayjs(appointment.startAt).format('D MMM')}</strong>
                          <span className="person__meta" style={{ display: 'block' }}>
                            {time(appointment.startAt)} · {appointment.durationMinutes}m
                          </span>
                        </td>
                        <td>
                          <div className="person">
                            <Avatar name={fullName(appointment.patient)} size="sm" />
                            <div style={{ minWidth: 0 }}>
                              <div className="person__name">{fullName(appointment.patient)}</div>
                              <div className="person__meta">{appointment.patient?.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td>{appointment.treatment}</td>
                        <td>{appointment.dentist?.name}</td>
                        <td className="muted">{appointment.chair}</td>
                        <td>
                          <Badge tone={meta?.tone} dot>
                            {meta?.label}
                          </Badge>
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <Dropdown
                            trigger={({ toggle }) => (
                              <button className="icon-btn" onClick={toggle} aria-label="Actions">
                                <IconMore />
                              </button>
                            )}
                          >
                            <button className="menu__item" onClick={() => setEditing(appointment)}>
                              <IconEdit /> Edit
                            </button>
                            <button
                              className="menu__item"
                              onClick={() => setStatusMutation.mutate({ id: appointment._id, status: 'confirmed' })}
                            >
                              <IconCheck /> Mark confirmed
                            </button>
                            <button
                              className="menu__item"
                              onClick={() => setStatusMutation.mutate({ id: appointment._id, status: 'completed' })}
                            >
                              <IconCheck /> Mark completed
                            </button>
                            <div className="menu__sep" />
                            <button
                              className="menu__item"
                              data-tone="danger"
                              onClick={() => setStatusMutation.mutate({ id: appointment._id, status: 'cancelled' })}
                            >
                              <IconClose /> Cancel
                            </button>
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
            {!listQuery.isLoading && !listQuery.data?.data?.length && (
              <EmptyState icon={IconCalendar} title="Nothing scheduled" text="No appointments match these filters." />
            )}
          </div>
        )}
      </Card>

      <AppointmentForm open={creating} onClose={() => setCreating(false)} prefill={{ startAt: dayjs(`${date}T10:00`) }} />
      <AppointmentForm open={Boolean(editing)} onClose={() => setEditing(null)} appointment={editing} />
    </>
  );
}
