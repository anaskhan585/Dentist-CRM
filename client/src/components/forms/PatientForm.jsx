import { useEffect, useState } from 'react';
import { patch, post } from '../../lib/api.js';
import { useSaveMutation } from '../../lib/useSaveMutation.js';
import { dayjs } from '../../lib/format.js';
import { Button, Field, Input, Modal, Select, Textarea } from '../ui/index.jsx';
import { DentistSelect } from './pickers.jsx';

const BLANK = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  gender: 'undisclosed',
  bloodGroup: '',
  address: { line1: '', city: '', state: '', postalCode: '' },
  allergies: '',
  medicalConditions: '',
  medications: '',
  emergencyContact: { name: '', relation: '', phone: '' },
  insurance: { provider: '', policyNo: '' },
  primaryDentist: '',
  tags: '',
  notes: '',
};

const toList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function PatientForm({ open, onClose, patient }) {
  const isEdit = Boolean(patient?._id);
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    setForm(
      patient
        ? {
            ...BLANK,
            ...patient,
            dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth).format('YYYY-MM-DD') : '',
            address: { ...BLANK.address, ...(patient.address ?? {}) },
            emergencyContact: { ...BLANK.emergencyContact, ...(patient.emergencyContact ?? {}) },
            insurance: { ...BLANK.insurance, ...(patient.insurance ?? {}) },
            primaryDentist: patient.primaryDentist?._id ?? patient.primaryDentist ?? '',
            allergies: (patient.allergies ?? []).join(', '),
            medicalConditions: (patient.medicalConditions ?? []).join(', '),
            medications: (patient.medications ?? []).join(', '),
            tags: (patient.tags ?? []).join(', '),
          }
        : BLANK
    );
  }, [open, patient]);

  const save = useSaveMutation({
    mutationFn: (payload) => (isEdit ? patch(`/patients/${patient._id}`, payload) : post('/patients', payload)),
    invalidate: ['patients', 'dashboard'],
    successMessage: isEdit ? 'Patient details updated' : 'Patient registered',
    onSuccess: onClose,
  });

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const setNested = (group, key) => (event) =>
    setForm((current) => ({ ...current, [group]: { ...current[group], [key]: event.target.value } }));

  const submit = (event) => {
    event.preventDefault();
    save.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender,
      bloodGroup: form.bloodGroup || undefined,
      address: form.address,
      allergies: toList(form.allergies),
      medicalConditions: toList(form.medicalConditions),
      medications: toList(form.medications),
      emergencyContact: form.emergencyContact,
      insurance: { provider: form.insurance.provider, policyNo: form.insurance.policyNo },
      primaryDentist: form.primaryDentist || '',
      tags: toList(form.tags),
      notes: form.notes,
    });
  };

  const errors = save.fieldErrors;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={isEdit ? 'Edit patient' : 'Register a patient'}
      sub={isEdit ? patient.fileNo : 'A file number is generated automatically'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" form="patient-form" type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Register patient'}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={submit}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Personal details</legend>
          <div className="form-grid">
            <Field label="First name" required error={errors.firstName}>
              <Input value={form.firstName} onChange={set('firstName')} error={errors.firstName} autoFocus required />
            </Field>
            <Field label="Last name" required error={errors.lastName}>
              <Input value={form.lastName} onChange={set('lastName')} error={errors.lastName} required />
            </Field>
            <Field label="Phone" required error={errors.phone} hint="Used for appointment reminders">
              <Input value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="(415) 555-0142" required />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={set('email')} error={errors.email} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} max={dayjs().format('YYYY-MM-DD')} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set('gender')}>
                <option value="undisclosed">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </Select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">Medical history</legend>
          <div className="form-grid">
            <Field label="Allergies" hint="Separate with commas" className="span-2">
              <Input value={form.allergies} onChange={set('allergies')} placeholder="Penicillin, Latex" />
            </Field>
            <Field label="Medical conditions" hint="Separate with commas">
              <Input value={form.medicalConditions} onChange={set('medicalConditions')} placeholder="Type 2 Diabetes" />
            </Field>
            <Field label="Current medications" hint="Separate with commas">
              <Input value={form.medications} onChange={set('medications')} />
            </Field>
            <Field label="Blood group">
              <Select value={form.bloodGroup} onChange={set('bloodGroup')}>
                <option value="">Unknown</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Primary dentist">
              <DentistSelect value={form.primaryDentist} onChange={(value) => setForm((c) => ({ ...c, primaryDentist: value }))} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">Contact & cover</legend>
          <div className="form-grid">
            <Field label="Address" className="span-2">
              <Input value={form.address.line1} onChange={setNested('address', 'line1')} placeholder="House, street" />
            </Field>
            <Field label="City">
              <Input value={form.address.city} onChange={setNested('address', 'city')} />
            </Field>
            <Field label="Postal code">
              <Input value={form.address.postalCode} onChange={setNested('address', 'postalCode')} />
            </Field>
            <Field label="Emergency contact">
              <Input value={form.emergencyContact.name} onChange={setNested('emergencyContact', 'name')} placeholder="Name" />
            </Field>
            <Field label="Emergency phone">
              <Input value={form.emergencyContact.phone} onChange={setNested('emergencyContact', 'phone')} />
            </Field>
            <Field label="Insurance provider">
              <Input value={form.insurance.provider} onChange={setNested('insurance', 'provider')} />
            </Field>
            <Field label="Policy number">
              <Input value={form.insurance.policyNo} onChange={setNested('insurance', 'policyNo')} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="fieldset" style={{ marginBottom: 0 }}>
          <legend className="fieldset__legend">Notes</legend>
          <div className="form-grid">
            <Field label="Tags" hint="e.g. ortho, nervous, vip" className="span-2">
              <Input value={form.tags} onChange={set('tags')} />
            </Field>
            <Field label="Front-desk notes" className="span-2">
              <Textarea value={form.notes} onChange={set('notes')} placeholder="Anything the team should know before this patient arrives" />
            </Field>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
