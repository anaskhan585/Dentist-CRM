import { useEffect, useState } from 'react';
import { post } from '../../lib/api.js';
import { useSaveMutation } from '../../lib/useSaveMutation.js';
import { money } from '../../lib/format.js';
import { IconPlus, IconTrash } from '../../lib/icons.jsx';
import { Button, Field, Input, Modal, Select, Textarea } from '../ui/index.jsx';
import { DentistSelect, PatientPicker, useSettings } from './pickers.jsx';

const PRICE_LIST = [
  { description: 'Consultation', unitPrice: 2000 },
  { description: 'Scaling & Polishing', unitPrice: 6500 },
  { description: 'Composite Filling', unitPrice: 5500 },
  { description: 'Root Canal', unitPrice: 22000 },
  { description: 'Crown Fitting', unitPrice: 35000 },
  { description: 'Extraction', unitPrice: 4500 },
  { description: 'Implant', unitPrice: 145000 },
  { description: 'Teeth Whitening', unitPrice: 18000 },
  { description: 'Denture Fitting', unitPrice: 48000 },
];

const blankItem = () => ({ description: '', quantity: 1, unitPrice: 0, discount: 0 });

export default function InvoiceForm({ open, onClose, patientId }) {
  const [form, setForm] = useState({ patient: '', dentist: '', items: [blankItem()], amountPaid: 0, paymentMethod: '', notes: '' });
  const { data: settings } = useSettings();
  const symbol = settings?.locale?.currencySymbol ?? 'Rs';
  const taxRate = settings?.billing?.taxRate ?? 0;

  useEffect(() => {
    if (open) {
      setForm({ patient: patientId ?? '', dentist: '', items: [blankItem()], amountPaid: 0, paymentMethod: '', notes: '' });
    }
  }, [open, patientId]);

  const save = useSaveMutation({
    mutationFn: (payload) => post('/invoices', payload),
    invalidate: ['invoices', 'patients', 'dashboard'],
    successMessage: 'Invoice created',
    onSuccess: onClose,
  });

  const setItem = (index, key, value) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));

  const subtotal = form.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0),
    0
  );
  const total = Math.round(subtotal * (1 + taxRate / 100));

  const submit = (event) => {
    event.preventDefault();
    save.mutate({
      patient: form.patient,
      dentist: form.dentist || '',
      items: form.items
        .filter((item) => item.description.trim())
        .map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
        })),
      taxRate,
      amountPaid: Number(form.amountPaid) || 0,
      paymentMethod: form.paymentMethod || undefined,
      notes: form.notes,
    });
  };

  const errors = save.fieldErrors;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title="Create an invoice"
      sub="Line items price up from the practice's standard list"
      footer={
        <>
          <div style={{ marginRight: 'auto', textAlign: 'left' }}>
            <span className="eyebrow">Total due</span>
            <p className="display numeric" style={{ fontSize: 'var(--text-xl)' }}>
              {money(total, { symbol })}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" form="invoice-form" type="submit" loading={save.isPending}>
            Create invoice
          </Button>
        </>
      }
    >
      <form id="invoice-form" onSubmit={submit}>
        <div className="form-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <Field label="Patient" required error={errors.patient} className="span-2">
            <PatientPicker
              value={form.patient}
              onChange={(value) => setForm((current) => ({ ...current, patient: value }))}
              error={errors.patient}
            />
          </Field>
          <Field label="Treating clinician">
            <DentistSelect value={form.dentist} onChange={(value) => setForm((current) => ({ ...current, dentist: value }))} />
          </Field>
          <Field label="Payment method">
            <Select value={form.paymentMethod} onChange={(event) => setForm((c) => ({ ...c, paymentMethod: event.target.value }))}>
              <option value="">Not paid yet</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank-transfer">Bank transfer</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </Select>
          </Field>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">Line items</legend>

          {errors.items && <p className="field__error" style={{ marginBottom: 'var(--sp-3)' }}>{errors.items}</p>}

          <div className="line-items">
            {form.items.map((item, index) => (
              <div className="line-item" key={index}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <input
                    className="input"
                    list="price-list"
                    value={item.description}
                    placeholder="Treatment or item"
                    onChange={(event) => {
                      const { value } = event.target;
                      const match = PRICE_LIST.find((entry) => entry.description === value);
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((row, i) =>
                          i === index ? { ...row, description: value, unitPrice: match ? match.unitPrice : row.unitPrice } : row
                        ),
                      }));
                    }}
                  />
                </div>
                <input
                  className="input line-item__qty"
                  type="number"
                  min="1"
                  value={item.quantity}
                  aria-label="Quantity"
                  onChange={(event) => setItem(index, 'quantity', event.target.value)}
                />
                <input
                  className="input line-item__price numeric"
                  type="number"
                  min="0"
                  value={item.unitPrice}
                  aria-label="Unit price"
                  onChange={(event) => setItem(index, 'unitPrice', event.target.value)}
                />
                <input
                  className="input line-item__price numeric"
                  type="number"
                  min="0"
                  value={item.discount}
                  aria-label="Discount"
                  onChange={(event) => setItem(index, 'discount', event.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Remove line"
                  disabled={form.items.length === 1}
                  onClick={() => setForm((c) => ({ ...c, items: c.items.filter((_, i) => i !== index) }))}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>

          <datalist id="price-list">
            {PRICE_LIST.map((entry) => (
              <option key={entry.description} value={entry.description} />
            ))}
          </datalist>

          <Button
            size="sm"
            icon={IconPlus}
            type="button"
            style={{ marginTop: 'var(--sp-3)' }}
            onClick={() => setForm((c) => ({ ...c, items: [...c.items, blankItem()] }))}
          >
            Add line
          </Button>
        </fieldset>

        <div className="form-grid">
          <Field label="Amount paid now" hint={`Balance: ${money(Math.max(0, total - (Number(form.amountPaid) || 0)), { symbol })}`}>
            <Input
              type="number"
              min="0"
              max={total}
              value={form.amountPaid}
              onChange={(event) => setForm((c) => ({ ...c, amountPaid: event.target.value }))}
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(event) => setForm((c) => ({ ...c, notes: event.target.value }))}
              style={{ minHeight: 38 }}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
