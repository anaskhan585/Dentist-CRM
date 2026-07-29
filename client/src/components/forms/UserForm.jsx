import { useEffect, useState } from 'react';
import { patch, post } from '../../lib/api.js';
import { useSaveMutation } from '../../lib/useSaveMutation.js';
import { ROLES } from '../../lib/constants.js';
import { Button, Field, Input, Modal, Select } from '../ui/index.jsx';

const COLOURS = ['#14544a', '#8c5a2b', '#3d6e96', '#6b4c8a', '#4a7c46', '#a07a25', '#a8443c'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const BLANK = {
  name: '',
  email: '',
  password: '',
  role: 'receptionist',
  specialty: '',
  phone: '',
  colour: COLOURS[0],
  workingDays: [1, 2, 3, 4, 5],
  workingHours: { start: '09:00', end: '17:00' },
};

export default function UserForm({ open, onClose, user }) {
  const isEdit = Boolean(user?._id);
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    setForm(
      user
        ? {
            ...BLANK,
            ...user,
            password: '',
            workingHours: { ...BLANK.workingHours, ...(user.workingHours ?? {}) },
            workingDays: user.workingDays ?? BLANK.workingDays,
          }
        : BLANK
    );
  }, [open, user]);

  const save = useSaveMutation({
    mutationFn: (payload) => (isEdit ? patch(`/users/${user._id}`, payload) : post('/users', payload)),
    invalidate: ['users'],
    successMessage: isEdit ? 'Team member updated' : 'Team member added',
    onSuccess: onClose,
  });

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const toggleDay = (day) =>
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((value) => value !== day)
        : [...current.workingDays, day].sort(),
    }));

  const submit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      specialty: form.specialty,
      phone: form.phone,
      colour: form.colour,
      workingDays: form.workingDays,
      workingHours: form.workingHours,
    };
    // Only send a password when one was actually typed.
    if (form.password) payload.password = form.password;
    save.mutate(payload);
  };

  const errors = save.fieldErrors;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit team member' : 'Add a team member'}
      sub={isEdit ? user.email : 'They will sign in with the email and password you set here'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" form="user-form" type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add member'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Full name" required error={errors.name} className="span-2">
            <Input value={form.name} onChange={set('name')} error={errors.name} placeholder="Dr. Ayesha Siddiqui" required />
          </Field>

          <Field label="Email" required error={errors.email}>
            <Input type="email" value={form.email} onChange={set('email')} error={errors.email} required />
          </Field>

          <Field
            label={isEdit ? 'New password' : 'Password'}
            required={!isEdit}
            error={errors.password}
            hint={isEdit ? 'Leave blank to keep the current one' : 'At least 8 characters'}
          >
            <Input
              type="password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              autoComplete="new-password"
              required={!isEdit}
            />
          </Field>

          <Field label="Role" required>
            <Select value={form.role} onChange={set('role')}>
              {Object.entries(ROLES).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Specialty" hint="Shown beside their name">
            <Input value={form.specialty} onChange={set('specialty')} placeholder="Endodontics" />
          </Field>

          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} />
          </Field>

          <Field label="Diary colour" hint="Identifies them on the schedule">
            <div className="colour-picker">
              {COLOURS.map((colour) => (
                <button
                  key={colour}
                  type="button"
                  className="colour-picker__swatch"
                  style={{ background: colour }}
                  aria-label={`Colour ${colour}`}
                  aria-pressed={form.colour === colour}
                  onClick={() => setForm((current) => ({ ...current, colour }))}
                />
              ))}
            </div>
          </Field>

          <Field label="Working days" className="span-2">
            <div className="day-picker">
              {DAYS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className="day-picker__day"
                  aria-pressed={form.workingDays.includes(index)}
                  onClick={() => toggleDay(index)}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Starts at">
            <Input
              type="time"
              value={form.workingHours.start}
              onChange={(event) => setForm((c) => ({ ...c, workingHours: { ...c.workingHours, start: event.target.value } }))}
            />
          </Field>

          <Field label="Finishes at">
            <Input
              type="time"
              value={form.workingHours.end}
              onChange={(event) => setForm((c) => ({ ...c, workingHours: { ...c.workingHours, end: event.target.value } }))}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
