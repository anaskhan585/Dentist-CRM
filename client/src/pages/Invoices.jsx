import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getList, post } from '../lib/api.js';
import { date, fullName, money } from '../lib/format.js';
import { INVOICE_STATUS } from '../lib/constants.js';
import { useSaveMutation } from '../lib/useSaveMutation.js';
import { useSettings } from '../components/forms/pickers.jsx';
import InvoiceForm from '../components/forms/InvoiceForm.jsx';
import ConfirmDeleteInvoice from '../components/forms/ConfirmDeleteInvoice.jsx';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHead,
  Pagination,
  Select,
  TableSkeleton,
} from '../components/ui/index.jsx';
import { IconBilling, IconPlus, IconSearch, IconTrash } from '../lib/icons.jsx';

/** Takes a payment against one invoice; the server re-derives status and balance. */
function PaymentModal({ invoice, symbol, onClose }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');

  const pay = useSaveMutation({
    mutationFn: (body) => post(`/invoices/${invoice._id}/payments`, body),
    invalidate: ['invoices', 'patients', 'dashboard'],
    successMessage: 'Payment recorded',
    onSuccess: onClose,
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="narrow"
      title={`Record a payment`}
      sub={`${invoice.invoiceNo} · ${fullName(invoice.patient)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={pay.isPending}
            onClick={() => pay.mutate({ amount: Number(amount), paymentMethod: method })}
          >
            Record payment
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field
          label="Amount"
          required
          hint={`Outstanding: ${money(invoice.balance, { symbol })}`}
          className="span-2"
        >
          <Input
            type="number"
            min="0"
            max={invoice.balance}
            step="0.01"
            value={amount}
            autoFocus
            placeholder="0.00"
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>

        <Field label="Payment method" className="span-2">
          <Select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank-transfer">Bank transfer</option>
            <option value="insurance">Insurance</option>
            <option value="other">Other</option>
          </Select>
        </Field>

        <div className="span-2">
          <Button
            size="sm"
            type="button"
            onClick={() => setAmount(String(invoice.balance))}
            disabled={invoice.balance <= 0}
          >
            Pay the full balance
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Invoices() {
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-issuedAt');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: settings } = useSettings();
  const symbol = settings?.locale?.currencySymbol ?? '$';

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(term.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [term]);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', 'list', { search, status, sort, page }],
    queryFn: () =>
      getList('/invoices', {
        params: { search: search || undefined, status: status || undefined, sort, page, limit: 20 },
      }),
    placeholderData: keepPreviousData,
  });

  const invoices = data?.data ?? [];
  // The server sums the whole filtered set, so this is not just the page shown.
  const summary = data?.meta?.summary;

  return (
    <>
      <PageHead
        title="Invoices"
        sub={
          data?.meta
            ? `Every patient · ${data.meta.total} invoices · ${money(summary?.billed, { symbol })} billed · ${money(
                summary?.collected,
                { symbol }
              )} collected · ${money(summary?.outstanding, { symbol })} outstanding`
            : 'Billing'
        }
      >
        <Button icon={IconPlus} variant="primary" onClick={() => setCreating(true)}>
          New invoice
        </Button>
      </PageHead>

      <Card flush>
        <div className="toolbar">
          <div className="toolbar__search">
            <IconSearch />
            <input
              type="search"
              value={term}
              placeholder="Search by invoice number"
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search invoices"
            />
          </div>

          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">Any status</option>
            {Object.entries(INVOICE_STATUS).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>

          <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort invoices">
            <option value="-issuedAt">Newest first</option>
            <option value="issuedAt">Oldest first</option>
            <option value="invoiceNo">Invoice number</option>
          </Select>
        </div>

        <div className="table-wrap">
          <table className="table table--clickable">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Issued</th>
                <th className="table__num">Total</th>
                <th className="table__num">Balance</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            {isLoading ? (
              <TableSkeleton cols={7} rows={8} />
            ) : (
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open invoice ${invoice.invoiceNo}`}
                    onClick={() => setEditing(invoice)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setEditing(invoice);
                      }
                    }}
                  >
                    <td>
                      <span className="numeric" style={{ fontWeight: 600 }}>
                        {invoice.invoiceNo}
                      </span>
                      <span className="table__sub truncate">
                        {invoice.items?.map((item) => item.description).join(', ')}
                      </span>
                    </td>
                    <td>
                      {invoice.patient?._id ? (
                        <Link
                          to={`/patients/${invoice.patient._id}`}
                          className="person"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Avatar name={fullName(invoice.patient)} size="sm" />
                          <span className="person__name">{fullName(invoice.patient)}</span>
                        </Link>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="muted table__nowrap">{date(invoice.issuedAt, 'D MMM YYYY')}</td>
                    <td className="table__num">{money(invoice.total, { symbol })}</td>
                    <td className="table__num">
                      {invoice.status === 'void' ? (
                        <span className="muted">—</span>
                      ) : invoice.balance > 0 ? (
                        <strong style={{ color: 'var(--rose)' }}>{money(invoice.balance, { symbol })}</strong>
                      ) : (
                        <span className="muted">{money(0, { symbol })}</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={INVOICE_STATUS[invoice.status]?.tone} dot>
                        {INVOICE_STATUS[invoice.status]?.label}
                      </Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        {invoice.balance > 0 && invoice.status !== 'void' && (
                          <Button
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPaying(invoice);
                            }}
                          >
                            Record payment
                          </Button>
                        )}
                        {invoice.status !== 'void' && (
                          <button
                            type="button"
                            className="icon-btn"
                            data-tone="danger"
                            title="Delete this invoice"
                            aria-label={`Delete invoice ${invoice.invoiceNo}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleting(invoice);
                            }}
                          >
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {!isLoading && !invoices.length && (
            <EmptyState
              icon={IconBilling}
              title="No invoices found"
              text={
                search || status
                  ? 'Nothing matches these filters.'
                  : 'Charges raised for patients will appear here.'
              }
            >
              <Button variant="primary" icon={IconPlus} onClick={() => setCreating(true)} style={{ marginTop: 'var(--sp-2)' }}>
                Create the first invoice
              </Button>
            </EmptyState>
          )}
        </div>

        <Pagination meta={data?.meta} onChange={setPage} />
      </Card>

      <InvoiceForm open={creating} onClose={() => setCreating(false)} />
      {editing && <InvoiceForm open invoice={editing} onClose={() => setEditing(null)} />}
      {paying && <PaymentModal invoice={paying} symbol={symbol} onClose={() => setPaying(null)} />}
      {deleting && <ConfirmDeleteInvoice invoice={deleting} symbol={symbol} onClose={() => setDeleting(null)} />}
    </>
  );
}
