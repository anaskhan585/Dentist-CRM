import { del } from '../../lib/api.js';
import { useSaveMutation } from '../../lib/useSaveMutation.js';
import { fullName, money } from '../../lib/format.js';
import { Button, Modal } from '../ui/index.jsx';

/**
 * Asks before withdrawing an invoice. The record is kept and marked cancelled
 * rather than destroyed — a practice has to be able to show an auditor what
 * was raised and later withdrawn, so nothing leaves the books silently.
 *
 * Render this at page level, never inside a clickable row: a portalled modal
 * still bubbles its clicks up the React tree to whatever row contains it.
 */
export default function ConfirmDeleteInvoice({ invoice, symbol, onClose }) {
  const remove = useSaveMutation({
    mutationFn: () => del(`/invoices/${invoice._id}`),
    invalidate: ['invoices', 'patients', 'dashboard'],
    successMessage: 'Invoice deleted',
    onSuccess: onClose,
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="narrow"
      title="Delete this invoice?"
      sub={`${invoice.invoiceNo}${invoice.patient ? ` · ${fullName(invoice.patient)}` : ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button variant="primary" data-tone="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
            Delete invoice
          </Button>
        </>
      }
    >
      <p>
        {money(invoice.total, { symbol })} for{' '}
        {invoice.items?.map((item) => item.description).join(', ') || 'this invoice'} will be taken off the
        patient&rsquo;s balance and out of your reports.
      </p>
      <p className="muted" style={{ marginTop: 'var(--sp-3)' }}>
        It stays on file marked <strong>Cancelled</strong> so the practice keeps a complete billing history.
      </p>
    </Modal>
  );
}
