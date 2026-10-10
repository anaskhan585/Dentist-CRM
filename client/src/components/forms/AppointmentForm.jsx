import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getList, patch, post } from '../../lib/api.js';
import { useSaveMutation } from '../../lib/useSaveMutation.js';
import { dayjs, fullName, time } from '../../lib/format.js';
import { TREATMENTS } from '../../lib/constants.js';
import { Button, Field, Input, Modal, Select, Textarea } from '../ui/index.jsx';
import { DentistSelect, PatientPicker, useSettings } from './pickers.jsx';

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

function defaults(prefill = {}) {
  const start = prefill.startAt ? dayjs(prefill.startAt) : dayjs().add(1, 'day').hour(10).minute(0);
  return {
    patient: prefill.patient ?? '',
    dentist: prefill.dentist ?? '',
    treatment: 'Consultation',
    chair: 'Chair 1',
    date: start.format('YYYY-MM-DD'),
    time: start.format('HH:mm'),
    durationMinutes: 30,
    status: 'scheduled',
    notes: '',
  };
}

export default function AppointmentForm({ open, onClose, appointment, prefill }) {
  const isEdit = Boolean(appointment?._id);
  const [form, setForm] = useState(defaults());
  const { data: settings } = useSettings();
  const chairs = settings?.scheduling?.chairs ?? ['Chair 1', 'Chair 2', 'Chair 3'];

  useEffect(() => {
    if (!open) return;
    if (appointment) {
      const start = dayjs(appointment.startAt);
      setForm({
        patient: appointment.patient?._id ?? appointment.patient ?? '',
        dentist: appointment.dentist?._id ?? appointment.dentist ?? '',
        treatment: appointment.treatment,
        chair: appointment.chair ?? 'Chair 1',
        date: start.format('YYYY-MM-DD'),
        time: start.format('HH:mm'),
        durationMinutes: appointment.durationMinutes,
        status: appointment.status,
        notes: appointment.notes ?? '',
      });
    } else {
      setForm(defaults(prefill));
    }
  }, [open, appointment, prefill]);

  // Show what the chosen clinician already has that day, so the user can pick a
  // free slot instead of guessing and hitting the double-booking guard.
  const { data: dayList } = useQuery({
    queryKey: ['appointments', 'busy', form.dentist, form.date],
    queryFn: () => getList('/appointments', { params: { date: form.date, dentist: form.dentist, limit: 50 } }),
    enabled: open && Boolean(form.dentist) && Boolean(form.date),
    staleTime: 15000,
  });

  const busy = (dayList?.data ?? [])
    .filter((item) => !['cancelled', 'no-show'].includes(item.status))
    .filter((item) => item._id !== appointment?._id)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const save = useSaveMutation({
    mutationFn: (payload) =>
      isEdit ? patch(`/appointments/${appointment._id}`, payload) : post('/appointments', payload),
    invalidate: ['appointments', 'dashboard', 'patients'],
    successMessage: isEdit ? 'Appointment updated' : 'Appointment booked',
    onSuccess: onClose,
  });

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    save.mutate({
      patient: form.patient,
      dentist: form.dentist,
      treatment: form.treatment,
      chair: form.chair,
      startAt: dayjs(`${form.date}T${form.time}`).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      status: form.status,
      notes: form.notes,
    });
  };

  const errors = save.fieldErrors;
  const end = dayjs(`${form.date}T${form.time}`).add(Number(form.durationMinutes), 'minute');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit appointment' : 'Book an appointment'}
      sub={form.date ? `Ends at ${end.format('h:mm A')}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" form="appointment-form" type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Book appointment'}
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Patient" required error={errors.patient} className="span-2">
            <PatientPicker
              value={form.patient}
              onChange={(value) => setForm((current) => ({ ...current, patient: value }))}
              error={errors.patient}
            />
          </Field>

          <Field label="Clinician" required error={errors.dentist}>
            <DentistSelect
              value={form.dentist}
              onChange={(value) => setForm((current) => ({ ...current, dentist: value }))}
              error={errors.dentist}
            />
          </Field>

          <Field label="Treatment" required error={errors.treatment}>
            <Select value={form.treatment} onChange={set('treatment')}>
              {TREATMENTS.map((treatment) => (
                <option key={treatment} value={treatment}>
                  {treatment}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Date" required>
            <Input type="date" value={form.date} onChange={set('date')} required />
          </Field>

          <Field label="Start time" required>
            <Input type="time" value={form.time} onChange={set('time')} step="300" required />
          </Field>

          <Field label="Duration">
            <Select value={form.durationMinutes} onChange={set('durationMinutes')}>
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Chair">
            <Select value={form.chair} onChange={set('chair')}>
              {chairs.map((chair) => (
                <option key={chair} value={chair}>
                  {chair}
                </option>
              ))}
            </Select>
          </Field>

          {isEdit && (
            <Field label="Status" className="span-2">
              <Select value={form.status} onChange={set('status')}>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In chair</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No show</option>
              </Select>
            </Field>
          )}

          {busy.length > 0 && (
            <div className="span-2 busy-hint">
              <span className="eyebrow">
                Already booked on {dayjs(form.date).format('MMM D')} — avoid these times
              </span>
              <div className="busy-hint__slots">
                {busy.map((item) => (
                  <span
                    key={item._id}
                    className="busy-hint__slot numeric"
                    title={`${fullName(item.patient)} · ${item.treatment}`}
                  >
                    {time(item.startAt)}
                    <i>{item.durationMinutes}m</i>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Field label="Notes" className="span-2">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Anything the clinician should know beforehand" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
