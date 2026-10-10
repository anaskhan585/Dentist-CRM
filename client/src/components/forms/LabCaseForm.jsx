import { useEffect, useState } from 'react';
import { patch, post } from '../../lib/api.js';
import { useSaveMutation } from '../../lib/useSaveMutation.js';
import { dayjs } from '../../lib/format.js';
import { LAB_STAGES, WORK_TYPES } from '../../lib/constants.js';
import { Button, Field, Input, Modal, Select, Textarea } from '../ui/index.jsx';
import { DentistSelect, PatientPicker } from './pickers.jsx';

const LABS = ['Precision Dental Lab', 'Summit Ceramics Studio', 'Northgate Ortho Lab'];
const SHADES = ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'C1', 'C2', 'D2'];

const BLANK = {
  patient: '',
  dentist: '',
  labName: '',
  labContact: '',
  labPhone: '',
  workType: 'Crown',
  shade: 'A2',
  teeth: '',
  stage: 'impression-taken',
  dueAt: dayjs().add(10, 'day').format('YYYY-MM-DD'),
  cost: 0,
  priority: 'standard',
  notes: '',
};

export default function LabCaseForm({ open, onClose, labCase }) {
  const isEdit = Boolean(labCase?._id);
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    setForm(
      labCase
        ? {
            patient: labCase.patient?._id ?? '',
            dentist: labCase.dentist?._id ?? '',
            labName: labCase.lab?.name ?? '',
            labContact: labCase.lab?.contact ?? '',
            labPhone: labCase.lab?.phone ?? '',
            workType: labCase.workType,
            shade: labCase.shade ?? '',
            teeth: (labCase.teeth ?? []).join(', '),
            stage: labCase.stage,
            dueAt: dayjs(labCase.dueAt).format('YYYY-MM-DD'),
            cost: labCase.cost ?? 0,
            priority: labCase.priority ?? 'standard',
            notes: labCase.notes ?? '',
          }
        : BLANK
    );
  }, [open, labCase]);

  const save = useSaveMutation({
    mutationFn: (payload) => (isEdit ? patch(`/lab-cases/${labCase._id}`, payload) : post('/lab-cases', payload)),
    invalidate: ['lab-cases', 'dashboard'],
    successMessage: isEdit ? 'Lab case updated' : 'Lab case created',
    onSuccess: onClose,
  });

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    save.mutate({
      patient: form.patient,
      dentist: form.dentist,
      lab: { name: form.labName, contact: form.labContact, phone: form.labPhone },
      workType: form.workType,
      shade: form.shade,
      teeth: form.teeth
        .split(/[,\s]+/)
        .map((tooth) => Number(tooth.trim()))
        .filter((tooth) => Number.isInteger(tooth) && tooth >= 11 && tooth <= 48),
      stage: form.stage,
      dueAt: form.dueAt,
      cost: Number(form.cost) || 0,
      priority: form.priority,
      notes: form.notes,
    });
  };

  const errors = save.fieldErrors;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={isEdit ? `Lab case ${labCase.caseNo}` : 'New lab case'}
      sub="Track work from impression through to fitting"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" form="lab-form" type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create case'}
          </Button>
        </>
      }
    >
      <form id="lab-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Patient" required error={errors.patient} className="span-2">
            <PatientPicker value={form.patient} onChange={(value) => setForm((c) => ({ ...c, patient: value }))} error={errors.patient} />
          </Field>

          <Field label="Prescribing clinician" required error={errors.dentist}>
            <DentistSelect value={form.dentist} onChange={(value) => setForm((c) => ({ ...c, dentist: value }))} error={errors.dentist} />
          </Field>

          <Field label="Work type" required>
            <Select value={form.workType} onChange={set('workType')}>
              {WORK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Laboratory" required error={errors['lab.name']}>
            <Input list="labs" value={form.labName} onChange={set('labName')} placeholder="Lab name" required />
          </Field>

          <Field label="Lab contact">
            <Input value={form.labContact} onChange={set('labContact')} placeholder="Who to chase" />
          </Field>

          <Field label="Shade">
            <Input list="shades" value={form.shade} onChange={set('shade')} placeholder="A2" />
          </Field>

          <Field label="Teeth (FDI)" hint="e.g. 16, 17">
            <Input value={form.teeth} onChange={set('teeth')} placeholder="16, 17" />
          </Field>

          <Field label="Stage">
            <Select value={form.stage} onChange={set('stage')}>
              {LAB_STAGES.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Due date" required>
            <Input type="date" value={form.dueAt} onChange={set('dueAt')} required />
          </Field>

          <Field label="Lab cost">
            <Input type="number" min="0" value={form.cost} onChange={set('cost')} />
          </Field>

          <Field label="Priority">
            <Select value={form.priority} onChange={set('priority')}>
              <option value="standard">Standard</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>

          <Field label="Instructions to the lab" className="span-2">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Shade matching, contact points, anything unusual" />
          </Field>
        </div>

        <datalist id="labs">
          {LABS.map((lab) => (
            <option key={lab} value={lab} />
          ))}
        </datalist>
        <datalist id="shades">
          {SHADES.map((shade) => (
            <option key={shade} value={shade} />
          ))}
        </datalist>
      </form>
    </Modal>
  );
}
