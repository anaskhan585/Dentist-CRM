import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, getList } from '../lib/api.js';
import { date, dayjs, fullName, money, number, titleCase } from '../lib/format.js';
import { INVOICE_STATUS } from '../lib/constants.js';
import { useSettings } from '../components/forms/pickers.jsx';
import { AreaChart, BarList, DonutChart, seriesColour } from '../components/charts/index.jsx';
import { Badge, Button, Card, CardHead, EmptyState, PageHead, Segmented, Skeleton } from '../components/ui/index.jsx';
import { APPOINTMENT_STATUS } from '../lib/constants.js';
import { IconBilling, IconDownload } from '../lib/icons.jsx';

const RANGES = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];

/** Builds a CSV in the browser — no server round-trip needed for a summary. */
function downloadCsv(rows, filename) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [months, setMonths] = useState(6);
  const { data: settings } = useSettings();
  const symbol = settings?.locale?.currencySymbol ?? 'Rs';

  const from = dayjs().subtract(months - 1, 'month').startOf('month').toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['reports', months],
    queryFn: () => get('/dashboard/reports', { params: { from } }),
  });

  const { data: invoicesPage } = useQuery({
    queryKey: ['invoices', 'outstanding'],
    queryFn: () => getList('/invoices', { params: { status: 'unpaid', limit: 10, sort: 'issuedAt' } }),
  });

  const monthly = (data?.monthlyRevenue ?? []).map((entry) => ({
    label: dayjs(`${entry._id}-01`).format('MMM YY'),
    collected: entry.collected,
    invoices: entry.invoices,
  }));

  const treatments = (data?.treatmentMix ?? []).map((entry) => ({ label: entry._id, value: entry.count }));

  const dentists = (data?.dentistLoad ?? []).map((entry) => ({
    label: entry.name,
    value: entry.appointments,
    colour: entry.colour,
    hours: entry.hours,
  }));

  const statusMix = (data?.statusMix ?? []).map((entry, index) => ({
    label: APPOINTMENT_STATUS[entry._id]?.label ?? titleCase(entry._id),
    value: entry.count,
    colour: seriesColour(index),
  }));

  const payments = (data?.paymentMix ?? []).map((entry, index) => ({
    label: entry._id ? titleCase(entry._id) : 'Unrecorded',
    value: Math.round(entry.total),
    colour: seriesColour(index),
  }));

  const totalCollected = monthly.reduce((sum, entry) => sum + entry.collected, 0);
  const totalAppointments = statusMix.reduce((sum, entry) => sum + entry.value, 0);
  const completed = statusMix.find((entry) => entry.label === 'Completed')?.value ?? 0;
  const outstanding = invoicesPage?.data ?? [];

  const exportSummary = () => {
    downloadCsv(
      [
        ['Month', 'Collected', 'Invoices raised'],
        ...monthly.map((entry) => [entry.label, entry.collected, entry.invoices]),
        [],
        ['Treatment', 'Count'],
        ...treatments.map((entry) => [entry.label, entry.value]),
        [],
        ['Clinician', 'Appointments', 'Chair hours'],
        ...dentists.map((entry) => [entry.label, entry.value, entry.hours]),
      ],
      `vanguard-report-${dayjs().format('YYYY-MM-DD')}.csv`
    );
  };

  if (isLoading) {
    return (
      <>
        <PageHead title="Reports" sub="Loading practice figures…" />
        <div className="dash-grid">
          <Card className="dash-grid__chart">
            <div className="card__body">
              <Skeleton height={220} radius="var(--r-md)" />
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title="Reports" sub={`Practice performance since ${date(from, 'MMMM YYYY')}`}>
        <Segmented value={months} onChange={setMonths} options={RANGES} />
        <Button icon={IconDownload} onClick={exportSummary}>
          Export CSV
        </Button>
      </PageHead>

      <div className="report-summary">
        <div>
          <span className="eyebrow">Collected</span>
          <strong className="display numeric">{money(totalCollected, { symbol, short: true })}</strong>
          <span className="muted">across {months} months</span>
        </div>
        <div>
          <span className="eyebrow">Appointments</span>
          <strong className="display numeric">{number(totalAppointments)}</strong>
          <span className="muted">{completed} completed</span>
        </div>
        <div>
          <span className="eyebrow">Attendance rate</span>
          <strong className="display numeric">
            {totalAppointments ? Math.round((completed / totalAppointments) * 100) : 0}%
          </strong>
          <span className="muted">completed vs booked</span>
        </div>
        <div>
          <span className="eyebrow">Avg. per invoice</span>
          <strong className="display numeric">
            {money(
              monthly.reduce((sum, entry) => sum + entry.invoices, 0)
                ? totalCollected / monthly.reduce((sum, entry) => sum + entry.invoices, 0)
                : 0,
              { symbol, short: true }
            )}
          </strong>
          <span className="muted">mean collected value</span>
        </div>
      </div>

      <div className="dash-grid">
        <Card className="dash-grid__chart">
          <CardHead title="Collections by month" sub="Payments received, not invoices raised" />
          <div className="card__body">
            <AreaChart
              data={monthly}
              yKey="collected"
              label="Collections by month"
              format={(value, axis) => money(value, { symbol, short: axis || value >= 10000 })}
            />
          </div>
        </Card>

        <Card className="dash-grid__side">
          <CardHead title="Appointment outcomes" sub="Across the whole period" />
          <div className="card__body">
            <DonutChart data={statusMix} centreLabel="Appointments" format={(value) => number(value)} />
          </div>
        </Card>

        <Card>
          <CardHead title="Most-performed treatments" sub="By number of appointments" />
          <div className="card__body">
            <BarList data={treatments} format={(value) => number(value)} />
          </div>
        </Card>

        <Card>
          <CardHead title="Clinician workload" sub="Appointments booked per clinician" />
          <div className="card__body">
            <BarList data={dentists} categorical format={(value) => `${number(value)}`} />
          </div>
        </Card>

        <Card>
          <CardHead title="How patients pay" sub="Share of collected value" />
          <div className="card__body">
            <DonutChart data={payments} centreLabel="Collected" format={(value) => money(value, { symbol, short: true })} />
          </div>
        </Card>

        <Card flush>
          <CardHead title="Oldest unpaid invoices" sub="Chase these first" />
          {outstanding.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Patient</th>
                    <th>Issued</th>
                    <th className="table__num">Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.map((invoice) => (
                    <tr key={invoice._id}>
                      <td className="numeric">{invoice.invoiceNo}</td>
                      <td>{fullName(invoice.patient)}</td>
                      <td className="muted">{date(invoice.issuedAt, 'D MMM YYYY')}</td>
                      <td className="table__num">
                        <strong style={{ color: 'var(--rose)' }}>{money(invoice.balance, { symbol })}</strong>
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
            <EmptyState icon={IconBilling} title="Everything is settled" text="No unpaid invoices on the books." />
          )}
        </Card>
      </div>
    </>
  );
}
