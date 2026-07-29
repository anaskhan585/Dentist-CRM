import { useEffect, useState } from 'react';
import { post } from '../../lib/api.js';
import { useSaveMutation } from '../../lib/useSaveMutation.js';
import { RECORD_TYPES } from '../../lib/constants.js';
import { IconPlus, IconTrash } from '../../lib/icons.jsx';
import { Button, Field, Input, Modal, Select, Textarea } from '../ui/index.jsx';
import { PatientPicker } from './pickers.jsx';

const BLANK = {
  patient: '',
  recordType: 'clinical-note',
  title: '',
  chiefComplaint: '',
  findings: '',
  diagnosis: '',
  treatmentDone: '',
  plan: '',
  teeth: '',
  prescriptions: [],
};

export default function HealthRecordForm({ open, onClose, patientId }) {
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (open) setForm({ ...BLANK, patient: patientId ?? '' });
  }, [open, patientId]);

  const save = useSaveMutation({
    mutationFn: (payload) => post('/health-records', payload),
    invalidate: ['health-records', 'patients'],
    successMessage: 'Record saved to the patient file',
    onSuccess: onClose,
  });

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const setPrescription = (index, key, value) =>
    setForm((current) => ({
      ...current,
      prescriptions: current.prescriptions.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));

  const submit = (event) => {
    event.preventDefault();
    save.mutate({
      patient: form.patient,
      recordType: form.recordType,
      title: form.title,
      chiefComplaint: form.chiefComplaint,
      findings: form.findings,
      diagnosis: form.diagnosis,
      treatmentDone: form.treatmentDone,
      plan: form.plan,
      teeth: form.teeth
        .split(/[,\s]+/)
        .map((tooth) => Number(tooth.trim()))
        .filter((tooth) => Number.isInteger(tooth) && tooth >= 11 && tooth <= 48),
      prescriptions: form.prescriptions.filter((item) => item.drug?.trim()),
    });
  };

  const errors = save.fieldErrors;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title="New clinical record"
      sub="Structured as a SOAP note — complaint, findings, diagnosis, treatment, plan"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" form="record-form" type="submit" loading={save.isPending}>
            Save record
          </Button>
        </>
      }
    >
      <form id="record-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Patient" required error={errors.patient} className="span-2">
            <PatientPicker value={form.patient} onChange={(value) => setForm((c) => ({ ...c, patient: value }))} error={errors.patient} />
          </Field>

          <Field label="Record type">
            <Select value={form.recordType} onChange={set('recordType')}>
              {Object.entries(RECORD_TYPES).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Teeth involved (FDI)" hint="e.g. 26, 27">
            <Input value={form.teeth} onChange={set('teeth')} placeholder="26, 27" />
          </Field>

          <Field label="Title" required error={errors.title} className="span-2">
            <Input value={form.title} onChange={set('title')} placeholder="Routine examination & scaling" error={errors.title} required />
          </Field>

          <Field label="Chief complaint" className="span-2">
            <Textarea value={form.chiefComplaint} onChange={set('chiefComplaint')} style={{ minHeight: 56 }} placeholder="In the patient's own words" />
          </Field>

          <Field label="Clinical findings" className="span-2">
            <Textarea value={form.findings} onChange={set('findings')} style={{ minHeight: 66 }} />
          </Field>

          <Field label="Diagnosis">
            <Input value={form.diagnosis} onChange={set('diagnosis')} />
          </Field>

          <Field label="Treatment carried out">
            <Input value={form.treatmentDone} onChange={set('treatmentDone')} />
          </Field>

          <Field label="Plan / next visit" className="span-2">
            <Textarea value={form.plan} onChange={set('plan')} style={{ minHeight: 56 }} />
          </Field>
        </div>

        <fieldset className="fieldset" style={{ marginTop: 'var(--sp-6)', marginBottom: 0 }}>
          <legend className="fieldset__legend">Prescriptions</legend>

          {form.prescriptions.map((item, index) => (
            <div className="line-item" key={index} style={{ marginBottom: 'var(--sp-2)' }}>
              <input
                className="input"
                style={{ flex: 2, minWidth: 150 }}
                placeholder="Drug"
                value={item.drug ?? ''}
                onChange={(event) => setPrescription(index, 'drug', event.target.value)}
              />
              <input
                className="input"
                style={{ flex: 1, minWidth: 90 }}
                placeholder="Dosage"
                value={item.dosage ?? ''}
                onChange={(event) => setPrescription(index, 'dosage', event.target.value)}
              />
              <input
                className="input"
                style={{ flex: 1, minWidth: 110 }}
                placeholder="Frequency"
                value={item.frequency ?? ''}
                onChange={(event) => setPrescription(index, 'frequency', event.target.value)}
              />
              <input
                className="input"
                style={{ flex: 1, minWidth: 80 }}
                placeholder="Duration"
                value={item.duration ?? ''}
                onChange={(event) => setPrescription(index, 'duration', event.target.value)}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label="Remove prescription"
                onClick={() => setForm((c) => ({ ...c, prescriptions: c.prescriptions.filter((_, i) => i !== index) }))}
              >
                <IconTrash />
              </button>
            </div>
          ))}

          <Button
            size="sm"
            type="button"
            icon={IconPlus}
            style={{ marginTop: 'var(--sp-2)' }}
            onClick={() => setForm((c) => ({ ...c, prescriptions: [...c.prescriptions, { drug: '', dosage: '', frequency: '', duration: '' }] }))}
          >
            Add prescription
          </Button>
        </fieldset>
      </form>
    </Modal>
  );
}
